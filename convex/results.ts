import { v } from "convex/values";

import { DEFAULT_CA_MAX, gradeFor, isValidCaMax } from "../lib/school/config";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import {
  assertCanPublishClassResults,
  assertStudentAccess,
  assertTeachesClass,
  assertTeachesSubject,
  fail,
  isAdmin,
  requireAdmin,
  requireStaff,
  requireViewer,
} from "./lib/access";
import { accountsForStudent, audit, notify, nowISO, withId } from "./lib/util";

/**
 * Exam results are a term summary: per subject a continuous-assessment score,
 * an exam score, total, grade and remark; per pupil an average, class position
 * and comments. Pupils and parents see them only once published (the printed
 * report card is handed out in school).
 */

type Ctx = QueryCtx | MutationCtx;

async function isPublished(ctx: Ctx, classId: Id<"classes">, termId: Id<"terms">) {
  const card = await ctx.db
    .query("reportCards")
    .withIndex("by_class_term", (q) => q.eq("classId", classId).eq("termId", termId))
    .first();
  return Boolean(card?.publishedAt);
}

/* ----------------------------- pupil & parent ----------------------------- */

/** Published term results for a pupil. Staff also see unpublished terms. */
export const forStudent = query({
  args: { studentId: v.id("students"), termId: v.optional(v.string()) },
  handler: async (ctx, { studentId, termId }) => {
    const viewer = await requireViewer(ctx);
    await assertStudentAccess(ctx, viewer, studentId);
    const staff = isAdmin(viewer) || Boolean(viewer.teacherId);

    const cards = (
      await ctx.db
        .query("reportCards")
        .withIndex("by_student", (q) => q.eq("studentId", studentId))
        .collect()
    ).filter((c) => staff || c.publishedAt);

    const terms = (await Promise.all(cards.map((c) => ctx.db.get(c.termId))))
      .filter((t): t is Doc<"terms"> => t !== null)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));

    const selected = terms.find((t) => t._id === termId) ?? terms[0] ?? null;
    if (!selected) return { terms: [], term: null, reportCard: null, results: [] };

    const card = cards.find((c) => c.termId === selected._id) ?? null;
    const results = await ctx.db
      .query("results")
      .withIndex("by_student_term", (q) => q.eq("studentId", studentId).eq("termId", selected._id))
      .collect();
    return {
      terms: terms.map(withId),
      term: withId(selected),
      reportCard: card ? withId(card) : null,
      results: results.map(withId),
    };
  },
});

/** Every term with results for a pupil, newest first (published terms only for families). */
export const allForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, { studentId }) => {
    const viewer = await requireViewer(ctx);
    await assertStudentAccess(ctx, viewer, studentId);
    const staff = isAdmin(viewer) || Boolean(viewer.teacherId);
    const cards = (
      await ctx.db
        .query("reportCards")
        .withIndex("by_student", (q) => q.eq("studentId", studentId))
        .collect()
    ).filter((c) => staff || c.publishedAt);
    const out = [];
    for (const card of cards) {
      const term = await ctx.db.get(card.termId);
      if (!term) continue;
      const results = await ctx.db
        .query("results")
        .withIndex("by_student_term", (q) => q.eq("studentId", studentId).eq("termId", card.termId))
        .collect();
      out.push({ term: withId(term), reportCard: withId(card), results: results.map(withId) });
    }
    return out.sort((a, b) => b.term.startDate.localeCompare(a.term.startDate));
  },
});

/** A pupil's report cards across terms (for trends on dashboards). */
export const historyForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, { studentId }) => {
    const viewer = await requireViewer(ctx);
    await assertStudentAccess(ctx, viewer, studentId);
    const staff = isAdmin(viewer) || Boolean(viewer.teacherId);
    const cards = (
      await ctx.db
        .query("reportCards")
        .withIndex("by_student", (q) => q.eq("studentId", studentId))
        .collect()
    ).filter((c) => staff || c.publishedAt);
    return cards.map(withId);
  },
});

/* ------------------------------ subject sheet ----------------------------- */

