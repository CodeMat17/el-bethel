import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertTeachesSubject, canAccessClass, fail, isAdmin, requireStaff, requireViewer } from "./lib/access";
import { audit, nowISO, withId } from "./lib/util";
import { cloudMedia } from "./validators";

/* -------------------------------- materials ------------------------------- */

export const materialsForClass = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const viewer = await requireViewer(ctx);
    if (!(await canAccessClass(ctx, viewer, classId))) fail("FORBIDDEN", "You do not have access to this class.");
    const rows = await ctx.db.query("materials").withIndex("by_class", (q) => q.eq("classId", classId)).collect();
    return rows.map(withId).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  },
});

export const myMaterials = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireStaff(ctx);
    if (!viewer.teacherId) return [];
    const rows = await ctx.db.query("materials").withIndex("by_teacher", (q) => q.eq("teacherId", viewer.teacherId!)).collect();
    return rows.map(withId).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  },
});

export const addMaterial = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    classId: v.id("classes"),
    subjectId: v.id("subjects"),
    kind: v.union(
      v.literal("note"),
      v.literal("pdf"),
      v.literal("worksheet"),
      v.literal("video"),
      v.literal("audio"),
      v.literal("slides"),
      v.literal("link"),
      v.literal("image"),
    ),
    url: v.optional(v.string()),
    media: v.optional(cloudMedia),
  },
  handler: async (ctx, args) => {
    const viewer = await requireStaff(ctx);
    await assertTeachesSubject(ctx, viewer, args.classId, args.subjectId);
    if (args.title.trim().length < 3) fail("INVALID", "Give the material a title.");
    const url = args.media?.url ?? args.url?.trim() ?? "";
    if (url && !/^https:\/\//.test(url)) fail("INVALID", "Links must start with https://");
    let teacherId = viewer.teacherId;
    if (!teacherId) {
      const row = await ctx.db
        .query("teachingAssignments")
        .withIndex("by_class_subject", (q) => q.eq("classId", args.classId).eq("subjectId", args.subjectId))
        .first();
      teacherId = row?.teacherId;
    }
    if (!teacherId) fail("INVALID", "No teacher is assigned to this subject in this class.");
    const id = await ctx.db.insert("materials", {
      title: args.title.trim(),
      description: args.description.trim(),
      classId: args.classId,
      subjectId: args.subjectId,
      teacherId,
      kind: args.kind,
      url,
      media: args.media,
      sizeBytes: args.media?.bytes ?? 0,
      uploadedAt: nowISO(),
      downloads: 0,
    });
    await audit(ctx, viewer, { action: "Published material", entity: "Material", entityId: id, newValue: args.title });
    return id;
  },
});

export const removeMaterial = mutation({
  args: { id: v.id("materials") },
  handler: async (ctx, { id }) => {
    const viewer = await requireStaff(ctx);
    const m = await ctx.db.get(id);
    if (!m) return null;
    if (!isAdmin(viewer) && m.teacherId !== viewer.teacherId) fail("FORBIDDEN", "You can only remove your own materials.");
    await ctx.db.delete(id);
    return { publicId: m.media?.publicId, resourceType: m.media?.resourceType };
  },
});
