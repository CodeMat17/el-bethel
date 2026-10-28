import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { fail, getViewer, hasRole, requireAdmin, requireEventEditor, requireSiteAdmin, requireViewer } from "./lib/access";
import { audit, getByLooseId, nowISO, slugify, withId } from "./lib/util";
import { cloudMedia } from "./validators";

/**
 * Website content. Reads are public (only published/visible items). News, events,
 * the gallery, testimonials, clubs and FAQs are written from the Site portal by
 * site or super administrators; emergency notices and documents stay with administrators.
 */

/* ------------------------------ public reads ------------------------------ */

export const publishedNews = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const now = nowISO();
    const rows = await ctx.db
      .query("news")
      .withIndex("by_status_published", (q) => q.eq("status", "published").lte("publishedAt", now))
      .order("desc")
      .take(limit ?? 200);
    return rows.map(withId);
  },
});

export const newsBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const post = await ctx.db.query("news").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    if (!post || post.status !== "published" || post.publishedAt > nowISO()) return null;
    return withId(post);
  },
});

export const events = query({
  args: { upcomingOnly: v.optional(v.boolean()), limit: v.optional(v.number()) },
  handler: async (ctx, { upcomingOnly, limit }) => {
    const rows = await ctx.db.query("events").withIndex("by_date").collect();
    const today = nowISO().slice(0, 10);
    const shaped = rows.map((e) => {
      // Status follows the calendar unless the event was cancelled.
      const end = (e.endDate ?? e.date).slice(0, 10);
      const status: Doc<"events">["status"] = e.status === "cancelled" ? "cancelled" : end < today ? "past" : "upcoming";
      return { ...withId(e), status };
    });
    const list = upcomingOnly ? shaped.filter((e) => e.status === "upcoming") : shaped;
    return list.slice(0, limit ?? 500);
  },
});

export const eventBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const e = await ctx.db.query("events").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    return e ? withId(e) : null;
  },
});

export const gallery = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("gallery").withIndex("by_taken_at").order("desc").collect();
    return rows.filter((g) => g.consentCleared).map(withId);
  },
});

export const siteContent = query({
  args: {},
  handler: async (ctx) => {
    const [clubs, achievements, testimonials, faqs, documents, vacancies] = await Promise.all([
      ctx.db.query("clubs").collect(),
      ctx.db.query("achievements").collect(),
      ctx.db.query("testimonials").collect(),
      ctx.db.query("faqs").collect(),
      ctx.db.query("documents").withIndex("by_visibility", (q) => q.eq("visibility", "public")).collect(),
      ctx.db.query("vacancies").collect(),
    ]);
    return {
      clubs: clubs.map(withId),
      // Published stars only, and never the private link to the pupil record.
      achievements: achievements
        .filter((a) => a.published !== false)
        .map(({ studentId, published, ...a }) => {
          void studentId;
          void published;
          return withId(a as Doc<"achievements">);
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
      testimonials: testimonials.map(withId),
      faqs: faqs.sort((a, b) => a.order - b.order).map(({ order, ...f }) => {
        void order;
        return withId(f as Doc<"faqs">);
      }),
      documents: documents.map(withId),
      vacancies: vacancies.map(withId),
    };
  },
});

export const vacancyBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const row = await ctx.db.query("vacancies").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    return row ? withId(row) : null;
  },
});

/** The live emergency notice, if any. */
export const activeNotice = query({
  args: {},
  handler: async (ctx) => {
    const now = nowISO();
    const rows = await ctx.db.query("emergencyNotices").withIndex("by_active", (q) => q.eq("active", true)).collect();
    const live = rows.find((n) => n.startsAt <= now && n.endsAt >= now);
    return live ? withId(live) : null;
  },
});

/** Documents for signed-in users: parents see public and parent documents; staff see everything. */
export const portalDocuments = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const staff = hasRole(viewer, "super_admin", "admin", "teacher");
    const rows = await ctx.db.query("documents").collect();
    return rows.filter((d) => d.visibility === "public" || staff || (d.visibility === "parents" && hasRole(viewer, "parent"))).map(withId);
  },
});

