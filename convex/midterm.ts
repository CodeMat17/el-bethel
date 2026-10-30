import { v } from "convex/values";

import { DEFAULT_MIDTERM_MAX, gradeFor, isValidMidtermMax } from "../lib/school/config";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
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
 * Mid-term assessment: one test score per subject, taken halfway through the
 * term so families can follow progress before the end-of-term exams. It is
 * kept apart from the end-of-term CA and exam. Pupils and parents see a class's
 * mid-term results once the class teacher publishes them.
 */

type Ctx = QueryCtx | MutationCtx;

function publication(ctx: Ctx, classId: Id<"classes">, termId: Id<"terms">) {
  return ctx.db
    .query("midtermPublications")
    .withIndex("by_class_term", (q) => q.eq("classId", classId).eq("termId", termId))
    .first();
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Each pupil's mid-term average across subjects, with a class position (ties share a place). */
function rankPupils(scores: Doc<"midtermScores">[]) {
  const byStudent = new Map<Id<"students">, Doc<"midtermScores">[]>();
  for (const s of scores) byStudent.set(s.studentId, [...(byStudent.get(s.studentId) ?? []), s]);
  const rows = [...byStudent.entries()].map(([studentId, mine]) => ({
    studentId,
    subjects: mine.length,
    average: round1(mine.reduce((n, s) => n + s.percent, 0) / mine.length),
  }));
  rows.sort((a, b) => b.average - a.average);
  const positions = new Map<Id<"students">, number>();
  let pos = 0;
  let prev: number | null = null;
  rows.forEach((r, i) => {
    if (r.average !== prev) pos = i + 1;
    prev = r.average;
    positions.set(r.studentId, pos);
  });
  return { rows, positions };
}

/* ----------------------------- pupil & parent ----------------------------- */

/** Every term with mid-term results for a pupil, newest first (published only for families). */
export const allForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, { studentId }) => {
    const viewer = await requireViewer(ctx);
    await assertStudentAccess(ctx, viewer, studentId);
    const staff = isAdmin(viewer) || Boolean(viewer.teacherId);
    const mine = await ctx.db
      .query("midtermScores")
      .withIndex("by_student_term", (q) => q.eq("studentId", studentId))
      .collect();

    const groups = new Map<string, Doc<"midtermScores">[]>();
    for (const s of mine) groups.set(`${s.classId}:${s.termId}`, [...(groups.get(`${s.classId}:${s.termId}`) ?? []), s]);

    const out = [];
    for (const scores of groups.values()) {
      const { classId, termId } = scores[0];
      const [term, published] = await Promise.all([ctx.db.get(termId), publication(ctx, classId, termId)]);
      if (!term || (!published && !staff)) continue;
      const classScores = await ctx.db
        .query("midtermScores")
        .withIndex("by_class_term", (q) => q.eq("classId", classId).eq("termId", termId))
        .collect();
      const { rows, positions } = rankPupils(classScores);
      const me = rows.find((r) => r.studentId === studentId);
      out.push({
        term: withId(term),
        classId,
        average: me?.average ?? 0,
        position: positions.get(studentId) ?? 0,
        classSize: rows.length,
        classAverage: rows.length ? round1(rows.reduce((n, r) => n + r.average, 0) / rows.length) : 0,
        publishedAt: published?.publishedAt ?? null,
        scores: scores.map(withId),
      });
    }
    return out.sort((a, b) => b.term.startDate.localeCompare(a.term.startDate));
  },
});

/* ------------------------------ subject sheet ----------------------------- */

/** Mid-term score sheet for one subject in one class and term. */
export const subjectSheet = query({
  args: { classId: v.id("classes"), subjectId: v.id("subjects"), termId: v.id("terms") },
  handler: async (ctx, { classId, subjectId, termId }) => {
    const viewer = await requireStaff(ctx);
    await assertTeachesSubject(ctx, viewer, classId, subjectId);
    const [students, scores, published] = await Promise.all([
      ctx.db
        .query("students")
        .withIndex("by_class", (q) => q.eq("classId", classId))
        .collect(),
      ctx.db
        .query("midtermScores")
        .withIndex("by_class_term_subject", (q) => q.eq("classId", classId).eq("termId", termId).eq("subjectId", subjectId))
        .collect(),
      publication(ctx, classId, termId),
    ]);
    const byStudent = new Map(scores.map((s) => [s.studentId, s]));
    return {
      published: Boolean(published),
      locked: Boolean(published) && !isAdmin(viewer),
      maxScore: scores[0]?.maxScore ?? DEFAULT_MIDTERM_MAX,
      rows: students
        .filter((s) => s.status === "active" || byStudent.has(s._id))
        .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
        .map((s) => {
          const r = byStudent.get(s._id);
          return {
            student: { id: s._id, firstName: s.firstName, lastName: s.lastName, studentNo: s.studentNo, avatarSeed: s.avatarSeed },
            score: r ? withId(r) : null,
          };
        }),
    };
  },
});

