import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { assertStudentAccess, requireAdmin, requireViewer } from "./lib/access";
import { audit, notify, nowISO, withId } from "./lib/util";

/**
 * Automated parent insights: every Friday afternoon a scheduled job writes a
 * short, rule-based summary of each pupil's week — attendance, homework, marks,
 * quizzes and reading — and tells their parents it is ready. The wording is
 * generated from fixed rules, so it is predictable and checkable; nothing here
 * makes a decision about a child.
 */

const BATCH = 20;

type Point = Doc<"parentInsights">["points"][number];

/** Monday (YYYY-MM-DD) of the week containing `date`. */
export function mondayOf(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

const plus = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

async function summarise(ctx: MutationCtx, student: Doc<"students">, weekOf: string) {
  const weekEnd = plus(weekOf, 7);
  const from = `${weekOf}T00:00:00.000Z`;
  const to = `${weekEnd}T00:00:00.000Z`;

  const attendance = await ctx.db
    .query("attendance")
    .withIndex("by_student", (q) => q.eq("studentId", student._id).gte("date", weekOf).lt("date", weekEnd))
    .collect();
  const attended = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const absent = attendance.filter((a) => a.status === "absent").length;
  const late = attendance.filter((a) => a.status === "late").length;

  const assignments = (await ctx.db.query("assignments").withIndex("by_class", (q) => q.eq("classId", student.classId)).collect()).filter(
    (a) => (a.status === "published" || a.status === "closed") && a.dueDate >= from && a.dueDate < to,
  );
  const submissions = await ctx.db.query("submissions").withIndex("by_student", (q) => q.eq("studentId", student._id)).collect();
  const handed = assignments.filter((a) => submissions.some((s) => s.assignmentId === a._id));
  const missing = assignments.filter((a) => !submissions.some((s) => s.assignmentId === a._id));

  const markedThisWeek = submissions.filter((s) => s.status === "graded" && s.gradedAt && s.gradedAt >= from && s.gradedAt < to);
  const scores: number[] = [];
  let best: { title: string; score: number } | null = null;
  for (const s of markedThisWeek) {
    const a = await ctx.db.get(s.assignmentId);
    if (!a?.maxScore || s.score === undefined) continue;
    const score = Math.round((s.score / a.maxScore) * 100);
    scores.push(score);
    if (!best || score > best.score) best = { title: a.title, score };
  }
  const quizzes = (await ctx.db.query("quizAttempts").withIndex("by_student", (q) => q.eq("studentId", student._id)).collect()).filter(
    (q) => q.submittedAt && q.submittedAt >= from && q.submittedAt < to,
  );
  const reading = await ctx.db
    .query("readingLogs")
    .withIndex("by_student", (q) => q.eq("studentId", student._id).gte("date", weekOf).lt("date", weekEnd))
    .collect();
  const readingMinutes = reading.reduce((n, r) => n + r.minutes, 0);
  const averageScore = scores.length ? Math.round(scores.reduce((n, x) => n + x, 0) / scores.length) : undefined;
  const attendanceRate = attendance.length ? Math.round((attended / attendance.length) * 100) : undefined;

  const name = student.firstName;
  const points: Point[] = [];
  if (attendance.length > 0) {
    if (absent === 0 && late === 0) points.push({ tone: "success", area: "Attendance", text: `${name} was at school on time every day recorded this week.` });
    else if (absent > 0) points.push({ tone: absent >= 2 ? "danger" : "warning", area: "Attendance", text: `${name} missed ${absent} ${absent === 1 ? "day" : "days"} this week.` });
    if (late > 0) points.push({ tone: "warning", area: "Punctuality", text: `${name} arrived late ${late} ${late === 1 ? "time" : "times"}.` });
  }
  if (assignments.length > 0) {
    if (missing.length === 0) points.push({ tone: "success", area: "Homework", text: `All ${assignments.length} pieces of homework due this week were handed in.` });
    else
      points.push({
        tone: missing.length >= 2 ? "danger" : "warning",
        area: "Homework",
        text: `${missing.length} of ${assignments.length} pieces of homework were not handed in: ${missing.map((a) => a.title).slice(0, 3).join(", ")}.`,
      });
  }
  if (best && best.score >= 70) points.push({ tone: "success", area: "Marks", text: `Top mark this week: ${best.score}% in "${best.title}".` });
  if (averageScore !== undefined && averageScore < 50) points.push({ tone: "warning", area: "Marks", text: `Marked work averaged ${averageScore}% this week — worth going over together.` });
  if (quizzes.length > 0) points.push({ tone: "info", area: "Quizzes", text: `${name} completed ${quizzes.length} online ${quizzes.length === 1 ? "quiz" : "quizzes"}.` });
  if (readingMinutes > 0) points.push({ tone: readingMinutes >= 90 ? "success" : "info", area: "Reading", text: `${readingMinutes} minutes of reading logged.` });
  else points.push({ tone: "info", area: "Reading", text: `No reading was logged. Twenty minutes a day makes a big difference.` });

  const concerns = points.filter((p) => p.tone === "warning" || p.tone === "danger").length;
  const wins = points.filter((p) => p.tone === "success").length;
  const headline =
    concerns === 0 && wins > 0
      ? `A strong week for ${name}.`
      : concerns >= 2
        ? `A few things to look at with ${name} this week.`
        : concerns === 1
          ? `A good week for ${name}, with one thing to keep an eye on.`
          : `${name}'s week at a glance.`;

  return {
    headline,
    points,
    metrics: {
      attendanceRate,
      daysRecorded: attendance.length,
      homeworkDue: assignments.length,
      homeworkDone: handed.length,
      averageScore,
      quizzes: quizzes.length,
      readingMinutes,
    },
  };
}

/** One batch of pupils; schedules the next batch until every active pupil is done. */
export const generateBatch = internalMutation({
  args: { weekOf: v.string(), paginationOpts: paginationOptsValidator, notifyParents: v.boolean() },
  handler: async (ctx, { weekOf, paginationOpts, notifyParents }) => {
    const page = await ctx.db
      .query("students")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .paginate(paginationOpts);
    for (const student of page.page) {
      const links = await ctx.db.query("guardianships").withIndex("by_student", (q) => q.eq("studentId", student._id)).collect();
      if (links.length === 0) continue;
      const summary = await summarise(ctx, student, weekOf);
      const existing = await ctx.db
        .query("parentInsights")
        .withIndex("by_student", (q) => q.eq("studentId", student._id).eq("weekOf", weekOf))
        .first();
      if (existing) await ctx.db.patch(existing._id, { ...summary, generatedAt: nowISO() });
      else await ctx.db.insert("parentInsights", { studentId: student._id, weekOf, ...summary, generatedAt: nowISO() });
      if (!notifyParents || existing) continue;
      for (const link of links) {
        const account = await ctx.db.query("users").withIndex("by_parent", (q) => q.eq("parentId", link.parentId)).first();
        if (!account?.active) continue;
        await notify(ctx, account._id, {
          type: "parent_insight",
          title: `${student.firstName}'s week: ${summary.headline}`,
          body: summary.points
            .slice(0, 3)
            .map((p) => p.text)
            .join(" "),
          href: `/portal/parent/progress?child=${student._id}`,
        });
      }
    }
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.parentInsights.generateBatch, {
        weekOf,
        paginationOpts: { numItems: BATCH, cursor: page.continueCursor },
        notifyParents,
      });
    }
  },
});