const STAFF_ROLES = ["super_admin", "admin", "teacher"] as const;

/** Who may open a document: public ones are open to all, parent ones to parents and staff, staff ones to staff. */
function canOpen(viewer: Doc<"users"> | null, visibility: Doc<"documents">["visibility"]) {
  if (visibility === "public") return true;
  if (hasRole(viewer, ...STAFF_ROLES)) return true;
  return visibility === "parents" && hasRole(viewer, "parent");
}

/** A short-lived lookup for the download route: the file URL never reaches the browser. */
export const documentFile = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const doc = await getByLooseId(ctx, "documents", id);
    if (!doc) return null;
    const viewer = await getViewer(ctx);
    if (!canOpen(viewer, doc.visibility)) {
      fail(viewer ? "FORBIDDEN" : "UNAUTHENTICATED", "Please sign in with an account that can see this document.");
    }
    const url = doc.storageId ? await ctx.storage.getUrl(doc.storageId) : null;
    if (!url) return null;
    return { url, fileName: doc.fileName, visibility: doc.visibility };
  },
});

export const search = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return { news: [], events: [], staff: [], faqs: [], documents: [] };
    const [news, events, teachers, faqs, documents] = await Promise.all([
      ctx.db.query("news").withIndex("by_status_published", (x) => x.eq("status", "published")).collect(),
      ctx.db.query("events").collect(),
      ctx.db.query("teachers").collect(),
      ctx.db.query("faqs").collect(),
      ctx.db.query("documents").withIndex("by_visibility", (x) => x.eq("visibility", "public")).collect(),
    ]);
    return {
      news: news.filter((n) => n.title.toLowerCase().includes(term)).slice(0, 5).map(withId),
      events: events.filter((e) => e.title.toLowerCase().includes(term)).slice(0, 5).map(withId),
      staff: teachers
        .filter((t) => t.featured && t.active && `${t.firstName} ${t.lastName} ${t.position}`.toLowerCase().includes(term))
        .slice(0, 5)
        .map((t) => ({ id: t._id, title: t.title, firstName: t.firstName, lastName: t.lastName, position: t.position })),
      faqs: faqs.filter((f) => `${f.question} ${f.answer}`.toLowerCase().includes(term)).slice(0, 5).map(withId),
      documents: documents.filter((d) => d.title.toLowerCase().includes(term)).slice(0, 5).map(withId),
    };
  },
});

/* ------------------------------- admin reads ------------------------------ */

export const adminNews = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAdmin(ctx);
    const rows = await ctx.db.query("news").collect();
    return rows.map(withId).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  },
});

export const adminNewsPost = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireSiteAdmin(ctx);
    const post = await getByLooseId(ctx, "news", id);
    return post ? withId(post) : null;
  },
});

export const adminGallery = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAdmin(ctx);
    const rows = await ctx.db.query("gallery").withIndex("by_taken_at").order("desc").collect();
    return rows.map(withId);
  },
});

export const adminNotices = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return (await ctx.db.query("emergencyNotices").collect()).map(withId).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  },
});

export const adminDocuments = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return (await ctx.db.query("documents").collect()).map(withId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
});

/* --------------------------------- writes --------------------------------- */

async function uniqueSlug(ctx: MutationCtx, table: "news" | "events", base: string, except?: string) {
  const root = slugify(base) || "post";
  let slug = root;
  for (let n = 2; ; n++) {
    const clash = await ctx.db.query(table).withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    if (!clash || clash._id === except) return slug;
    slug = `${root}-${n}`;
  }
}

const newsFields = {
  title: v.string(),
  excerpt: v.string(),
  content: v.string(),
  category: v.string(),
  tags: v.array(v.string()),
  authorName: v.string(),
  publishedAt: v.string(),
  status: v.union(v.literal("draft"), v.literal("scheduled"), v.literal("published"), v.literal("archived")),
  featured: v.boolean(),
  seoTitle: v.optional(v.string()),
  seoDescription: v.optional(v.string()),
  cover: v.optional(cloudMedia),
};

