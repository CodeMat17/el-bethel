import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { fail, requireAdmin } from "./lib/access";
import { publishedContent } from "./lib/cms";
import { audit, nowISO, withId } from "./lib/util";

/* ------------------------- public forms (no sign-in) ---------------------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const submitEnquiry = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    category: v.union(v.literal("admissions"), v.literal("fees"), v.literal("academics"), v.literal("transport"), v.literal("general")),
    message: v.string(),
  },
  handler: async (ctx, a) => {
    if (!EMAIL.test(a.email.trim())) fail("INVALID", "Enter a valid email address.");
    if (a.message.trim().length < 10 || a.message.length > 4000) fail("INVALID", "Please write a message of 10 to 4000 characters.");
    await ctx.db.insert("enquiries", {
      ...a,
      name: a.name.trim().slice(0, 120),
      email: a.email.trim().toLowerCase(),
      phone: a.phone.trim().slice(0, 40),
      message: a.message.trim(),
      status: "new",
      createdAt: nowISO(),
    });
  },
});

export const bookTour = mutation({
  args: {
    parentName: v.string(),
    email: v.string(),
    phone: v.string(),
    preferredDate: v.string(),
    preferredTime: v.string(),
    visitors: v.number(),
    intendedLevelId: v.string(),
    mode: v.union(v.literal("physical"), v.literal("virtual"), v.literal("consultation")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    if (!EMAIL.test(a.email.trim())) fail("INVALID", "Enter a valid email address.");
    if (!(await publishedContent(ctx, "fees")).openLevels.includes(a.intendedLevelId)) fail("INVALID", "Choose a class.");
    if (!Number.isInteger(a.visitors) || a.visitors < 1 || a.visitors > 8) fail("INVALID", "Between 1 and 8 visitors.");
    const count = (await ctx.db.query("tourBookings").collect()).length + 1;
    const reference = `TOUR-${new Date().getUTCFullYear()}-${String(count).padStart(4, "0")}`;
    await ctx.db.insert("tourBookings", {
      ...a,
      email: a.email.trim().toLowerCase(),
      notes: a.notes?.trim().slice(0, 1000) || undefined,
      reference,
      status: "requested",
      createdAt: nowISO(),
    });
    return reference;
  },
});

/* ------------------------------- admin desk ------------------------------- */

export const enquiries = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return (await ctx.db.query("enquiries").withIndex("by_created").order("desc").collect()).map(withId);
  },
});

export const updateEnquiry = mutation({
  args: {
    id: v.id("enquiries"),
    status: v.union(v.literal("new"), v.literal("assigned"), v.literal("in_progress"), v.literal("resolved"), v.literal("archived")),
    reply: v.optional(v.string()),
  },
  handler: async (ctx, { id, status, reply }) => {
    const viewer = await requireAdmin(ctx);
    const e = await ctx.db.get(id);
    if (!e) fail("NOT_FOUND", "Enquiry not found.");
    await ctx.db.patch(id, { status, reply: reply?.trim() || e.reply, assignedTo: e.assignedTo ?? viewer.name });
    await audit(ctx, viewer, { action: "Updated enquiry", entity: "Enquiry", entityId: id, previousValue: e.status, newValue: status });
  },
});

export const tours = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return (await ctx.db.query("tourBookings").withIndex("by_created").order("desc").collect()).map(withId);
  },
});

export const updateTour = mutation({
  args: { id: v.id("tourBookings"), status: v.union(v.literal("requested"), v.literal("confirmed"), v.literal("completed"), v.literal("cancelled")) },
  handler: async (ctx, { id, status }) => {
    const viewer = await requireAdmin(ctx);
    const t = await ctx.db.get(id);
    if (!t) fail("NOT_FOUND", "Booking not found.");
    await ctx.db.patch(id, { status });
    await audit(ctx, viewer, { action: "Updated tour booking", entity: "Tour", entityId: id, previousValue: t.status, newValue: status });
  },
});

export const auditLogs = query({
  args: { page: v.optional(v.number()), pageSize: v.optional(v.number()), search: v.optional(v.string()), entity: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("auditLogs").withIndex("by_at").order("desc").take(5000);
    const term = args.search?.trim().toLowerCase() ?? "";
    const filtered = all.filter((l) => {
      if (args.entity && args.entity !== "all" && l.entity !== args.entity) return false;
      return !term || `${l.actorName} ${l.action} ${l.entity} ${l.entityId} ${l.newValue ?? ""}`.toLowerCase().includes(term);
    });
    const pageSize = args.pageSize ?? 15;
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(Math.max(1, args.page ?? 1), pageCount);
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize).map(withId),
      total: filtered.length,
      page,
      pageSize,
      pageCount,
      entities: [...new Set(all.map((l) => l.entity))].sort(),
      all: all.length,
      actors: new Set(all.map((l) => l.actorName)).size,
    };
  },
});
