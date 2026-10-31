import { v } from "convex/values";

import { CLASS_LEVELS } from "../lib/school/config";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { getViewer, parentStudentIds, requireAdmin, teacherClassIds } from "./lib/access";
import { nowISO, withId } from "./lib/util";

/** Header data for the portal shells: unread count plus a role-specific label. */
export const shell = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return null;
    const unread = (
      await ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q) => q.eq("userId", viewer._id).eq("read", false))
        .collect()
    ).length;
    let classes = 0;
    let children = 0;
    let pupilClassId: Id<"classes"> | null = null;
    if (viewer.teacherId) classes = (await teacherClassIds(ctx, viewer.teacherId)).size;
    if (viewer.parentId) children = (await parentStudentIds(ctx, viewer.parentId)).length;
    if (viewer.studentId) pupilClassId = (await ctx.db.get(viewer.studentId))?.classId ?? null;
    return { unread, classes, children, pupilClassId };
  },
});

/** Headline numbers for the admin dashboard. */
export const metrics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [students, teachers, parents, applications, assignments, submissions, invoices, events] = await Promise.all([
      ctx.db.query("students").collect(),
      ctx.db.query("teachers").collect(),
      ctx.db.query("parents").collect(),
      ctx.db.query("applications").collect(),
      ctx.db.query("assignments").collect(),
      ctx.db.query("submissions").collect(),
      ctx.db.query("invoices").collect(),
      ctx.db.query("events").collect(),
    ]);
    const active = students.filter((s) => s.status === "active");
    const classes = await ctx.db.query("classes").collect();
    const levelOf = new Map(classes.map((c) => [c._id, c.levelId]));
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const billed = invoices.reduce((n, i) => n + i.total, 0);
    const collected = invoices.reduce((n, i) => n + i.amountPaid, 0);
    const scored = submissions.filter((s) => s.status === "graded" && typeof s.score === "number");
    const appCounts = new Map<string, number>();
    for (const a of applications.filter((x) => x.status !== "draft")) appCounts.set(a.status, (appCounts.get(a.status) ?? 0) + 1);
    const today = nowISO().slice(0, 10);

    return {
      students: active.length,
      teachers: teachers.filter((t) => t.active).length,
      parents: parents.length,
      newApplicants: applications.filter((a) => a.status !== "draft" && (a.submittedAt ?? a.createdAt) >= monthAgo).length,
      pendingAdmissions: applications.filter((a) => ["submitted", "under_review", "documents_required"].includes(a.status)).length,
      assignments: assignments.filter((a) => a.status === "published").length,
      upcomingEvents: events.filter((e) => e.status !== "cancelled" && (e.endDate ?? e.date).slice(0, 10) >= today).length,
      feesBilled: billed,
      feesCollected: collected,
      outstanding: billed - collected,
      collectionRate: billed ? Math.round((collected / billed) * 100) : 0,
      enrolment: CLASS_LEVELS.map((l) => ({ level: l.name, levelId: l.id, count: active.filter((s) => levelOf.get(s.classId) === l.id).length })),
      applicationsByStatus: [...appCounts.entries()].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
      applicationsByLevel: CLASS_LEVELS.map((l) => ({ label: l.name, value: applications.filter((a) => a.status !== "draft" && a.intendedLevelId === l.id).length })),
      submissions: {
        total: submissions.length,
        graded: submissions.filter((s) => s.status === "graded").length,
        pending: submissions.filter((s) => s.status === "submitted").length,
        averagePercent: scored.length
          ? Math.round(
              scored.reduce((n, s) => {
                const a = assignments.find((x) => x._id === s.assignmentId);
                return n + (a?.maxScore ? (s.score ?? 0) / a.maxScore : 0);
              }, 0) /
                scored.length *
                100,
            )
          : 0,
      },
      outstandingByLevel: CLASS_LEVELS.map((l) => {
        const amount = invoices
          .filter((i) => {
            const s = students.find((x) => x._id === i.studentId);
            return s ? levelOf.get(s.classId) === l.id : false;
          })
          .reduce((n, i) => n + (i.total - i.amountPaid), 0);
        return { label: l.name, amount };
      }),
    };
  },
});

/** Grade distribution and subject averages for a term (defaults to the latest term with results). */
export const academics = query({
  args: { termId: v.optional(v.id("terms")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let termId = args.termId ?? null;
    if (!termId) {
      const terms = (await ctx.db.query("terms").collect()).sort((a, b) => b.startDate.localeCompare(a.startDate));
      for (const t of terms) {
        if (await ctx.db.query("results").withIndex("by_term", (q) => q.eq("termId", t._id)).first()) {
          termId = t._id;
          break;
        }
      }
    }
    if (!termId) return { term: null, grades: [], bySubject: [] };
    const term = await ctx.db.get(termId);
    const results = await ctx.db.query("results").withIndex("by_term", (q) => q.eq("termId", termId!)).take(15000);
    const bySubject = new Map<string, { sum: number; n: number }>();
    for (const r of results) {
      const e = bySubject.get(r.subjectId) ?? { sum: 0, n: 0 };
      e.sum += r.total;
      e.n += 1;
      bySubject.set(r.subjectId, e);
    }
    return {
      term: term ? withId(term) : null,
      grades: ["A", "B", "C", "D", "E", "F"].map((grade) => ({ grade, count: results.filter((r) => r.grade === grade).length })),
      bySubject: [...bySubject.entries()].map(([subjectId, e]) => ({ subjectId, average: Math.round(e.sum / e.n) })).sort((a, b) => b.average - a.average),
    };
  },
});

/** One summary line per child for the signed-in parent. */
export const childSummaries = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer?.parentId) return [];
    const now = Date.now();
    const out = [];
    for (const studentId of await parentStudentIds(ctx, viewer.parentId)) {
      const student = await ctx.db.get(studentId);
      if (!student) continue;
      const [assignments, invoices] = await Promise.all([
        ctx.db.query("assignments").withIndex("by_class", (q) => q.eq("classId", student.classId)).collect(),
        ctx.db.query("invoices").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect(),
      ]);
      let pending = 0;
      for (const a of assignments) {
        if (a.status !== "published" || Date.parse(a.startDate) > now || Date.parse(a.dueDate) < now) continue;
        const sub = await ctx.db
          .query("submissions")
          .withIndex("by_assignment_student", (q) => q.eq("assignmentId", a._id).eq("studentId", studentId))
          .unique();
        if (!sub) pending += 1;
      }
      out.push({
        studentId,
        pendingAssignments: pending,
        balance: invoices.reduce((n, i) => n + (i.total - i.amountPaid), 0),
      });
    }
    return out;
  },
});
