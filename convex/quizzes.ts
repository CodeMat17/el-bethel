import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import {
  assertTeachesSubject,
  fail,
  isAdmin,
  requireRole,
  requireStaff,
  teacherClassIds,
  teachesSubject,
  type Viewer,
} from "./lib/access";
import { accountsForStudent, audit, getByLooseId, notify, nowISO, withId } from "./lib/util";
import { quizQuestion, type QuizQuestionValue } from "./validators";

/**
 * Online quizzes. Answer keys never leave the server: pupils get a stripped
 * view, the timer is enforced against a server-side deadline, answers are
 * auto-saved while the pupil works, and marking happens here.
 */

type Ctx = QueryCtx | MutationCtx;

/** Seconds of slack after the deadline for a save or submit already in flight. */
const GRACE_MS = 30_000;

/* --------------------------------- helpers -------------------------------- */

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Deterministic shuffle, so the same pupil sees the same order on every load. */
function seededShuffle<T>(items: T[], seed: string): T[] {
  const out = [...items];
  let state = hash(seed) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function parseMatching(given: string | undefined): string[] {
  if (!given) return [];
  try {
    const parsed: unknown = JSON.parse(given);
    return Array.isArray(parsed) ? parsed.map((x) => (typeof x === "string" ? x : "")) : [];
  } catch {
    return [];
  }
}

/** Marks for one answer, or null when the question needs the teacher. */
function markQuestion(q: QuizQuestionValue, given: string | undefined): number | null {
  const answer = given ?? "";
  switch (q.type) {
    case "multiple_choice":
    case "picture":
    case "true_false":
      return answer && normalize(answer) === normalize(q.answer) ? q.points : 0;
    case "short_answer": {
      const accepted = q.answer.split("|").map(normalize).filter(Boolean);
      if (accepted.length === 0) return null;
      return accepted.includes(normalize(answer)) ? q.points : 0;
    }
    case "matching": {
      const pairs = q.pairs ?? [];
      if (pairs.length === 0) return 0;
      const chosen = parseMatching(answer);
      const right = pairs.filter((p, i) => chosen[i] !== undefined && normalize(chosen[i]) === normalize(p.right)).length;
      return Math.round(((q.points * right) / pairs.length) * 10) / 10;
    }
  }
}

const maxScoreOf = (quiz: Doc<"quizzes">) => quiz.questions.reduce((n, q) => n + q.points, 0);

/** The question as a pupil sees it — no answer key, matching pairs split and shuffled. */
function pupilQuestion(q: QuizQuestionValue) {
  return {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    options: q.type === "true_false" ? ["True", "False"] : q.options,
    points: q.points,
    imageUrl: q.imageUrl,
    left: q.type === "matching" ? (q.pairs ?? []).map((p) => p.left) : [],
    right: q.type === "matching" ? seededShuffle((q.pairs ?? []).map((p) => p.right), q.id) : [],
  };
}
export type PupilQuizQuestion = ReturnType<typeof pupilQuestion>;

/** Quiz details safe for a pupil (no questions). */
function pupilSummary(quiz: Doc<"quizzes">) {
  return {
    id: quiz._id,
    title: quiz.title,
    description: quiz.description,
    classId: quiz.classId,
    subjectId: quiz.subjectId,
    teacherId: quiz.teacherId,
    durationMinutes: quiz.durationMinutes,
    attemptsAllowed: quiz.attemptsAllowed,
    opensAt: quiz.opensAt,
    closesAt: quiz.closesAt,
    status: quiz.status,
    showResultsImmediately: quiz.showResultsImmediately,
    questionCount: quiz.questions.length,
    maxScore: maxScoreOf(quiz),
  };
}

const isSubmitted = (a: Doc<"quizAttempts">) => (a.status ?? "submitted") === "submitted";

/** Scores are shown once marking is finished and the teacher allows it (immediately, or after closing). */
function resultVisible(quiz: Doc<"quizzes">, attempt: Doc<"quizAttempts">, now = Date.now()): boolean {
  if (!isSubmitted(attempt) || attempt.needsMarking) return false;
  return quiz.showResultsImmediately || quiz.status === "closed" || Date.parse(quiz.closesAt) < now;
}

function pupilAttempt(quiz: Doc<"quizzes">, a: Doc<"quizAttempts">) {
  const visible = resultVisible(quiz, a);
  return {
    id: a._id,
    attemptNo: a.attemptNo,
    status: a.status ?? "submitted",
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
    needsMarking: Boolean(a.needsMarking),
    resultVisible: visible,
    score: visible ? a.score : null,
    maxScore: a.maxScore,
    feedback: visible ? a.feedback : undefined,
  };
}

async function attemptsFor(ctx: Ctx, quizId: Id<"quizzes">, studentId: Id<"students">) {
  const rows = await ctx.db
    .query("quizAttempts")
    .withIndex("by_quiz_student", (q) => q.eq("quizId", quizId).eq("studentId", studentId))
    .collect();
  return rows.sort((a, b) => a.attemptNo - b.attemptNo);
}

async function pupilContext(ctx: Ctx, viewer: Viewer) {
  if (!viewer.studentId) return null;
  const student = await ctx.db.get(viewer.studentId);
  return student && student.status === "active" ? student : null;
}

/** Mark and close an attempt with whatever answers it holds. */
async function finalize(ctx: MutationCtx, attempt: Doc<"quizAttempts">, quiz: Doc<"quizzes">) {
  const marks: Record<string, number> = {};
  let needsMarking = false;
  for (const q of quiz.questions) {
    const m = markQuestion(q, attempt.answers[q.id]);
    if (m === null) needsMarking = true;
    else marks[q.id] = m;
  }
  const score = Object.values(marks).reduce((n, m) => n + m, 0);
  const now = Date.now();
  const deadline = attempt.deadline ? Date.parse(attempt.deadline) : now;
  const result = { score, maxScore: maxScoreOf(quiz), marks, needsMarking };
  await ctx.db.patch(attempt._id, {
    ...result,
    status: "submitted",
    submittedAt: new Date(Math.min(now, deadline + GRACE_MS)).toISOString(),
  });
  return result;
}

/** Keep only answers to real questions, with sensible length limits. */
function cleanAnswers(quiz: Doc<"quizzes">, answers: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const q of quiz.questions) {
    const given = answers[q.id];
    if (typeof given !== "string" || !given) continue;
    out[q.id] = given.slice(0, q.type === "matching" ? 4000 : 500);
  }
  return out;
}