async function rankSubject(ctx: MutationCtx, classId: Id<"classes">, termId: Id<"terms">, subjectId: Id<"subjects">) {
  const rows = await ctx.db
    .query("midtermScores")
    .withIndex("by_class_term_subject", (q) => q.eq("classId", classId).eq("termId", termId).eq("subjectId", subjectId))
    .collect();
  const sorted = [...rows].sort((a, b) => b.percent - a.percent);
  let position = 0;
  let previous: number | null = null;
  for (const [i, r] of sorted.entries()) {
    if (r.percent !== previous) position = i + 1;
    previous = r.percent;
    if (r.position !== position) await ctx.db.patch(r._id, { position });
  }
}

export const saveSubjectScores = mutation({
  args: {
    classId: v.id("classes"),
    subjectId: v.id("subjects"),
    termId: v.id("terms"),
    /** Marks the test is out of. */
    maxScore: v.number(),
    rows: v.array(v.object({ studentId: v.id("students"), score: v.optional(v.number()) })),
  },
  handler: async (ctx, { classId, subjectId, termId, maxScore, rows }) => {
    const viewer = await requireStaff(ctx);
    await assertTeachesSubject(ctx, viewer, classId, subjectId);
    if ((await publication(ctx, classId, termId)) && !isAdmin(viewer)) {
      fail("INVALID", "These mid-term results have been published. Ask an administrator to make changes.");
    }
    if (!isValidMidtermMax(maxScore)) fail("INVALID", "The test must be marked out of a whole number between 1 and 100.");
    const existing = await ctx.db
      .query("midtermScores")
      .withIndex("by_class_term_subject", (q) => q.eq("classId", classId).eq("termId", termId).eq("subjectId", subjectId))
      .collect();
    const byStudent = new Map(existing.map((s) => [s.studentId, s]));
    let saved = 0;
    for (const row of rows) {
      const student = await ctx.db.get(row.studentId);
      if (!student || student.classId !== classId) fail("INVALID", "A pupil on the sheet is not in this class.");
      const current = byStudent.get(row.studentId);
      if (row.score === undefined) {
        if (current) await ctx.db.delete(current._id);
        continue;
      }
      const name = `${student.firstName} ${student.lastName}`;
      if (!Number.isFinite(row.score) || row.score < 0 || row.score > maxScore) fail("INVALID", `${name}: score must be between 0 and ${maxScore}.`);
      const percent = round1((row.score / maxScore) * 100);
      const { grade, remark } = gradeFor(percent);
      const doc = { score: row.score, maxScore, percent, grade, remark, enteredBy: viewer._id, updatedAt: nowISO() };
      if (current) await ctx.db.patch(current._id, doc);
      else await ctx.db.insert("midtermScores", { studentId: row.studentId, subjectId, classId, termId, ...doc });
      saved += 1;
    }
    await rankSubject(ctx, classId, termId, subjectId);
    const subject = await ctx.db.get(subjectId);
    await audit(ctx, viewer, { action: "Entered mid-term scores", entity: "Results", entityId: `${classId}:${subjectId}:${termId}`, newValue: `${subject?.name ?? "Subject"} · ${saved} pupils · out of ${maxScore}` });
    return { saved };
  },
});

/* ------------------------------ class summary ----------------------------- */

/** A class's mid-term averages and positions, for the class teacher to review and publish. */
export const classSummary = query({
  args: { classId: v.id("classes"), termId: v.id("terms") },
  handler: async (ctx, { classId, termId }) => {
    const viewer = await requireStaff(ctx);
    await assertTeachesClass(ctx, viewer, classId);
    const [cls, students, scores, published] = await Promise.all([
      ctx.db.get(classId),
      ctx.db
        .query("students")
        .withIndex("by_class", (q) => q.eq("classId", classId))
        .collect(),
      ctx.db
        .query("midtermScores")
        .withIndex("by_class_term", (q) => q.eq("classId", classId).eq("termId", termId))
        .collect(),
      publication(ctx, classId, termId),
    ]);
    if (!cls) fail("NOT_FOUND", "Class not found.");
    const subjects = (await ctx.db.query("subjects").collect()).filter((s) => s.levelIds.includes(cls.levelId));
    const { rows, positions } = rankPupils(scores);
    const byStudent = new Map(rows.map((r) => [r.studentId, r]));
    return {
      canPublish: isAdmin(viewer) || cls.classTeacherId === viewer.teacherId,
      published: Boolean(published),
      publishedAt: published?.publishedAt ?? null,
      subjectsEntered: new Set(scores.map((s) => s.subjectId)).size,
      totalSubjects: subjects.length,
      rows: students
        .filter((s) => s.status === "active" || byStudent.has(s._id))
        .map((s) => ({
          student: { id: s._id, firstName: s.firstName, lastName: s.lastName, studentNo: s.studentNo, avatarSeed: s.avatarSeed },
          subjects: byStudent.get(s._id)?.subjects ?? 0,
          average: byStudent.get(s._id)?.average ?? 0,
          position: positions.get(s._id) ?? 0,
        }))
        .sort((a, b) => (a.position || Infinity) - (b.position || Infinity) || a.student.lastName.localeCompare(b.student.lastName)),
    };
  },
});