function checkNews(a: { title: string; excerpt: string; content: string; category: string }) {
  if (a.title.trim().length < 4) fail("INVALID", "Give the post a title.");
  if (!a.excerpt.trim()) fail("INVALID", "Write a short summary.");
  if (a.content.trim().length < 20) fail("INVALID", "Write the article (at least 20 characters).");
  if (!a.category.trim()) fail("INVALID", "Choose a category.");
}

export const saveNews = mutation({
  args: { id: v.optional(v.id("news")), ...newsFields },
  handler: async (ctx, { id, ...a }) => {
    const viewer = await requireSiteAdmin(ctx);
    checkNews(a);
    const doc = {
      title: a.title.trim(),
      excerpt: a.excerpt.trim(),
      content: a.content.trim(),
      category: a.category.trim(),
      tags: a.tags.map((t) => t.trim()).filter(Boolean),
      authorName: a.authorName.trim() || viewer.name,
      publishedAt: a.publishedAt || nowISO(),
      status: a.status,
      featured: a.featured,
      seoTitle: a.seoTitle?.trim() || a.title.trim(),
      seoDescription: a.seoDescription?.trim() || a.excerpt.trim(),
      cover: a.cover,
    };
    if (id) {
      const before = await ctx.db.get(id);
      if (!before) fail("NOT_FOUND", "Post not found.");
      await ctx.db.patch(id, { ...doc, slug: before.title === doc.title ? before.slug : await uniqueSlug(ctx, "news", doc.title, id) });
      await audit(ctx, viewer, { action: "Edited news post", entity: "News", entityId: id, newValue: doc.title });
      return { id, previousCover: before.cover?.publicId !== doc.cover?.publicId ? before.cover?.publicId : undefined };
    }
    const newId = await ctx.db.insert("news", { ...doc, slug: await uniqueSlug(ctx, "news", doc.title), tone: ["navy", "gold", "info", "success", "plum"][Math.floor(Math.random() * 5)] });
    await audit(ctx, viewer, { action: "Created news post", entity: "News", entityId: newId, newValue: doc.title });
    return { id: newId, previousCover: undefined };
  },
});

export const removeNews = mutation({
  args: { id: v.id("news") },
  handler: async (ctx, { id }) => {
    const viewer = await requireSiteAdmin(ctx);
    const post = await ctx.db.get(id);
    if (!post) return null;
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Deleted news post", entity: "News", entityId: id, previousValue: post.title });
    return { publicId: post.cover?.publicId };
  },
});

const eventFields = {
  title: v.string(),
  description: v.string(),
  date: v.string(),
  endDate: v.optional(v.string()),
  startTime: v.string(),
  endTime: v.string(),
  venue: v.string(),
  category: v.union(
    v.literal("academic"),
    v.literal("sports"),
    v.literal("cultural"),
    v.literal("parents"),
    v.literal("holiday"),
    v.literal("assessment"),
    v.literal("alumni"),
  ),
  requiresRegistration: v.boolean(),
  cancelled: v.boolean(),
  cover: v.optional(cloudMedia),
};