async function ownAttempt(ctx: MutationCtx, viewer: Viewer, attemptId: Id<"quizAttempts">) {
  const attempt = await ctx.db.get(attemptId);
  if (!attempt || attempt.studentId !== viewer.studentId) fail("NOT_FOUND", "We couldn't find that quiz attempt.");
  const quiz = await ctx.db.get(attempt.quizId);
  if (!quiz) fail("NOT_FOUND", "We couldn't find that quiz.");
  return { attempt, quiz };
}

/* ---------------------------------- pupil --------------------------------- */

/** Published quizzes for the pupil's class, with their own attempts. */
export const forPupil = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, "pupil");
    const student = await pupilContext(ctx, viewer);
    if (!student) return [];
    const quizzes = (await ctx.db.query("quizzes").withIndex("by_class", (q) => q.eq("classId", student.classId)).collect()).filter(
      (q) => q.status !== "draft",
    );
    const out = await Promise.all(
      quizzes.map(async (quiz) => {
        const attempts = await attemptsFor(ctx, quiz._id, student._id);
        return { quiz: pupilSummary(quiz), attempts: attempts.map((a) => pupilAttempt(quiz, a)) };
      }),
    );
    return out.sort((a, b) => b.quiz.opensAt.localeCompare(a.quiz.opensAt));
  },
});

/**
 * One quiz for the pupil. Questions are only included while an attempt is in
 * progress, so nobody reads the questions before the clock starts.
 */
