import { v } from "convex/values";

import { CMS_KEYS, isCmsKey, validateCms, type CmsKey } from "../lib/school/cms/schema";
import { withDefaults } from "../lib/school/cms/defaults";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { fail, getViewer, hasRole, isAdmin, requireCmsEditor, requireSiteAdmin, SITE_ROLES } from "./lib/access";
import { audit, nowISO } from "./lib/util";

/**
 * Website content (the Site portal). Each document keeps a published value that
 * the website reads and an optional draft that only editors — and their preview
 * sessions — can see. Publishing copies the draft live and records a version.
 */

const PREVIEW_HOURS = 2;
const VERSIONS_KEPT = 30;

function assertKey(key: string): CmsKey {
  if (!isCmsKey(key)) fail("NOT_FOUND", "That website section does not exist.");
  return key;
}

async function docFor(ctx: QueryCtx | MutationCtx, key: string): Promise<Doc<"cmsDocuments"> | null> {
  return await ctx.db.query("cmsDocuments").withIndex("by_key", (q) => q.eq("key", key)).unique();
}

/* ------------------------------- public reads ----------------------------- */

/** The live value of a document, or null when nothing has been published yet. */
export const published = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => (await docFor(ctx, key))?.published ?? null,
});

/** The draft (falling back to the live value) for a browser holding a valid preview token. */
export const preview = query({
  args: { key: v.string(), token: v.string() },
  handler: async (ctx, { key, token }) => {
    const grant = await ctx.db.query("cmsPreviewTokens").withIndex("by_token", (q) => q.eq("token", token)).unique();
    if (!grant || grant.expiresAt < nowISO()) return null;
    const doc = await docFor(ctx, key);
    return doc?.draft ?? doc?.published ?? null;
  },
});

/* ------------------------------- editor reads ----------------------------- */

/** Status of every document for the Site portal dashboard. */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAdmin(ctx);
    const docs = await ctx.db.query("cmsDocuments").collect();
    return CMS_KEYS.map((key) => {
      const doc = docs.find((d) => d.key === key);
      return {
        key,
        hasDraft: doc?.draft !== undefined,
        isPublished: doc?.published !== undefined,
        publishedAt: doc?.publishedAt ?? null,
        publishedBy: doc?.publishedBy ?? null,
        draftUpdatedAt: doc?.draftUpdatedAt ?? null,
        draftUpdatedBy: doc?.draftUpdatedBy ?? null,
      };
    });
  },
});

/** Everything an editor needs to open a document: the working copy, its status and version history. */
export const editor = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const key = assertKey(args.key);
    await requireCmsEditor(ctx, key);
    const doc = await docFor(ctx, key);
    const versions = await ctx.db
      .query("cmsVersions")
      .withIndex("by_key", (q) => q.eq("key", key))
      .order("desc")
      .take(VERSIONS_KEPT);
    return {
      key,
      // Whatever the editor last saved, else what is live, else what the site shipped with.
      value: withDefaults(key, doc?.draft ?? doc?.published),
      hasDraft: doc?.draft !== undefined,
      isPublished: doc?.published !== undefined,
      publishedAt: doc?.publishedAt ?? null,
      publishedBy: doc?.publishedBy ?? null,
      draftUpdatedAt: doc?.draftUpdatedAt ?? null,
      draftUpdatedBy: doc?.draftUpdatedBy ?? null,
      versions: versions.map((ver) => ({ id: ver._id, publishedAt: ver.publishedAt, publishedBy: ver.publishedBy, note: ver.note ?? null })),
    };
  },
});

/* --------------------------------- writes --------------------------------- */

export const saveDraft = mutation({
  args: { key: v.string(), data: v.any() },
  handler: async (ctx, args) => {
    const key = assertKey(args.key);
    const viewer = await requireCmsEditor(ctx, key);
    const checked = validateCms(key, args.data);
    if (!checked.ok) fail("INVALID", checked.message);
    const doc = await docFor(ctx, key);
    const patch = { draft: checked.data, draftUpdatedAt: nowISO(), draftUpdatedBy: viewer.name };
    if (doc) await ctx.db.patch(doc._id, patch);
    else await ctx.db.insert("cmsDocuments", { key, ...patch });
    return { savedAt: patch.draftUpdatedAt };
  },
});