export const saveEvent = mutation({
  args: { id: v.optional(v.id("events")), ...eventFields },
  handler: async (ctx, { id, cancelled, ...a }) => {
    const viewer = await requireEventEditor(ctx);
    if (a.title.trim().length < 3) fail("INVALID", "Give the event a title.");
    if (!/^\d{4}-\d{2}-\d{2}/.test(a.date)) fail("INVALID", "Choose a date.");
    if (a.endDate && a.endDate < a.date) fail("INVALID", "The end date can't be before the start date.");
    const end = (a.endDate || a.date).slice(0, 10);
    const doc = {
      ...a,
      title: a.title.trim(),
      description: a.description.trim(),
      venue: a.venue.trim(),
      endDate: a.endDate || undefined,
      status: (cancelled ? "cancelled" : end < nowISO().slice(0, 10) ? "past" : "upcoming") as Doc<"events">["status"],
    };
    if (id) {
      const before = await ctx.db.get(id);
      if (!before) fail("NOT_FOUND", "Event not found.");
      await ctx.db.patch(id, { ...doc, slug: before.title === doc.title ? before.slug : await uniqueSlug(ctx, "events", doc.title, id) });
      await audit(ctx, viewer, { action: "Edited event", entity: "Event", entityId: id, newValue: doc.title });
      return { id, previousCover: before.cover?.publicId !== doc.cover?.publicId ? before.cover?.publicId : undefined };
    }
    const newId = await ctx.db.insert("events", { ...doc, slug: await uniqueSlug(ctx, "events", doc.title) });
    await audit(ctx, viewer, { action: "Created event", entity: "Event", entityId: newId, newValue: doc.title });
    return { id: newId, previousCover: undefined };
  },
});

export const removeEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, { id }) => {
    const viewer = await requireEventEditor(ctx);
    const e = await ctx.db.get(id);
    if (!e) return null;
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Deleted event", entity: "Event", entityId: id, previousValue: e.title });
    return { publicId: e.cover?.publicId };
  },
});

export const addGalleryItem = mutation({
  args: {
    title: v.string(),
    caption: v.string(),
    category: v.string(),
    takenAt: v.string(),
    consentCleared: v.boolean(),
    media: cloudMedia,
  },
  handler: async (ctx, a) => {
    const viewer = await requireSiteAdmin(ctx);
    if (!a.title.trim()) fail("INVALID", "Give the photo or video a title.");
    const id = await ctx.db.insert("gallery", {
      ...a,
      title: a.title.trim(),
      caption: a.caption.trim(),
      category: a.category.trim() || "School Life",
      takenAt: a.takenAt || nowISO(),
      tone: "navy",
    });
    await audit(ctx, viewer, { action: "Added to gallery", entity: "Gallery", entityId: id, newValue: a.title });
    return id;
  },
});

export const updateGalleryItem = mutation({
  args: { id: v.id("gallery"), title: v.string(), caption: v.string(), category: v.string(), consentCleared: v.boolean() },
  handler: async (ctx, { id, ...a }) => {
    const viewer = await requireSiteAdmin(ctx);
    if (!(await ctx.db.get(id))) fail("NOT_FOUND", "Item not found.");
    await ctx.db.patch(id, { ...a, title: a.title.trim(), caption: a.caption.trim() });
    await audit(ctx, viewer, { action: "Edited gallery item", entity: "Gallery", entityId: id, newValue: a.title });
  },
});

export const removeGalleryItem = mutation({
  args: { id: v.id("gallery") },
  handler: async (ctx, { id }) => {
    const viewer = await requireSiteAdmin(ctx);
    const g = await ctx.db.get(id);
    if (!g) return null;
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Removed from gallery", entity: "Gallery", entityId: id, previousValue: g.title });
    return { publicId: g.media?.publicId, resourceType: g.media?.resourceType };
  },
});

export const saveNotice = mutation({
  args: {
    id: v.optional(v.id("emergencyNotices")),
    title: v.string(),
    body: v.string(),
    priority: v.union(v.literal("high"), v.literal("critical")),
    audience: v.union(v.literal("all"), v.literal("parents"), v.literal("staff"), v.literal("pupils")),
    startsAt: v.string(),
    endsAt: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, { id, ...a }) => {
    const viewer = await requireAdmin(ctx);
    if (!a.title.trim() || !a.body.trim()) fail("INVALID", "Enter a title and a message.");
    if (a.endsAt <= a.startsAt) fail("INVALID", "The notice must end after it starts.");
    if (id) await ctx.db.patch(id, a);
    else id = await ctx.db.insert("emergencyNotices", a);
    await audit(ctx, viewer, { action: "Saved notice", entity: "Notice", entityId: id, newValue: a.title });
    return id;
  },
});

