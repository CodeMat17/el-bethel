import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { fail, requireAdmin } from "./lib/access";
import { audit, nowISO, slugify, withId } from "./lib/util";
import { cloudMedia } from "./validators";

/**
 * The alumni platform: registration, a directory of adult alumni who chose to
 * be listed, alumni stories, alumni events (events with the "alumni"
 * category) and giving campaigns. Many former pupils of a primary school are
 * still children, so a parent can register them, and only adults registering
 * themselves can ever appear in the public directory. Gifts are pledged online
 * and count towards a campaign once the bursary confirms they were received.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_GIFT = 1_000;
const MAX_GIFT = 50_000_000;

async function raisedFor(ctx: QueryCtx, campaignId: Id<"givingCampaigns">) {
  const pledges = await ctx.db.query("pledges").withIndex("by_campaign", (q) => q.eq("campaignId", campaignId)).collect();
  const received = pledges.filter((p) => p.status === "received");
  return { raised: received.reduce((n, p) => n + p.amount, 0), supporters: received.length, pledges };
}

const publicCampaign = async (ctx: QueryCtx, c: Doc<"givingCampaigns">) => {
  const { raised, supporters } = await raisedFor(ctx, c._id);
  return { ...withId(c), raised, supporters };
};

/* --------------------------------- public --------------------------------- */

export const hub = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    const [stories, campaigns, approved, events] = await Promise.all([
      ctx.db.query("alumniStories").withIndex("by_status", (q) => q.eq("status", "published")).collect(),
      ctx.db.query("givingCampaigns").collect(),
      ctx.db.query("alumni").withIndex("by_status", (q) => q.eq("status", "approved")).collect(),
      ctx.db.query("events").withIndex("by_date", (q) => q.gte("date", today)).collect(),
    ]);
    return {
      stories: stories
        .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
        .map((s) => ({ id: s._id, slug: s.slug, title: s.title, authorName: s.authorName, graduationYear: s.graduationYear, excerpt: s.excerpt, cover: s.cover, publishedAt: s.publishedAt })),
      campaigns: await Promise.all(campaigns.filter((c) => c.status === "open").map((c) => publicCampaign(ctx, c))),
      events: events.filter((e) => e.category === "alumni" && e.status !== "cancelled").map(withId),
      // Directory: adults who registered themselves and opted in. Surname initial only.
      directory: approved
        .filter((a) => a.directoryOptIn && a.registeredBy === "self")
        .map((a) => ({ id: a._id, name: `${a.firstName} ${a.lastName.charAt(0)}.`, graduationYear: a.graduationYear, currently: a.currently ?? null, city: a.city ?? null }))
        .sort((a, b) => b.graduationYear - a.graduationYear || a.name.localeCompare(b.name)),
      members: approved.length,
    };
  },
});

export const story = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const s = await ctx.db.query("alumniStories").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    return s && s.status === "published" ? withId(s) : null;
  },
});

export const campaign = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const c = await ctx.db.query("givingCampaigns").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    if (!c) return null;
    const { raised, supporters, pledges } = await raisedFor(ctx, c._id);
    return {
      ...withId(c),
      raised,
      supporters,
      // Thank-you wall: first names of named supporters only, no amounts.
      wall: pledges
        .filter((p) => p.status === "received" && !p.anonymous)
        .sort((a, b) => (b.receivedAt ?? "").localeCompare(a.receivedAt ?? ""))
        .slice(0, 30)
        .map((p) => ({ name: p.name.split(" ")[0], message: p.message ?? null })),
    };
  },
});

export const register = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    graduationYear: v.number(),
    lastClass: v.string(),
    currently: v.optional(v.string()),
    city: v.optional(v.string()),
    registeredBy: v.union(v.literal("self"), v.literal("parent")),
    confirmsAdult: v.boolean(),
    directoryOptIn: v.boolean(),
  },
  handler: async (ctx, a) => {
    const email = a.email.trim().toLowerCase();
    const year = new Date().getUTCFullYear();
    if (a.firstName.trim().length < 2 || a.lastName.trim().length < 2) fail("INVALID", "Enter the former pupil's first and last name.");
    if (!EMAIL.test(email)) fail("INVALID", "Enter a valid email address.");
    if (!Number.isInteger(a.graduationYear) || a.graduationYear < 1990 || a.graduationYear > year) fail("INVALID", `Choose the year they left, between 1990 and ${year}.`);
    if (!a.lastClass.trim()) fail("INVALID", "Which class did they leave from?");
    if (a.registeredBy === "self" && !a.confirmsAdult) fail("INVALID", "Former pupils under 18 should be registered by a parent or guardian.");
    const existing = await ctx.db.query("alumni").withIndex("by_email", (q) => q.eq("email", email)).collect();
    const name = `${a.firstName} ${a.lastName}`.trim().toLowerCase();
    if (existing.some((x) => x.status !== "declined" && `${x.firstName} ${x.lastName}`.toLowerCase() === name)) {
      fail("CONFLICT", "This former pupil is already registered. Contact the school office to update their details.");
    }
    await ctx.db.insert("alumni", {
      firstName: a.firstName.trim().slice(0, 60),
      lastName: a.lastName.trim().slice(0, 60),
      email,
      phone: a.phone?.trim().slice(0, 30) || undefined,
      graduationYear: a.graduationYear,
      lastClass: a.lastClass.trim().slice(0, 40),
      currently: a.currently?.trim().slice(0, 120) || undefined,
      city: a.city?.trim().slice(0, 60) || undefined,
      registeredBy: a.registeredBy,
      // Children are never listed publicly.
      directoryOptIn: a.registeredBy === "self" && a.confirmsAdult && a.directoryOptIn,
      status: "pending",
      createdAt: nowISO(),
    });
  },
});

