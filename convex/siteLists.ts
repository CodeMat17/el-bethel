import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { fail, requireSiteAdmin } from "./lib/access";
import { audit, slugify, withId } from "./lib/util";

/**
 * Small website lists edited in the Site portal: testimonials, clubs and FAQs.
 * The public site reads them through `content.siteContent`.
 */

const clean = (s: string, max: number) => s.trim().slice(0, max);

/* ------------------------------ testimonials ------------------------------ */

export const testimonials = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAdmin(ctx);
    return (await ctx.db.query("testimonials").collect()).map(withId);
  },
});

export const saveTestimonial = mutation({
  args: { id: v.optional(v.id("testimonials")), name: v.string(), relationship: v.string(), quote: v.string() },
  handler: async (ctx, { id, ...a }) => {
    const viewer = await requireSiteAdmin(ctx);
    const doc = { name: clean(a.name, 80), relationship: clean(a.relationship, 80), quote: clean(a.quote, 800) };
    if (doc.name.length < 2) fail("INVALID", "Enter who said it.");
    if (doc.quote.length < 10) fail("INVALID", "Enter the testimonial (at least 10 characters).");
    if (id) {
      if (!(await ctx.db.get(id))) fail("NOT_FOUND", "Testimonial not found.");
      await ctx.db.patch(id, doc);
    } else {
      id = await ctx.db.insert("testimonials", { ...doc, avatarSeed: slugify(doc.name) || "parent" });
    }
    await audit(ctx, viewer, { action: "Saved testimonial", entity: "Testimonial", entityId: id, newValue: doc.name });
    return id;
  },
});

export const removeTestimonial = mutation({
  args: { id: v.id("testimonials") },
  handler: async (ctx, { id }) => {
    const viewer = await requireSiteAdmin(ctx);
    const row = await ctx.db.get(id);
    if (!row) return;
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Deleted testimonial", entity: "Testimonial", entityId: id, previousValue: row.name });
  },
});

/* ---------------------------------- clubs --------------------------------- */

const clubCategory = v.union(v.literal("stem"), v.literal("arts"), v.literal("sports"), v.literal("literary"), v.literal("service"));

export const clubs = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAdmin(ctx);
    return (await ctx.db.query("clubs").collect()).map(withId).sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const saveClub = mutation({
  args: {
    id: v.optional(v.id("clubs")),
    name: v.string(),
    description: v.string(),
    meetingDay: v.string(),
    meetingTime: v.string(),
    memberCount: v.number(),
    category: clubCategory,
  },
  handler: async (ctx, { id, ...a }) => {
    const viewer = await requireSiteAdmin(ctx);
    const doc = {
      name: clean(a.name, 80),
      description: clean(a.description, 400),
      meetingDay: clean(a.meetingDay, 20),
      meetingTime: clean(a.meetingTime, 40),
      memberCount: Math.max(0, Math.min(5000, Math.round(a.memberCount) || 0)),
      category: a.category,
    };
    if (doc.name.length < 2) fail("INVALID", "Give the club a name.");
    if (id) {
      if (!(await ctx.db.get(id))) fail("NOT_FOUND", "Club not found.");
      await ctx.db.patch(id, doc);
    } else {
      id = await ctx.db.insert("clubs", { ...doc, slug: slugify(doc.name) || "club" });
    }
    await audit(ctx, viewer, { action: "Saved club", entity: "Club", entityId: id, newValue: doc.name });
    return id;
  },
});

export const removeClub = mutation({
  args: { id: v.id("clubs") },
  handler: async (ctx, { id }) => {
    const viewer = await requireSiteAdmin(ctx);
    const row = await ctx.db.get(id);
    if (!row) return;
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Deleted club", entity: "Club", entityId: id, previousValue: row.name });
  },
});

/* ---------------------------------- FAQs ---------------------------------- */

export const faqs = query({
  args: {},
  handler: async (ctx) => {
    await requireSiteAdmin(ctx);
    return (await ctx.db.query("faqs").collect()).map(withId).sort((a, b) => a.order - b.order);
  },
});

export const saveFaq = mutation({
  args: { id: v.optional(v.id("faqs")), category: v.string(), question: v.string(), answer: v.string() },
  handler: async (ctx, { id, ...a }) => {
    const viewer = await requireSiteAdmin(ctx);
    const doc = { category: clean(a.category, 60) || "General", question: clean(a.question, 300), answer: clean(a.answer, 3000) };
    if (doc.question.length < 5) fail("INVALID", "Enter the question.");
    if (doc.answer.length < 2) fail("INVALID", "Enter the answer.");
    if (id) {
      if (!(await ctx.db.get(id))) fail("NOT_FOUND", "Question not found.");
      await ctx.db.patch(id, doc);
    } else {
      const all = await ctx.db.query("faqs").collect();
      id = await ctx.db.insert("faqs", { ...doc, order: all.reduce((n, f) => Math.max(n, f.order), -1) + 1 });
    }
    await audit(ctx, viewer, { action: "Saved FAQ", entity: "FAQ", entityId: id, newValue: doc.question });
    return id;
  },
});

/** Swap a question with its neighbour. */
export const moveFaq = mutation({
  args: { id: v.id("faqs"), direction: v.union(v.literal("up"), v.literal("down")) },
  handler: async (ctx, { id, direction }) => {
    await requireSiteAdmin(ctx);
    const all = (await ctx.db.query("faqs").collect()).sort((a, b) => a.order - b.order);
    const i = all.findIndex((f) => f._id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= all.length) return;
    // Renumber everything so duplicate or missing orders can't stick.
    [all[i], all[j]] = [all[j], all[i]];
    await Promise.all(all.map((f, n) => (f.order === n ? null : ctx.db.patch(f._id, { order: n }))));
  },
});

export const removeFaq = mutation({
  args: { id: v.id("faqs") },
  handler: async (ctx, { id }) => {
    const viewer = await requireSiteAdmin(ctx);
    const row = await ctx.db.get(id);
    if (!row) return;
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Deleted FAQ", entity: "FAQ", entityId: id, previousValue: row.question });
  },
});