export const takeForPupil = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const viewer = await requireRole(ctx, "pupil");
    const student = await pupilContext(ctx, viewer);
    const quiz = await getByLooseId(ctx, "quizzes", id);
    if (!student || !quiz || quiz.classId !== student.classId || quiz.status === "draft") return null;
    const attempts = await attemptsFor(ctx, quiz._id, student._id);
    const now = Date.now();
    const live = attempts.find((a) => a.status === "in_progress" && a.deadline && Date.parse(a.deadline) + GRACE_MS > now);
    const byId = new Map(quiz.questions.map((q) => [q.id, q]));
    const submitted = attempts.filter(isSubmitted);
    const finished = submitted.length >= quiz.attemptsAllowed || quiz.status === "closed" || Date.parse(quiz.closesAt) < now;

    // Once no more attempts are possible, a pupil may review the answer key for their latest marked attempt.
    const last = submitted[submitted.length - 1];
    const review =
      finished && last && resultVisible(quiz, last, now)
        ? quiz.questions.map((q) => ({
            ...pupilQuestion(q),
            given: last.answers[q.id] ?? "",
            awarded: last.marks?.[q.id] ?? markQuestion(q, last.answers[q.id]),
            correct: q.type === "matching" ? JSON.stringify((q.pairs ?? []).map((p) => p.right)) : q.type === "short_answer" ? q.answer.split("|")[0] ?? "" : q.answer,
          }))
        : null;

    return {
      quiz: pupilSummary(quiz),
      attempts: attempts.filter(isSubmitted).map((a) => pupilAttempt(quiz, a)),
      serverNow: new Date(now).toISOString(),
      live: live
        ? {
            id: live._id,
            deadline: live.deadline!,
            answers: live.answers,
            questions: (live.order ?? quiz.questions.map((q) => q.id))
              .map((qid) => byId.get(qid))
              .filter((q): q is QuizQuestionValue => Boolean(q))
              .map(pupilQuestion),
          }
        : null,
      review,
    };
  },
});

export const start = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, { quizId }) => {
    const viewer = await requireRole(ctx, "pupil");
    const student = await pupilContext(ctx, viewer);
    const quiz = await ctx.db.get(quizId);
    if (!student || !quiz || quiz.classId !== student.classId || quiz.status === "draft") fail("NOT_FOUND", "We couldn't find that quiz.");
    const now = Date.now();
    if (quiz.status === "closed" || Date.parse(quiz.closesAt) < now) fail("INVALID", "This quiz has closed.");
    if (Date.parse(quiz.opensAt) > now) fail("INVALID", "This quiz hasn't opened yet.");

    const attempts = await attemptsFor(ctx, quiz._id, student._id);
    for (const a of attempts.filter((x) => x.status === "in_progress")) {
      if (a.deadline && Date.parse(a.deadline) + GRACE_MS > now) return a._id; // resume
      await finalize(ctx, a, quiz);
    }
    if (attempts.length >= quiz.attemptsAllowed) fail("INVALID", "You have already used all your attempts at this quiz.");

    const ids = quiz.questions.map((q) => q.id);
    const order = quiz.randomize ? seededShuffle(ids, `${student._id}:${attempts.length}:${now}`) : ids;
    const deadline = new Date(Math.min(now + quiz.durationMinutes * 60_000, Date.parse(quiz.closesAt))).toISOString();
    const attemptId = await ctx.db.insert("quizAttempts", {
      quizId,
      studentId: student._id,
      answers: {},
      score: 0,
      maxScore: maxScoreOf(quiz),
      startedAt: new Date(now).toISOString(),
      attemptNo: attempts.length + 1,
      status: "in_progress",
      deadline,
      order,
    });
    // If the pupil walks away, the attempt is still marked when time runs out.
    await ctx.scheduler.runAt(Date.parse(deadline) + GRACE_MS, internal.quizzes.expire, { attemptId });
    return attemptId;
  },
});

/** Auto-save. Rejected once the deadline (plus a short grace) has passed. */
export const saveProgress = mutation({
  args: { attemptId: v.id("quizAttempts"), answers: v.record(v.string(), v.string()) },
  handler: async (ctx, { attemptId, answers }) => {
    const viewer = await requireRole(ctx, "pupil");
    const { attempt, quiz } = await ownAttempt(ctx, viewer, attemptId);
    if (attempt.status !== "in_progress") fail("INVALID", "This attempt has already been handed in.");
    if (attempt.deadline && Date.parse(attempt.deadline) + GRACE_MS < Date.now()) fail("INVALID", "Time is up for this quiz.");
    await ctx.db.patch(attemptId, { answers: cleanAnswers(quiz, answers) });
    return nowISO();
  },
});

