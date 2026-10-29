import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { fail, requireAdmin } from "./lib/access";
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

