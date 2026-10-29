import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { fail, requireAdmin } from "./lib/access";
import { audit, nowISO, slugify, withId } from "./lib/util";
import { cloudMedia } from "./validators";

/** Alumni stories and alumni events (events with the "alumni" category). */

/* --------------------------------- public --------------------------------- */

export const hub = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    const [stories, events] = await Promise.all([
      ctx.db.query("alumniStories").withIndex("by_status", (q) => q.eq("status", "published")).collect(),
      ctx.db.query("events").withIndex("by_date", (q) => q.gte("date", today)).collect(),
    ]);
    return {
      stories: stories
        .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
        .map((s) => ({ id: s._id, slug: s.slug, title: s.title, authorName: s.authorName, graduationYear: s.graduationYear, excerpt: s.excerpt, cover: s.cover, publishedAt: s.publishedAt })),
      events: events.filter((e) => e.category === "alumni" && e.status !== "cancelled").map(withId),
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

/* --------------------------------- admin ---------------------------------- */

export const adminOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const stories = await ctx.db.query("alumniStories").collect();
    return {
      stories: stories.map(withId).sort((a, b) => (b.publishedAt ?? "9").localeCompare(a.publishedAt ?? "9")),
    };
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