/** Publish (or re-publish) a class's mid-term results. Pupils and parents see them immediately. */
export const publishClass = mutation({
  args: { classId: v.id("classes"), termId: v.id("terms") },
  handler: async (ctx, { classId, termId }) => {
    const viewer = await requireStaff(ctx);
    await assertCanPublishClassResults(ctx, viewer, classId);
    const [term, cls] = await Promise.all([ctx.db.get(termId), ctx.db.get(classId)]);
    if (!term || !cls) fail("NOT_FOUND", "Class or term not found.");
    const scores = await ctx.db
      .query("midtermScores")
      .withIndex("by_class_term", (q) => q.eq("classId", classId).eq("termId", termId))
      .collect();
    if (scores.length === 0) fail("INVALID", "No mid-term scores have been entered for this class and term yet.");

    const now = nowISO();
    const existing = await publication(ctx, classId, termId);
    if (existing) await ctx.db.patch(existing._id, { publishedAt: now, publishedBy: viewer._id });
    else await ctx.db.insert("midtermPublications", { classId, termId, publishedAt: now, publishedBy: viewer._id });

    // Families hear about the first publication, not every correction.
    const { rows, positions } = rankPupils(scores);
    if (!existing) {
      for (const r of rows) {
        const student = await ctx.db.get(r.studentId);
        if (!student) continue;
        for (const userId of await accountsForStudent(ctx, r.studentId)) {
          const user = await ctx.db.get(userId);
          const isPupil = Boolean(user?.studentId);
          await notify(ctx, userId, {
            type: "result_published",
            title: isPupil ? `Your ${term.name} mid-term results are ready` : `${student.firstName}'s ${term.name} mid-term results are ready`,
            body: `Mid-term average ${r.average}% · position ${positions.get(r.studentId)} of ${rows.length}.`,
            href: isPupil ? "/portal/pupil/results" : "/portal/parent/results",
          });
        }
      }
    }
    await audit(ctx, viewer, { action: "Published mid-term results", entity: "Results", entityId: `${classId}:${termId}`, newValue: `${cls.name} · ${term.name}` });
    return { published: rows.length };
  },
});

export const unpublishClass = mutation({
  args: { classId: v.id("classes"), termId: v.id("terms") },
  handler: async (ctx, { classId, termId }) => {
    const viewer = await requireAdmin(ctx);
    const existing = await publication(ctx, classId, termId);
    if (existing) await ctx.db.delete(existing._id);
    await audit(ctx, viewer, { action: "Withdrew mid-term results", entity: "Results", entityId: `${classId}:${termId}` });
  },
});

/* ---------------------------------- demo ---------------------------------- */

/**
 * Demo mid-term results for the current term (development only): a test out
 * of 40 in every subject for every active pupil, published. Classes that
 * already have mid-term scores this term are skipped.
 *
 *   npx convex run midterm:seedDemo
 */
export const seedDemo = internalAction({
  args: {},
  handler: async (ctx): Promise<string> => {
    const classIds: Id<"classes">[] = await ctx.runQuery(internal.midterm.demoClasses, {});
    let pupils = 0;
    for (const classId of classIds) pupils += await ctx.runMutation(internal.midterm.seedDemoClass, { classId });
    return `Mid-term results added and published for ${pupils} pupils.`;
  },
});

export const demoClasses = internalQuery({
  args: {},
  handler: async (ctx) => (await ctx.db.query("classes").collect()).map((c) => c._id),
});

export const seedDemoClass = internalMutation({
  args: { classId: v.id("classes") },
  handler: async (ctx, { classId }) => {
    const [cls, term] = await Promise.all([
      ctx.db.get(classId),
      ctx.db
        .query("terms")
        .withIndex("by_active", (q) => q.eq("active", true))
        .first(),
    ]);
    if (!cls || !term) return 0;
    if (await ctx.db.query("midtermScores").withIndex("by_class_term", (q) => q.eq("classId", classId).eq("termId", term._id)).first()) {
      return 0;
    }
    const students = (await ctx.db.query("students").withIndex("by_class", (q) => q.eq("classId", classId)).collect()).filter(
      (s) => s.status === "active",
    );
    if (students.length === 0) return 0;
    const maxScore = 40;
    const subjects = (await ctx.db.query("subjects").collect()).filter((s) => s.levelIds.includes(cls.levelId));
    for (const subject of subjects) {
      const rows = students
        .map((student) => {
          const score = Math.round((14 + Math.random() * 26) * 2) / 2;
          return { student, score, percent: round1((score / maxScore) * 100) };
        })
        .sort((a, b) => b.percent - a.percent);
      let position = 0;
      let previous: number | null = null;
      for (const [i, r] of rows.entries()) {
        if (r.percent !== previous) position = i + 1;
        previous = r.percent;
        await ctx.db.insert("midtermScores", {
          studentId: r.student._id,
          subjectId: subject._id,
          classId,
          termId: term._id,
          score: r.score,
          maxScore,
          percent: r.percent,
          ...gradeFor(r.percent),
          position,
          updatedAt: nowISO(),
        });
      }
    }
    await ctx.db.insert("midtermPublications", { classId, termId: term._id, publishedAt: nowISO() });
    return students.length;
  },
});