export const discardDraft = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const key = assertKey(args.key);
    await requireCmsEditor(ctx, key);
    const doc = await docFor(ctx, key);
    if (doc?.draft !== undefined) await ctx.db.patch(doc._id, { draft: undefined, draftUpdatedAt: undefined, draftUpdatedBy: undefined });
  },
});

async function makeLive(ctx: MutationCtx, key: CmsKey, data: unknown, by: string, note?: string) {
  const at = nowISO();
  const doc = await docFor(ctx, key);
  const live = { published: data, publishedAt: at, publishedBy: by };
  if (doc) await ctx.db.patch(doc._id, live);
  else await ctx.db.insert("cmsDocuments", { key, ...live });
  await ctx.db.insert("cmsVersions", { key, data, publishedAt: at, publishedBy: by, note });

  // Keep the history bounded.
  const old = await ctx.db
    .query("cmsVersions")
    .withIndex("by_key", (q) => q.eq("key", key))
    .order("desc")
    .collect();
  for (const stale of old.slice(VERSIONS_KEPT)) await ctx.db.delete(stale._id);
  return at;
}

/** Publish the current draft. */
export const publish = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const key = assertKey(args.key);
    const viewer = await requireCmsEditor(ctx, key);
    const doc = await docFor(ctx, key);
    if (doc?.draft === undefined) fail("INVALID", "There are no unpublished changes.");
    const checked = validateCms(key, doc.draft);
    if (!checked.ok) fail("INVALID", checked.message);
    const at = await makeLive(ctx, key, checked.data, viewer.name);
    await ctx.db.patch(doc._id, { draft: undefined, draftUpdatedAt: undefined, draftUpdatedBy: undefined });
    await audit(ctx, viewer, { action: "website.publish", entity: "cmsDocuments", entityId: key });
    return { publishedAt: at };
  },
});

/** Make an earlier version live again. Any unpublished draft is left untouched. */
export const restoreVersion = mutation({
  args: { versionId: v.id("cmsVersions") },
  handler: async (ctx, { versionId }) => {
    const version = await ctx.db.get(versionId);
    if (!version) fail("NOT_FOUND", "That version no longer exists.");
    const key = assertKey(version.key);
    const viewer = await requireCmsEditor(ctx, key);
    const checked = validateCms(key, withDefaults(key, version.data));
    if (!checked.ok) fail("INVALID", `That version can no longer be published (${checked.message}).`);
    const at = await makeLive(ctx, key, checked.data, viewer.name, `Restored the version from ${version.publishedAt}`);
    await audit(ctx, viewer, { action: "website.restore", entity: "cmsDocuments", entityId: key, newValue: version.publishedAt });
    return { key, publishedAt: at };
  },
});

/** Register a preview token for this editor's browser. Older tokens of theirs are revoked. */
export const startPreview = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    // Administrators preview their fee changes too.
    const viewer = await getViewer(ctx);
    if (!viewer || !(hasRole(viewer, ...SITE_ROLES) || isAdmin(viewer))) fail("FORBIDDEN", "You do not have permission to do that.");
    if (token.length < 32) fail("INVALID", "Invalid preview token.");
    const mine = await ctx.db.query("cmsPreviewTokens").withIndex("by_user", (q) => q.eq("userId", viewer._id)).collect();
    for (const old of mine) await ctx.db.delete(old._id);
    const expiresAt = new Date(Date.now() + PREVIEW_HOURS * 3600_000).toISOString();
    await ctx.db.insert("cmsPreviewTokens", { token, userId: viewer._id, expiresAt });
    return { expiresAt };
  },
});

export const endPreview = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const grant = await ctx.db.query("cmsPreviewTokens").withIndex("by_token", (q) => q.eq("token", token)).unique();
    if (grant) await ctx.db.delete(grant._id);
  },
});