export const pledge = mutation({
  args: {
    campaignId: v.id("givingCampaigns"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    amount: v.number(),
    anonymous: v.boolean(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const c = await ctx.db.get(a.campaignId);
    if (!c || c.status !== "open") fail("CONFLICT", "This campaign is no longer taking gifts.");
    const email = a.email.trim().toLowerCase();
    if (a.name.trim().length < 2) fail("INVALID", "Enter your name.");
    if (!EMAIL.test(email)) fail("INVALID", "Enter a valid email address.");
    if (!Number.isFinite(a.amount) || a.amount < MIN_GIFT || a.amount > MAX_GIFT) fail("INVALID", `Gifts can be from ₦${MIN_GIFT.toLocaleString("en-NG")}.`);
    const reference = `GIV-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
    await ctx.db.insert("pledges", {
      reference,
      campaignId: c._id,
      name: a.name.trim().slice(0, 120),
      email,
      phone: a.phone?.trim().slice(0, 30) || undefined,
      amount: Math.round(a.amount),
      anonymous: a.anonymous,
      message: a.message?.trim().slice(0, 280) || undefined,
      status: "pledged",
      createdAt: nowISO(),
    });
    return { reference, amount: Math.round(a.amount), campaign: c.title };
  },
});

/* ---------------------------------- admin --------------------------------- */

export const adminOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [people, stories, campaigns, pledges] = await Promise.all([
      ctx.db.query("alumni").collect(),
      ctx.db.query("alumniStories").collect(),
      ctx.db.query("givingCampaigns").collect(),
      ctx.db.query("pledges").collect(),
    ]);
    const titles = new Map(campaigns.map((c) => [c._id as string, c.title]));
    return {
      alumni: people.map(withId).sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0) || b.createdAt.localeCompare(a.createdAt)),
      stories: stories.map(withId).sort((a, b) => (b.publishedAt ?? "9").localeCompare(a.publishedAt ?? "9")),
      campaigns: await Promise.all(campaigns.map((c) => publicCampaign(ctx, c))),
      pledges: pledges
        .map((p) => ({ ...withId(p), campaign: titles.get(p.campaignId) ?? "—" }))
        .sort((a, b) => (a.status === "pledged" ? -1 : 0) - (b.status === "pledged" ? -1 : 0) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 100),
    };
  },
});

export const decide = mutation({
  args: { id: v.id("alumni"), status: v.union(v.literal("approved"), v.literal("declined")) },
  handler: async (ctx, { id, status }) => {
    const viewer = await requireAdmin(ctx);
    const row = await ctx.db.get(id);
    if (!row) fail("NOT_FOUND", "Registration not found.");
    await ctx.db.patch(id, { status, decidedAt: nowISO() });
    await audit(ctx, viewer, { action: status === "approved" ? "Approved alumni registration" : "Declined alumni registration", entity: "Alumni", entityId: id, newValue: `${row.firstName} ${row.lastName}` });
  },
});

export const saveStory = mutation({
  args: {
    id: v.optional(v.id("alumniStories")),
    title: v.string(),
    authorName: v.string(),
    graduationYear: v.number(),
    excerpt: v.string(),
    body: v.string(),
    cover: v.optional(cloudMedia),
    published: v.boolean(),
  },
  handler: async (ctx, { id, published, ...a }) => {
    const viewer = await requireAdmin(ctx);
    const fields = {
      title: a.title.trim().slice(0, 140),
      authorName: a.authorName.trim().slice(0, 80),
      graduationYear: a.graduationYear,
      excerpt: a.excerpt.trim().slice(0, 280),
      body: a.body.trim().slice(0, 12000),
      cover: a.cover,
      status: published ? ("published" as const) : ("draft" as const),
    };
    if (fields.title.length < 4) fail("INVALID", "Give the story a title.");
    if (!fields.authorName) fail("INVALID", "Whose story is it?");
    if (fields.body.length < 50) fail("INVALID", "The story needs a few paragraphs.");
    if (!Number.isInteger(fields.graduationYear) || fields.graduationYear < 1990) fail("INVALID", "Enter the year they left.");
    if (id) {
      const before = await ctx.db.get(id);
      if (!before) fail("NOT_FOUND", "Story not found.");
      await ctx.db.patch(id, { ...fields, publishedAt: published ? (before.publishedAt ?? nowISO()) : before.publishedAt });
      await audit(ctx, viewer, { action: "Updated alumni story", entity: "Alumni", entityId: id, newValue: fields.title });
      return { id, previousCover: before.cover?.publicId !== fields.cover?.publicId ? before.cover?.publicId : undefined };
    }
    let slug = slugify(fields.title) || "story";
    while (await ctx.db.query("alumniStories").withIndex("by_slug", (q) => q.eq("slug", slug)).first()) slug = `${slug}-${Math.floor(Math.random() * 900 + 100)}`;
    const newId = await ctx.db.insert("alumniStories", { ...fields, slug, publishedAt: published ? nowISO() : undefined });
    await audit(ctx, viewer, { action: "Added alumni story", entity: "Alumni", entityId: newId, newValue: fields.title });
    return { id: newId, previousCover: undefined };
  },
});

export const removeStory = mutation({
  args: { id: v.id("alumniStories") },
  handler: async (ctx, { id }) => {
    const viewer = await requireAdmin(ctx);
    const s = await ctx.db.get(id);
    if (!s) return { publicId: undefined };
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Removed alumni story", entity: "Alumni", entityId: id, previousValue: s.title });
    return { publicId: s.cover?.publicId };
  },
});

export const saveCampaign = mutation({
  args: {
    id: v.optional(v.id("givingCampaigns")),
    title: v.string(),
    summary: v.string(),
    description: v.string(),
    goal: v.number(),
    endsAt: v.optional(v.string()),
    open: v.boolean(),
  },
  handler: async (ctx, { id, open, ...a }) => {
    const viewer = await requireAdmin(ctx);
    const fields = {
      title: a.title.trim().slice(0, 120),
      summary: a.summary.trim().slice(0, 240),
      description: a.description.trim().slice(0, 6000),
      goal: Math.round(a.goal),
      endsAt: a.endsAt && /^\d{4}-\d{2}-\d{2}$/.test(a.endsAt) ? a.endsAt : undefined,
      status: open ? ("open" as const) : ("closed" as const),
    };
    if (fields.title.length < 4) fail("INVALID", "Give the campaign a title.");
    if (fields.summary.length < 10) fail("INVALID", "Add a one-line summary.");
    if (!Number.isFinite(fields.goal) || fields.goal < 10_000) fail("INVALID", "Set a goal of at least ₦10,000.");
    if (id) {
      if (!(await ctx.db.get(id))) fail("NOT_FOUND", "Campaign not found.");
      await ctx.db.patch(id, fields);
      await audit(ctx, viewer, { action: "Updated giving campaign", entity: "Alumni", entityId: id, newValue: fields.title });
      return id;
    }
    let slug = slugify(fields.title) || "campaign";
    while (await ctx.db.query("givingCampaigns").withIndex("by_slug", (q) => q.eq("slug", slug)).first()) slug = `${slug}-${Math.floor(Math.random() * 900 + 100)}`;
    const newId = await ctx.db.insert("givingCampaigns", { ...fields, slug, createdAt: nowISO() });
    await audit(ctx, viewer, { action: "Added giving campaign", entity: "Alumni", entityId: newId, newValue: fields.title });
    return newId;
  },
});

/** The bursary confirms a pledged gift arrived (or cancels a pledge that never did). */
export const settlePledge = mutation({
  args: { id: v.id("pledges"), status: v.union(v.literal("received"), v.literal("cancelled")) },
  handler: async (ctx, { id, status }) => {
    const viewer = await requireAdmin(ctx);
    const p = await ctx.db.get(id);
    if (!p) fail("NOT_FOUND", "Pledge not found.");
    if (p.status !== "pledged") fail("CONFLICT", "This pledge has already been settled.");
    await ctx.db.patch(id, { status, receivedAt: status === "received" ? nowISO() : undefined });
    await audit(ctx, viewer, { action: status === "received" ? "Confirmed gift received" : "Cancelled pledge", entity: "Alumni", entityId: id, newValue: `${p.reference} ₦${p.amount}` });
  },
});
