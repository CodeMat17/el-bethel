import { v } from "convex/values";

import { query } from "./_generated/server";
import { assertTeachesClass, isAdmin, requireStaff, teacherClassIds } from "./lib/access";
import { toStudents } from "./lib/mappers";
import { withId } from "./lib/util";
import { classroomQuizzes } from "./quizzes";

/** Pupil and assignment counts for each class the viewer teaches. */
export const summaries = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireStaff(ctx);
    const classIds = isAdmin(viewer) && !viewer.teacherId
      ? (await ctx.db.query("classes").collect()).map((c) => c._id)
      : viewer.teacherId
        ? [...(await teacherClassIds(ctx, viewer.teacherId))]
        : [];
    return await Promise.all(
      classIds.map(async (classId) => {
        const [students, assignments] = await Promise.all([
          ctx.db.query("students").withIndex("by_class", (q) => q.eq("classId", classId)).collect(),
          ctx.db.query("assignments").withIndex("by_class", (q) => q.eq("classId", classId)).collect(),
        ]);
        return {
          classId,
          pupils: students.filter((s) => s.status === "active").length,
          assignments: assignments.filter((a) => a.status !== "draft").length,
        };
      }),
    );
  },
});

/** The digital classroom: roster with attendance, assignments with progress, materials and quizzes. */
export const overview = query({
  args: { classId: v.string() },
  handler: async (ctx, args) => {
    const viewer = await requireStaff(ctx);
    const classId = ctx.db.normalizeId("classes", args.classId);
    if (!classId) return null;
    const cls = await ctx.db.get(classId);
    if (!cls) return null;
    await assertTeachesClass(ctx, viewer, classId);

    const [students, attendance, assignments, materials, quizzes, timetable] = await Promise.all([
      ctx.db.query("students").withIndex("by_class", (q) => q.eq("classId", classId)).collect(),
      ctx.db.query("attendance").withIndex("by_class_date", (q) => q.eq("classId", classId)).order("desc").take(4000),
      ctx.db.query("assignments").withIndex("by_class", (q) => q.eq("classId", classId)).collect(),
      ctx.db.query("materials").withIndex("by_class", (q) => q.eq("classId", classId)).collect(),
      classroomQuizzes(ctx, classId),
      ctx.db.query("timetable").withIndex("by_class", (q) => q.eq("classId", classId)).collect(),
    ]);
    const active = students.filter((s) => s.status === "active");
    const rates = new Map<string, { present: number; total: number }>();
    for (const r of attendance) {
      const e = rates.get(r.studentId) ?? { present: 0, total: 0 };
      e.total += 1;
      if (r.status === "present" || r.status === "late") e.present += 1;
      rates.set(r.studentId, e);
    }
    const roster = (await toStudents(ctx, active))
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
      .map((s) => {
        const e = rates.get(s.id);
        return { ...s, attendanceRate: e?.total ? Math.round((e.present / e.total) * 100) : 0 };
      });

    const withStats = await Promise.all(
      assignments
        .filter((a) => a.status !== "draft" || a.teacherId === viewer.teacherId)
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
        .map(async (a) => {
          const subs = await ctx.db.query("submissions").withIndex("by_assignment", (q) => q.eq("assignmentId", a._id)).collect();
          const graded = subs.filter((s) => s.status === "graded").length;
          return {
            assignment: withId(a),
            stats: { students: active.length, submitted: subs.length, graded, pendingGrading: subs.length - graded, notSubmitted: Math.max(0, active.length - subs.length) },
          };
        }),
    );

    return {
      class: withId(cls),
      roster,
      assignments: withStats,
      materials: materials.map(withId).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
      quizzes,
      timetable: timetable.map(withId),
    };
  },
});
