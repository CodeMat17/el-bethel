import { v } from "convex/values";

import { query } from "./_generated/server";
import { canAccessClass, fail, isAdmin, requireStaff, requireViewer } from "./lib/access";
import { withId } from "./lib/util";

export const forClass = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const viewer = await requireViewer(ctx);
    if (!(await canAccessClass(ctx, viewer, classId))) fail("FORBIDDEN", "You do not have access to this class.");
    const rows = await ctx.db
      .query("timetable")
      .withIndex("by_class", (q) => q.eq("classId", classId))
      .collect();
    return rows.map(withId);
  },
});

export const forTeacher = query({
  args: { teacherId: v.optional(v.id("teachers")) },
  handler: async (ctx, args) => {
    const viewer = await requireStaff(ctx);
    const teacherId = args.teacherId ?? viewer.teacherId;
    if (!teacherId) return [];
    if (teacherId !== viewer.teacherId && !isAdmin(viewer)) fail("FORBIDDEN", "You can only see your own timetable.");
    const rows = await ctx.db
      .query("timetable")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
      .collect();
    return rows.map(withId);
  },
});