export const submit = mutation({
  args: { attemptId: v.id("quizAttempts"), answers: v.record(v.string(), v.string()) },
  handler: async (ctx, { attemptId, answers }) => {
    const viewer = await requireRole(ctx, "pupil");
    const { attempt, quiz } = await ownAttempt(ctx, viewer, attemptId);
    if (attempt.status !== "in_progress") fail("INVALID", "This attempt has already been handed in.");
    const late = attempt.deadline && Date.parse(attempt.deadline) + GRACE_MS < Date.now();
    // After the deadline only the answers saved in time count.
    const current = late ? attempt : { ...attempt, answers: cleanAnswers(quiz, answers) };
    if (!late) await ctx.db.patch(attemptId, { answers: current.answers });
    const result = await finalize(ctx, current, quiz);
    const fresh = (await ctx.db.get(attemptId))!;
    const visible = resultVisible(quiz, fresh);
    return {
      score: visible ? result.score : null,
      maxScore: result.maxScore,
      needsMarking: result.needsMarking,
      late: Boolean(late),
    };
  },
});

export const expire = internalMutation({
  args: { attemptId: v.id("quizAttempts") },
  handler: async (ctx, { attemptId }) => {
    const attempt = await ctx.db.get(attemptId);
    if (!attempt || attempt.status !== "in_progress") return;
    const quiz = await ctx.db.get(attempt.quizId);
    if (quiz) await finalize(ctx, attempt, quiz);
  },
});

/* --------------------------------- teacher -------------------------------- */

async function assertCanManage(ctx: Ctx, viewer: Viewer, quiz: Doc<"quizzes">) {
  if (isAdmin(viewer) || (viewer.teacherId && quiz.teacherId === viewer.teacherId)) return;
  await assertTeachesSubject(ctx, viewer, quiz.classId, quiz.subjectId);
}

function quizStats(quiz: Doc<"quizzes">, attempts: Doc<"quizAttempts">[]) {
  const submitted = attempts.filter(isSubmitted);
  const marked = submitted.filter((a) => !a.needsMarking);
  const avg = marked.length
    ? Math.round((marked.reduce((n, a) => n + (a.maxScore ? a.score / a.maxScore : 0), 0) / marked.length) * 100)
    : null;
  return {
    attempts: submitted.length,
    pupils: new Set(submitted.map((a) => a.studentId)).size,
    inProgress: attempts.length - submitted.length,
    needsMarking: submitted.filter((a) => a.needsMarking).length,
    averagePercent: avg,
  };
}

export const forTeacher = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireStaff(ctx);
    if (!viewer.teacherId) return [];
    // Quizzes for classes this teacher teaches — never the whole school.
    const classIds = await teacherClassIds(ctx, viewer.teacherId);
    const out = [];
    for (const classId of classIds) {
      const quizzes = await ctx.db.query("quizzes").withIndex("by_class", (q) => q.eq("classId", classId)).collect();
      if (quizzes.length === 0) continue;
      const roster = (await ctx.db.query("students").withIndex("by_class", (q) => q.eq("classId", classId)).collect()).filter(
        (x) => x.status === "active",
      ).length;
      for (const quiz of quizzes) {
        if (!(await teachesSubject(ctx, viewer, quiz.classId, quiz.subjectId)) && quiz.teacherId !== viewer.teacherId) continue;
        const attempts = await ctx.db.query("quizAttempts").withIndex("by_quiz", (q) => q.eq("quizId", quiz._id)).collect();
        out.push({ quiz: withId(quiz), roster, maxScore: maxScoreOf(quiz), ...quizStats(quiz, attempts) });
      }
    }
    return out.sort((a, b) => b.quiz.opensAt.localeCompare(a.quiz.opensAt));
  },
});

/** Full quiz with answer key, every attempt and per-question statistics. */
export const getForTeacher = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const viewer = await requireStaff(ctx);
    const quiz = await getByLooseId(ctx, "quizzes", id);
    if (!quiz) return null;
    await assertCanManage(ctx, viewer, quiz);
    const attempts = await ctx.db.query("quizAttempts").withIndex("by_quiz", (q) => q.eq("quizId", quiz._id)).collect();
    const students = new Map<string, Doc<"students"> | null>();
    for (const a of attempts) if (!students.has(a.studentId)) students.set(a.studentId, await ctx.db.get(a.studentId));
    const roster = (await ctx.db.query("students").withIndex("by_class", (q) => q.eq("classId", quiz.classId)).collect()).filter(
      (s) => s.status === "active",
    );
    const submitted = attempts.filter(isSubmitted);
    const questionStats = quiz.questions.map((q) => {
      const marked = submitted.filter((a) => a.marks?.[q.id] !== undefined);
      const total = marked.reduce((n, a) => n + (a.marks?.[q.id] ?? 0), 0);
      return {
        questionId: q.id,
        answered: marked.length,
        percent: marked.length && q.points ? Math.round((total / (marked.length * q.points)) * 100) : null,
      };
    });
    return {
      quiz: withId(quiz),
      maxScore: maxScoreOf(quiz),
      stats: quizStats(quiz, attempts),
      questionStats,
      rosterSize: roster.length,
      notAttempted: roster
        .filter((s) => !attempts.some((a) => a.studentId === s._id))
        .map((s) => ({ id: s._id, name: `${s.firstName} ${s.lastName}` })),
      attempts: attempts
        .map((a) => {
          const s = students.get(a.studentId);
          return { ...withId(a), status: a.status ?? "submitted", studentName: s ? `${s.firstName} ${s.lastName}` : "Pupil" };
        })
        .sort((a, b) => a.studentName.localeCompare(b.studentName) || a.attemptNo - b.attemptNo),
    };
  },
});