/** Score sheet for one subject in one class and term. */
export const subjectSheet = query({
  args: { classId: v.id("classes"), subjectId: v.id("subjects"), termId: v.id("terms") },
  handler: async (ctx, { classId, subjectId, termId }) => {
    const viewer = await requireStaff(ctx);
    await assertTeachesSubject(ctx, viewer, classId, subjectId);
    const [students, results, published] = await Promise.all([
      ctx.db
        .query("students")
        .withIndex("by_class", (q) => q.eq("classId", classId))
        .collect(),
      ctx.db
        .query("results")
        .withIndex("by_class_term_subject", (q) => q.eq("classId", classId).eq("termId", termId).eq("subjectId", subjectId))
        .collect(),
      isPublished(ctx, classId, termId),
    ]);
    const byStudent = new Map(results.map((r) => [r.studentId, r]));
    return {
      published,
      locked: published && !isAdmin(viewer),
      caMax: results.find((r) => r.caMax !== undefined)?.caMax ?? DEFAULT_CA_MAX,
      rows: students
        .filter((s) => s.status === "active" || byStudent.has(s._id))
        .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
        .map((s) => {
          const r = byStudent.get(s._id);
          return {
            student: { id: s._id, firstName: s.firstName, lastName: s.lastName, studentNo: s.studentNo, avatarSeed: s.avatarSeed },
            result: r ? withId(r) : null,
          };
        }),
    };
  },
});

async function rankSubject(ctx: MutationCtx, classId: Id<"classes">, termId: Id<"terms">, subjectId: Id<"subjects">) {
  const rows = await ctx.db
    .query("results")
    .withIndex("by_class_term_subject", (q) => q.eq("classId", classId).eq("termId", termId).eq("subjectId", subjectId))
    .collect();
  const sorted = [...rows].sort((a, b) => b.total - a.total);
  let position = 0;
  let previous: number | null = null;
  for (const [i, r] of sorted.entries()) {
    if (r.total !== previous) position = i + 1;
    previous = r.total;
    if (r.position !== position) await ctx.db.patch(r._id, { position });
  }
}

export const saveSubjectScores = mutation({
  args: {
    classId: v.id("classes"),
    subjectId: v.id("subjects"),
    termId: v.id("terms"),
    /** Marks the CA is out of; the exam is out of 100 minus this. */
    caMax: v.number(),
    rows: v.array(v.object({ studentId: v.id("students"), ca: v.optional(v.number()), exam: v.optional(v.number()) })),
  },
  handler: async (ctx, { classId, subjectId, termId, caMax, rows }) => {
    const viewer = await requireStaff(ctx);
    await assertTeachesSubject(ctx, viewer, classId, subjectId);
    if ((await isPublished(ctx, classId, termId)) && !isAdmin(viewer)) {
      fail("INVALID", "These results have been published. Ask an administrator to make changes.");
    }
    if (!isValidCaMax(caMax)) fail("INVALID", "The CA weighting must be a whole number between 0 and 100.");
    const examMax = 100 - caMax;
    let saved = 0;
    for (const row of rows) {
      const student = await ctx.db.get(row.studentId);
      if (!student || student.classId !== classId) fail("INVALID", "A pupil on the sheet is not in this class.");
      const existing = await ctx.db
        .query("results")
        .withIndex("by_student_term", (q) => q.eq("studentId", row.studentId).eq("termId", termId))
        .collect()
        .then((rs) => rs.find((r) => r.subjectId === subjectId));
      if (row.ca === undefined && row.exam === undefined) {
        if (existing) await ctx.db.delete(existing._id);
        continue;
      }
      const ca = row.ca ?? 0;
      const exam = row.exam ?? 0;
      const name = `${student.firstName} ${student.lastName}`;
      if (!Number.isFinite(ca) || ca < 0 || ca > caMax) fail("INVALID", `${name}: CA must be between 0 and ${caMax}.`);
      if (!Number.isFinite(exam) || exam < 0 || exam > examMax) fail("INVALID", `${name}: exam must be between 0 and ${examMax}.`);
      const total = Math.round((ca + exam) * 10) / 10;
      const { grade, remark } = gradeFor(total);
      const doc = { ca, exam, caMax, total, grade, remark, enteredBy: viewer._id, updatedAt: nowISO() };
      if (existing) await ctx.db.patch(existing._id, doc);
      else await ctx.db.insert("results", { studentId: row.studentId, subjectId, classId, termId, ...doc });
      saved += 1;
    }
    await rankSubject(ctx, classId, termId, subjectId);
    const subject = await ctx.db.get(subjectId);
    await audit(ctx, viewer, { action: "Entered scores", entity: "Results", entityId: `${classId}:${subjectId}:${termId}`, newValue: `${subject?.name ?? "Subject"} · ${saved} pupils · CA ${caMax} / exam ${examMax}` });
    return { saved };
  },
});