export const removeNotice = mutation({
  args: { id: v.id("emergencyNotices") },
  handler: async (ctx, { id }) => {
    const viewer = await requireAdmin(ctx);
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Deleted notice", entity: "Notice", entityId: id });
  },
});

/* -------------------------------- documents ------------------------------- */

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** A one-time URL the admin's browser uploads the PDF to. */
export const documentUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Delete an upload whose document never saved, so failed saves don't leave files behind. */
export const discardDocumentUpload = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    await requireAdmin(ctx);
    const used = await ctx.db.query("documents").filter((q) => q.eq(q.field("storageId"), storageId)).first();
    if (!used && (await ctx.db.system.get(storageId))) await ctx.storage.delete(storageId);
  },
});

export const saveDocument = mutation({
  args: {
    id: v.optional(v.id("documents")),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    visibility: v.union(v.literal("public"), v.literal("parents"), v.literal("staff")),
    file: v.optional(v.object({ storageId: v.id("_storage"), fileName: v.string() })),
  },
  handler: async (ctx, { id, file, ...a }) => {
    const viewer = await requireAdmin(ctx);
    if (a.title.trim().length < 3) fail("INVALID", "Give the document a title.");
    if (!a.category.trim()) fail("INVALID", "Choose a category.");
    const before = id ? await ctx.db.get(id) : null;
    if (id && !before) fail("NOT_FOUND", "Document not found.");
    if (!before && !file) fail("INVALID", "Choose the PDF to upload.");

    let upload: { storageId: Id<"_storage">; fileName: string; sizeBytes: number } | undefined;
    if (file) {
      // Trust what storage recorded, not what the browser said.
      const meta = await ctx.db.system.get(file.storageId);
      if (!meta) fail("INVALID", "The upload didn't finish. Please choose the file again.");
      if (meta.contentType !== "application/pdf") fail("INVALID", "Only PDF files can be uploaded.");
      if (meta.size > MAX_DOCUMENT_BYTES) fail("INVALID", "The PDF must be 10 MB or smaller.");
      const name = file.fileName.replace(/[^\w.\- ]+/g, "").trim().slice(0, 120) || "document";
      upload = { storageId: file.storageId, fileName: name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`, sizeBytes: meta.size };
    }

    const doc = {
      title: a.title.trim(),
      description: a.description.trim(),
      category: a.category.trim(),
      visibility: a.visibility,
      updatedAt: nowISO(),
      ...upload,
    };
    if (before) {
      await ctx.db.patch(before._id, doc);
      if (upload && before.storageId && before.storageId !== upload.storageId) await ctx.storage.delete(before.storageId);
      await audit(ctx, viewer, { action: "Edited document", entity: "Document", entityId: before._id, newValue: doc.title });
      return before._id;
    }
    const newId = await ctx.db.insert("documents", { ...doc, fileName: upload!.fileName, sizeBytes: upload!.sizeBytes });
    await audit(ctx, viewer, { action: "Added document", entity: "Document", entityId: newId, newValue: doc.title });
    return newId;
  },
});

export const removeDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    const viewer = await requireAdmin(ctx);
    const doc = await ctx.db.get(id);
    if (!doc) return;
    if (doc.storageId) await ctx.storage.delete(doc.storageId);
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Deleted document", entity: "Document", entityId: id, previousValue: doc.title });
  },
});

/** Library catalogue and bus routes shown on the public website. */
export const publicCatalogue = query({
  args: {},
  handler: async (ctx) => {
    const [books, routes, documents] = await Promise.all([
      ctx.db.query("books").collect(),
      ctx.db.query("transportRoutes").collect(),
      ctx.db.query("documents").collect(),
    ]);
    return {
      books: books.map(withId),
      // Crew phone numbers are for families of riders only.
      routes: routes.map((r) => {
        const { driverPhone, attendantPhone, ...rest } = withId(r);
        void driverPhone;
        void attendantPhone;
        return rest;
      }),
      // Titles only: the documents themselves are in the portals.
      restrictedDocuments: documents.filter((d) => d.visibility !== "public").map(withId),
    };
  },
});