const quizArgs = {
  classId: v.id("classes"),
  subjectId: v.id("subjects"),
  title: v.string(),
  description: v.string(),
  durationMinutes: v.number(),
  attemptsAllowed: v.number(),
  randomize: v.boolean(),
  showResultsImmediately: v.boolean(),
  opensAt: v.string(),
  closesAt: v.string(),
  questions: v.array(quizQuestion),
};

function validateQuiz(a: {
  title: string;
  durationMinutes: number;
  attemptsAllowed: number;
  opensAt: string;
  closesAt: string;
  questions: QuizQuestionValue[];
}) {
  if (a.title.trim().length < 3) fail("INVALID", "Give the quiz a title.");
  if (!Number.isInteger(a.durationMinutes) || a.durationMinutes < 1 || a.durationMinutes > 180) fail("INVALID", "The time limit must be 1–180 minutes.");
  if (!Number.isInteger(a.attemptsAllowed) || a.attemptsAllowed < 1 || a.attemptsAllowed > 5) fail("INVALID", "Allow between 1 and 5 attempts.");
  if (Number.isNaN(Date.parse(a.opensAt)) || Number.isNaN(Date.parse(a.closesAt))) fail("INVALID", "Choose when the quiz opens and closes.");
  if (Date.parse(a.closesAt) <= Date.parse(a.opensAt)) fail("INVALID", "The quiz must close after it opens.");
  if (a.questions.length === 0 || a.questions.length > 60) fail("INVALID", "A quiz needs between 1 and 60 questions.");
  const ids = new Set<string>();
  a.questions.forEach((q, i) => {
    const n = i + 1;
    if (!q.id || ids.has(q.id)) fail("INVALID", `Question ${n} has a duplicate id.`);
    ids.add(q.id);
    if (!q.prompt.trim()) fail("INVALID", `Question ${n} needs a question.`);
    if (!Number.isInteger(q.points) || q.points < 1 || q.points > 20) fail("INVALID", `Question ${n} must be worth 1–20 marks.`);
    if (q.type === "multiple_choice" || q.type === "picture") {
      if (q.options.length < 2 || q.options.length > 6) fail("INVALID", `Question ${n} needs 2–6 options.`);
      if (q.options.some((o) => !o.trim())) fail("INVALID", `Question ${n} has an empty option.`);
      if (new Set(q.options.map(normalize)).size !== q.options.length) fail("INVALID", `Question ${n} has two identical options.`);
      if (!q.options.includes(q.answer)) fail("INVALID", `Choose the correct answer for question ${n}.`);
    }
    if (q.type === "picture" && !/^https:\/\//.test(q.imageUrl ?? "")) fail("INVALID", `Question ${n} needs a picture.`);
    if (q.type === "true_false" && q.answer !== "True" && q.answer !== "False") fail("INVALID", `Choose True or False for question ${n}.`);
    if (q.type === "matching") {
      const pairs = q.pairs ?? [];
      if (pairs.length < 2 || pairs.length > 8) fail("INVALID", `Question ${n} needs 2–8 pairs.`);
      if (pairs.some((p) => !p.left.trim() || !p.right.trim())) fail("INVALID", `Question ${n} has an empty pair.`);
      if (new Set(pairs.map((p) => normalize(p.right))).size !== pairs.length) fail("INVALID", `Each right-hand item in question ${n} must be different.`);
    }
  });
}

function tidyQuestions(questions: QuizQuestionValue[]): QuizQuestionValue[] {
  return questions.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt.trim().slice(0, 1000),
    options: q.type === "true_false" ? ["True", "False"] : q.type === "multiple_choice" || q.type === "picture" ? q.options.map((o) => o.trim().slice(0, 200)) : [],
    answer: q.type === "matching" ? "" : q.answer.trim().slice(0, 500),
    points: q.points,
    imageUrl: q.type === "picture" ? q.imageUrl : undefined,
    pairs: q.type === "matching" ? (q.pairs ?? []).map((p) => ({ left: p.left.trim().slice(0, 200), right: p.right.trim().slice(0, 200) })) : undefined,
  }));
}

