import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { fail, requireViewer } from "./lib/access";
import { withId } from "./lib/util";

export const mine = query({
  args: { limit: v.optional(v.number()), unreadOnly: v.optional(v.boolean()) },
  handler: async (ctx, { limit, unreadOnly }) => {
    const viewer = await requireViewer(ctx);
    const rows = unreadOnly
      ? await ctx.db
          .query("notifications")
          .withIndex("by_user_read", (q) => q.eq("userId", viewer._id).eq("read", false))
          .collect()
      : await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", viewer._id))
          .order("desc")
          .take(limit ?? 100);
    return rows
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit ?? 100)
      .map(withId);
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const n = await ctx.db.get(id);
    if (!n || n.userId !== viewer._id) fail("NOT_FOUND", "Notification not found.");
    if (!n.read) await ctx.db.patch(id, { read: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", viewer._id).eq("read", false))
      .collect();
    for (const n of rows) await ctx.db.patch(n._id, { read: true });
    return rows.length;
  },
});