/* ------------------------------ class summary ----------------------------- */

async function computeSummary(ctx: Ctx, classId: Id<"classes">, termId: Id<"terms">) {
  const [students, results, cards, cls] = await Promise.all([
    ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", classId))
      .collect(),
    ctx.db
      .query("results")
      .withIndex("by_class_term", (q) => q.eq("classId", classId).eq("termId", termId))
      .collect(),
    ctx.db
      .query("reportCards")
      .withIndex("by_class_term", (q) => q.eq("classId", classId).eq("termId", termId))
      .collect(),
    ctx.db.get(classId),
  ]);
  if (!cls) fail("NOT_FOUND", "Class not found.");
  const subjects = (await ctx.db.query("subjects").collect()).filter((s) => s.levelIds.includes(cls.levelId));
  const subjectIdsWithScores = new Set(results.map((r) => r.subjectId));

  const roster = students.filter((s) => s.status === "active" || results.some((r) => r.studentId === s._id));
  const rows = roster.map((s) => {
    const mine = results.filter((r) => r.studentId === s._id);
    const totalScore = mine.reduce((n, r) => n + r.total, 0);
    const average = mine.length ? Math.round((totalScore / mine.length) * 10) / 10 : 0;
    return { student: s, results: mine, totalScore: Math.round(totalScore * 10) / 10, average, card: cards.find((c) => c.studentId === s._id) ?? null };
  });
  const ranked = [...rows].sort((a, b) => b.average - a.average);
  const positions = new Map<string, number>();
  let pos = 0;
  let prev: number | null = null;
  ranked.forEach((r, i) => {
    if (r.average !== prev) pos = i + 1;
    prev = r.average;
    positions.set(r.student._id, pos);
  });
  return { cls, subjects, subjectIdsWithScores, rows, positions, cards };
}

/** Everything a class teacher needs before publishing a term's results. */
export const classSummary = query({
  args: { classId: v.id("classes"), termId: v.id("terms") },
  handler: async (ctx, { classId, termId }) => {
    const viewer = await requireStaff(ctx);
    await assertTeachesClass(ctx, viewer, classId);
    const { cls, subjects, subjectIdsWithScores, rows, positions, cards } = await computeSummary(ctx, classId, termId);
    const published = cards.some((c) => c.publishedAt);
    return {
      canPublish: isAdmin(viewer) || cls.classTeacherId === viewer.teacherId,
      published,
      publishedAt: cards.find((c) => c.publishedAt)?.publishedAt ?? null,
      subjects: subjects.map((s) => ({
        id: s._id,
        name: s.name,
        code: s.code,
        entered: subjectIdsWithScores.has(s._id),
        count: rows.filter((r) => r.results.some((x) => x.subjectId === s._id)).length,
      })),
      rows: rows
        .map((r) => ({
          student: { id: r.student._id, firstName: r.student.firstName, lastName: r.student.lastName, studentNo: r.student.studentNo, avatarSeed: r.student.avatarSeed },
          subjects: r.results.length,
          totalScore: r.totalScore,
          average: r.average,
          position: positions.get(r.student._id) ?? 0,
          teacherComment: r.card?.teacherComment ?? "",
          headteacherComment: r.card?.headteacherComment ?? "",
          reportCardId: r.card?._id ?? null,
        }))
        .sort((a, b) => a.position - b.position),
    };
  },
});

function defaultTeacherComment(average: number) {
  if (average >= 75) return "A consistently strong term. Keep up the excellent attitude to learning.";
  if (average >= 60) return "A good term with steady progress. More practice will lift the results further.";
  if (average >= 45) return "Improvement is showing. Continued support at home is encouraged.";
  return "This term has been challenging. We will work closely with you to support progress.";
}

function defaultHeadComment(average: number) {
  return average >= 75 ? "An excellent result. Well done." : average >= 50 ? "A promising result. Keep working hard." : "More effort is needed next term.";
}