async function announce(ctx: MutationCtx, quiz: Doc<"quizzes">) {
  const students = await ctx.db.query("students").withIndex("by_class", (q) => q.eq("classId", quiz.classId)).collect();
  for (const s of students.filter((x) => x.status === "active")) {
    for (const userId of await accountsForStudent(ctx, s._id)) {
      const user = await ctx.db.get(userId);
      await notify(ctx, userId, {
        type: "quiz_published",
        title: `New quiz: ${quiz.title}`,
        body: `Open until ${quiz.closesAt.slice(0, 10)}. ${quiz.questions.length} questions, ${quiz.durationMinutes} minutes.`,
        href: user?.studentId ? `/portal/pupil/quizzes/${quiz._id}` : undefined,
      });
    }
  }
}

export const save = mutation({
  args: { id: v.optional(v.id("quizzes")), publish: v.boolean(), ...quizArgs },
  handler: async (ctx, { id, publish, ...args }) => {
    const viewer = await requireStaff(ctx);
    await assertTeachesSubject(ctx, viewer, args.classId, args.subjectId);
    validateQuiz(args);
    const questions = tidyQuestions(args.questions);
    const fields = {
      title: args.title.trim().slice(0, 140),
      description: args.description.trim().slice(0, 1000),
      durationMinutes: args.durationMinutes,
      attemptsAllowed: args.attemptsAllowed,
      randomize: args.randomize,
      showResultsImmediately: args.showResultsImmediately,
      opensAt: new Date(args.opensAt).toISOString(),
      closesAt: new Date(args.closesAt).toISOString(),
    };

    if (id) {
      const quiz = await ctx.db.get(id);
      if (!quiz) fail("NOT_FOUND", "We couldn't find that quiz.");
      await assertCanManage(ctx, viewer, quiz);
      const attempted = Boolean(await ctx.db.query("quizAttempts").withIndex("by_quiz", (q) => q.eq("quizId", id)).first());
      const status = publish && quiz.status === "draft" ? "published" : quiz.status;
      await ctx.db.patch(id, {
        ...fields,
        // Once pupils have sat the quiz the questions and class are fixed, so scores stay comparable.
        ...(attempted ? {} : { questions, classId: args.classId, subjectId: args.subjectId }),
        status,
      });
      if (status === "published" && quiz.status === "draft") await announce(ctx, (await ctx.db.get(id))!);
      await audit(ctx, viewer, { action: "Updated quiz", entity: "Quiz", entityId: id, newValue: fields.title });
      return { id, locked: attempted };
    }

    let teacherId = viewer.teacherId;
    if (!teacherId) {
      const row = await ctx.db
        .query("teachingAssignments")
        .withIndex("by_class_subject", (q) => q.eq("classId", args.classId).eq("subjectId", args.subjectId))
        .first();
      teacherId = row?.teacherId;
    }
    if (!teacherId) fail("INVALID", "No teacher is assigned to this subject in this class.");
    const newId = await ctx.db.insert("quizzes", {
      ...fields,
      classId: args.classId,
      subjectId: args.subjectId,
      teacherId,
      questions,
      status: publish ? "published" : "draft",
      createdAt: nowISO(),
    });
    if (publish) await announce(ctx, (await ctx.db.get(newId))!);
    await audit(ctx, viewer, { action: publish ? "Published quiz" : "Created quiz", entity: "Quiz", entityId: newId, newValue: fields.title });
    return { id: newId, locked: false };
  },
});

