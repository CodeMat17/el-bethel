import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { assertStudentAccess, assertTeachesClass, fail, isAdmin, requireStaff, requireViewer, teacherClassIds } from "./lib/access";
import { learningProfile, type Signal } from "./lib/learning";
import { looseId } from "./lib/util";

interface ClassRow {
  studentId: Id<"students">;
  name: string;
  average: number | null;
  change: number | null;
  homeworkRate: number | null;
  homeworkScore: number | null;
  quizScore: number | null;
  attendance: number | null;
  concerns: number;
  signals: Signal[];
}

/**
 * Advanced learning analytics. One pupil's profile for parents, the pupil and
 * their teachers; a whole-class table for teachers that surfaces who may need
 * support and which topics the class found hard.
 */

export const forStudent = query({
  // A string, because teacher and admin pages take the id from the URL.
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const studentId = looseId(ctx, "students", args.studentId);
    if (!studentId) fail("NOT_FOUND", "Pupil not found.");
    await assertStudentAccess(ctx, viewer, studentId);
    const staff = isAdmin(viewer) || Boolean(viewer.teacherId);
    const profile = await learningProfile(ctx, studentId, { includeUnpublished: staff });
    if (!profile) fail("NOT_FOUND", "Pupil not found.");
    return profile;
  },
});

/** Classes the viewer can analyse: all for administrators, their own for teachers. */
export const classOptions = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireStaff(ctx);
    const classes = await ctx.db.query("classes").collect();
    const mine = isAdmin(viewer) ? null : viewer.teacherId ? await teacherClassIds(ctx, viewer.teacherId) : new Set<Id<"classes">>();
    return classes
      .filter((c) => !mine || mine.has(c._id))
      .map((c) => ({ id: c._id, name: c.name, levelId: c.levelId }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const forClass = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const viewer = await requireStaff(ctx);
    await assertTeachesClass(ctx, viewer, classId);
    const cls = await ctx.db.get(classId);
    if (!cls) fail("NOT_FOUND", "Class not found.");
    const pupils = (await ctx.db.query("students").withIndex("by_class", (q) => q.eq("classId", classId)).collect()).filter((s) => s.status === "active");

    const rows: ClassRow[] = [];
    const topicPool = new Map<string, { subject: string; topic: string; scores: number[] }>();
    const subjectPool = new Map<string, { subject: string; totals: number[] }>();
    for (const p of pupils) {
      const profile = await learningProfile(ctx, p._id, { includeUnpublished: true, skipClassComparison: true });
      if (!profile) continue;
      for (const t of profile.topics) {
        const key = `${t.subject}::${t.topic.toLowerCase()}`;
        const e = topicPool.get(key) ?? { subject: t.subject, topic: t.topic, scores: [] };
        e.scores.push(t.score);
        topicPool.set(key, e);
      }
      for (const s of profile.subjects) {
        const e = subjectPool.get(s.subject) ?? { subject: s.subject, totals: [] };
        e.totals.push(s.total);
        subjectPool.set(s.subject, e);
      }
      const last = profile.termTrend.at(-1)?.average ?? null;
      const prev = profile.termTrend.at(-2)?.average ?? null;
      rows.push({
        studentId: p._id,
        name: `${p.firstName} ${p.lastName}`,
        average: last,
        change: last !== null && prev !== null ? last - prev : null,
        homeworkRate: profile.homework.rate,
        homeworkScore: profile.homework.averageScore,
        quizScore: profile.quizzes.averageScore,
        attendance: profile.attendance.rate,
        concerns: profile.signals.filter((s) => s.tone === "warning" || s.tone === "danger").length,
        signals: profile.signals.filter((s) => s.tone === "warning" || s.tone === "danger").slice(0, 3),
      });
    }
    const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((n, x) => n + x, 0) / xs.length) : null);
    const bands = [
      { label: "70+", min: 70, max: 101 },
      { label: "60–69", min: 60, max: 70 },
      { label: "50–59", min: 50, max: 60 },
      { label: "40–49", min: 40, max: 50 },
      { label: "Below 40", min: -1, max: 40 },
    ].map((b) => ({ label: b.label, value: rows.filter((r) => r.average !== null && r.average >= b.min && r.average < b.max).length }));

    return {
      class: { id: cls._id, name: cls.name },
      pupils: rows.sort((a, b) => b.concerns - a.concerns || (a.average ?? 101) - (b.average ?? 101)),
      summary: {
        average: mean(rows.flatMap((r) => (r.average === null ? [] : [r.average]))),
        homeworkRate: mean(rows.flatMap((r) => (r.homeworkRate === null ? [] : [r.homeworkRate]))),
        quizScore: mean(rows.flatMap((r) => (r.quizScore === null ? [] : [r.quizScore]))),
        attendance: mean(rows.flatMap((r) => (r.attendance === null ? [] : [r.attendance]))),
        needingSupport: rows.filter((r) => r.concerns >= 2).length,
      },
      distribution: bands,
      subjects: [...subjectPool.values()].map((s) => ({ label: s.subject, value: mean(s.totals) ?? 0 })).sort((a, b) => b.value - a.value),
      hardTopics: [...topicPool.values()]
        .filter((t) => t.scores.length >= 3)
        .map((t) => ({ subject: t.subject, topic: t.topic, score: mean(t.scores) ?? 0, pupils: t.scores.length }))
        .sort((a, b) => a.score - b.score)
        .slice(0, 6),
    };
  },
});