/** Friday afternoon job (see crons.ts). */
export const weekly = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.parentInsights.generateBatch, {
      weekOf: mondayOf(),
      paginationOpts: { numItems: BATCH, cursor: null },
      notifyParents: true,
    });
  },
});

/** Administrators can refresh this week's summaries on demand (parents are notified once per week). */
export const generateNow = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireAdmin(ctx);
    await ctx.scheduler.runAfter(0, internal.parentInsights.generateBatch, {
      weekOf: mondayOf(),
      paginationOpts: { numItems: BATCH, cursor: null },
      notifyParents: true,
    });
    await audit(ctx, viewer, { action: "Generated weekly insights", entity: "Parent insights", entityId: mondayOf() });
  },
});

/** The latest weekly summaries for one child. */
export const forChild = query({
  args: { studentId: v.id("students"), limit: v.optional(v.number()) },
  handler: async (ctx, { studentId, limit }) => {
    const viewer = await requireViewer(ctx);
    await assertStudentAccess(ctx, viewer, studentId);
    const rows = await ctx.db
      .query("parentInsights")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .order("desc")
      .take(Math.min(limit ?? 8, 26));
    return rows.map(withId);
  },
});

/** How many families got this week's summary (admin reports). */
export const weekStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const weekOf = mondayOf();
    const rows = await ctx.db.query("parentInsights").withIndex("by_week", (q) => q.eq("weekOf", weekOf)).collect();
    const last = rows.reduce<string | null>((m, r) => (!m || r.generatedAt > m ? r.generatedAt : m), null);
    return { weekOf, pupils: rows.length, generatedAt: last };
  },
});