export const setStatus = mutation({
  args: { id: v.id("quizzes"), status: v.union(v.literal("draft"), v.literal("published"), v.literal("closed")) },
  handler: async (ctx, { id, status }) => {
    const viewer = await requireStaff(ctx);
    const quiz = await ctx.db.get(id);
    if (!quiz) fail("NOT_FOUND", "We couldn't find that quiz.");
    await assertCanManage(ctx, viewer, quiz);
    const attempts = await ctx.db.query("quizAttempts").withIndex("by_quiz", (q) => q.eq("quizId", id)).collect();
    if (status === "draft" && attempts.length > 0) fail("CONFLICT", "Pupils have already attempted this quiz, so it can't go back to draft. Close it instead.");
    if (status === "closed") {
      // Hand in anything still open, with the answers saved so far.
      for (const a of attempts.filter((x) => x.status === "in_progress")) await finalize(ctx, a, quiz);
    }
    await ctx.db.patch(id, { status });
    if (status === "published" && quiz.status === "draft") await announce(ctx, { ...quiz, status });
    await audit(ctx, viewer, { action: "Changed quiz status", entity: "Quiz", entityId: id, previousValue: quiz.status, newValue: status });
  },
});

export const remove = mutation({
  args: { id: v.id("quizzes") },
  handler: async (ctx, { id }) => {
    const viewer = await requireStaff(ctx);
    const quiz = await ctx.db.get(id);
    if (!quiz) return;
    await assertCanManage(ctx, viewer, quiz);
    if (await ctx.db.query("quizAttempts").withIndex("by_quiz", (q) => q.eq("quizId", id)).first()) {
      fail("CONFLICT", "Pupils have attempted this quiz. Close it instead of deleting it, so their scores are kept.");
    }
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Deleted quiz", entity: "Quiz", entityId: id, previousValue: quiz.title });
  },
});

/** Teacher marks (or re-marks) an attempt: typed answers, and overrides of auto-marks. */
export const mark = mutation({
  args: { attemptId: v.id("quizAttempts"), marks: v.record(v.string(), v.number()), feedback: v.optional(v.string()) },
  handler: async (ctx, { attemptId, marks, feedback }) => {
    const viewer = await requireStaff(ctx);
    const attempt = await ctx.db.get(attemptId);
    if (!attempt) fail("NOT_FOUND", "We couldn't find that attempt.");
    const quiz = await ctx.db.get(attempt.quizId);
    if (!quiz) fail("NOT_FOUND", "We couldn't find that quiz.");
    await assertCanManage(ctx, viewer, quiz);
    if (!isSubmitted(attempt)) fail("INVALID", "The pupil is still working on this attempt.");
    const next: Record<string, number> = { ...(attempt.marks ?? {}) };
    for (const q of quiz.questions) {
      if (marks[q.id] === undefined) continue;
      const m = marks[q.id];
      if (!Number.isFinite(m) || m < 0 || m > q.points) fail("INVALID", `Marks for "${q.prompt.slice(0, 40)}" must be 0–${q.points}.`);
      next[q.id] = Math.round(m * 10) / 10;
    }
    const needsMarking = quiz.questions.some((q) => next[q.id] === undefined);
    const score = Object.values(next).reduce((n, m) => n + m, 0);
    await ctx.db.patch(attemptId, {
      marks: next,
      score,
      needsMarking,
      feedback: feedback?.trim().slice(0, 1000) || attempt.feedback,
      markedAt: nowISO(),
      markedBy: viewer._id,
    });
    if (!needsMarking && attempt.needsMarking) {
      for (const userId of await accountsForStudent(ctx, attempt.studentId)) {
        const user = await ctx.db.get(userId);
        await notify(ctx, userId, {
          type: "quiz_marked",
          title: `Quiz marked: ${quiz.title}`,
          body: resultVisible(quiz, { ...attempt, needsMarking: false })
            ? `Score: ${score} out of ${attempt.maxScore}.`
            : "Results will be shown when the quiz closes.",
          href: user?.studentId ? `/portal/pupil/quizzes/${quiz._id}` : undefined,
        });
      }
    }
    await audit(ctx, viewer, { action: "Marked quiz attempt", entity: "Quiz", entityId: quiz._id, newValue: `${score}/${attempt.maxScore}` });
    return { score, needsMarking };
  },
});

/** Quizzes as shown inside the digital classroom (no answer keys). */
export async function classroomQuizzes(ctx: Ctx, classId: Id<"classes">) {
  const quizzes = await ctx.db.query("quizzes").withIndex("by_class", (q) => q.eq("classId", classId)).collect();
  return quizzes.filter((q) => q.status === "published").map(pupilSummary);
}