/** Publish (or re-publish) a class's term results. Pupils and parents see them immediately. */
export const publishClass = mutation({
  args: {
    classId: v.id("classes"),
    termId: v.id("terms"),
    comments: v.optional(
      v.array(v.object({ studentId: v.id("students"), teacherComment: v.string(), headteacherComment: v.optional(v.string()) })),
    ),
  },
  handler: async (ctx, { classId, termId, comments }) => {
    const viewer = await requireStaff(ctx);
    await assertCanPublishClassResults(ctx, viewer, classId);
    const term = await ctx.db.get(termId);
    if (!term) fail("NOT_FOUND", "Term not found.");
    const { cls, rows, positions } = await computeSummary(ctx, classId, termId);
    const withScores = rows.filter((r) => r.results.length > 0);
    if (withScores.length === 0) fail("INVALID", "No scores have been entered for this class and term yet.");

    const commentMap = new Map((comments ?? []).map((c) => [c.studentId, c]));
    const now = nowISO();
    for (const r of withScores) {
      const given = commentMap.get(r.student._id);
      const doc = {
        average: r.average,
        totalScore: r.totalScore,
        position: positions.get(r.student._id) ?? 0,
        classSize: withScores.length,
        teacherComment: given?.teacherComment.trim() || r.card?.teacherComment || defaultTeacherComment(r.average),
        headteacherComment: given?.headteacherComment?.trim() || r.card?.headteacherComment || defaultHeadComment(r.average),
        publishedAt: now,
        publishedBy: viewer._id,
      };
      if (r.card) await ctx.db.patch(r.card._id, doc);
      else {
        await ctx.db.insert("reportCards", {
          studentId: r.student._id,
          termId,
          classId,
          conduct: [],
          promotionStatus: "pending",
          ...doc,
        });
      }
      for (const userId of await accountsForStudent(ctx, r.student._id)) {
        const user = await ctx.db.get(userId);
        const isPupil = Boolean(user?.studentId);
        await notify(ctx, userId, {
          type: "result_published",
          title: isPupil ? `Your ${term.name} results are ready` : `${r.student.firstName}'s ${term.name} results are ready`,
          body: `Average ${r.average}% · position ${positions.get(r.student._id)} of ${withScores.length}.`,
          href: isPupil ? "/portal/pupil/results" : "/portal/parent/results",
        });
      }
    }
    await audit(ctx, viewer, { action: "Published term results", entity: "Results", entityId: `${classId}:${termId}`, newValue: `${cls.name} · ${term.name}` });
    return { published: withScores.length };
  },
});

export const unpublishClass = mutation({
  args: { classId: v.id("classes"), termId: v.id("terms") },
  handler: async (ctx, { classId, termId }) => {
    const viewer = await requireAdmin(ctx);
    const cards = await ctx.db
      .query("reportCards")
      .withIndex("by_class_term", (q) => q.eq("classId", classId).eq("termId", termId))
      .collect();
    for (const c of cards) await ctx.db.patch(c._id, { publishedAt: undefined, publishedBy: undefined });
    await audit(ctx, viewer, { action: "Withdrew term results", entity: "Results", entityId: `${classId}:${termId}` });
  },
});

/* --------------------------------- admin ---------------------------------- */

/** Every class's result status for a term. */
export const overview = query({
  args: { termId: v.optional(v.id("terms")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const termId =
      args.termId ??
      (await ctx.db
        .query("terms")
        .withIndex("by_active", (q) => q.eq("active", true))
        .first())?._id;
    if (!termId) return { termId: null, classes: [], grades: [] };
    const [classes, results, cards] = await Promise.all([
      ctx.db.query("classes").collect(),
      ctx.db
        .query("results")
        .withIndex("by_term", (q) => q.eq("termId", termId))
        .collect(),
      ctx.db
        .query("reportCards")
        .withIndex("by_term", (q) => q.eq("termId", termId))
        .collect(),
    ]);
    const grades = ["A", "B", "C", "D", "E", "F"].map((g) => ({ grade: g, count: results.filter((r) => r.grade === g).length }));
    return {
      termId,
      grades,
      classes: classes.map((c) => {
        const mine = results.filter((r) => r.classId === c._id);
        const myCards = cards.filter((x) => x.classId === c._id);
        const avg = mine.length ? Math.round((mine.reduce((n, r) => n + r.total, 0) / mine.length) * 10) / 10 : 0;
        return {
          classId: c._id,
          entries: mine.length,
          pupils: new Set(mine.map((r) => r.studentId)).size,
          subjects: new Set(mine.map((r) => r.subjectId)).size,
          average: avg,
          published: myCards.some((x) => x.publishedAt),
          publishedAt: myCards.find((x) => x.publishedAt)?.publishedAt ?? null,
        };
      }),
    };
  },
});
