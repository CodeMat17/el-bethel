import { v } from "convex/values";

import { gradeFor } from "../lib/school/config";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import {
  assertStudentAccess,
  assertTeachesSubject,
  fail,
  isAdmin,
  requireRole,
  requireStaff,
  requireViewer,
  teacherClassIds,
  type Viewer,
} from "./lib/access";
import { accountsForStudent, audit, getByLooseId, notify, nowISO, withId } from "./lib/util";
import { question, type QuestionAnswerValue, type QuestionValue } from "./validators";

type Ctx = QueryCtx | MutationCtx;

/* --------------------------------- helpers -------------------------------- */

export type Progress = "not_started" | "missed" | "submitted" | "graded";

function progressOf(assignment: Doc<"assignments">, submission: Doc<"submissions"> | null, now: number): Progress {
  if (submission?.status === "graded") return "graded";
  if (submission) return "submitted";
  return Date.parse(assignment.dueDate) < now ? "missed" : "not_started";
}

/** Pupils see an assignment once it is published and its start date has arrived. */
function visibleToPupils(a: Doc<"assignments">, now: number) {
  return (a.status === "published" || a.status === "closed") && Date.parse(a.startDate) <= now;
}

/**
 * What a pupil or parent may see. The answer key stays hidden until the work is
 * marked and the due date has passed (so it can't be shared with classmates who
 * haven't submitted). Marks stay hidden until the whole submission is marked.
 */
function forFamily(assignment: Doc<"assignments">, submission: Doc<"submissions"> | null, now: number) {
  const revealKey = submission?.status === "graded" && Date.parse(assignment.dueDate) < now;
  const a = withId(assignment);
  const questions = a.questions.map((q) => ({ ...q, correct: revealKey ? q.correct : [] }));
  let sub = submission ? withId(submission) : null;
  if (sub && sub.status !== "graded") {
    sub = {
      ...sub,
      score: undefined,
      grade: undefined,
      answers: sub.answers.map((ans) => ({ ...ans, awarded: undefined })),
    };
  }
  return { assignment: { ...a, questions }, submission: sub, progress: progressOf(assignment, submission, now) };
}

async function submissionFor(ctx: Ctx, assignmentId: Id<"assignments">, studentId: Id<"students">) {
  return await ctx.db
    .query("submissions")
    .withIndex("by_assignment_student", (q) => q.eq("assignmentId", assignmentId).eq("studentId", studentId))
    .unique();
}

async function activeTermId(ctx: Ctx): Promise<Id<"terms">> {
  const term = await ctx.db
    .query("terms")
    .withIndex("by_active", (q) => q.eq("active", true))
    .first();
  if (!term) fail("INVALID", "No active term is set. Ask an administrator to set the current term.");
  return term._id;
}

async function rosterSize(ctx: Ctx, classId: Id<"classes">) {
  const students = await ctx.db
    .query("students")
    .withIndex("by_class", (q) => q.eq("classId", classId))
    .collect();
  return students.filter((s) => s.status === "active").length;
}

async function statsFor(ctx: Ctx, assignment: Doc<"assignments">) {
  const [subs, students] = await Promise.all([
    ctx.db
      .query("submissions")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id))
      .collect(),
    rosterSize(ctx, assignment.classId),
  ]);
  const graded = subs.filter((s) => s.status === "graded").length;
  return {
    students,
    submitted: subs.length,
    notSubmitted: Math.max(0, students - subs.length),
    graded,
    pendingGrading: subs.length - graded,
  };
}

function validateQuestions(questions: QuestionValue[]) {
  if (questions.length === 0) fail("INVALID", "Add at least one question.");
  if (questions.length > 100) fail("INVALID", "An assignment can have at most 100 questions.");
  const ids = new Set<string>();
  questions.forEach((q, i) => {
    const n = i + 1;
    if (ids.has(q.id)) fail("INVALID", `Question ${n} has a duplicate id.`);
    ids.add(q.id);
    if (!q.prompt.trim()) fail("INVALID", `Question ${n} needs a question.`);
    if (!Number.isInteger(q.points) || q.points < 1 || q.points > 100) {
      fail("INVALID", `Question ${n} must be worth between 1 and 100 marks.`);
    }
    if (q.type === "text") {
      if (q.options.length || q.correct.length) fail("INVALID", `Question ${n} is a written answer and takes no options.`);
      return;
    }
    const options = q.options.map((o) => o.trim());
    if (options.length < 2) fail("INVALID", `Question ${n} needs at least two options.`);
    if (options.length > 10) fail("INVALID", `Question ${n} can have at most ten options.`);
    if (options.some((o) => !o)) fail("INVALID", `Question ${n} has an empty option.`);
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) {
      fail("INVALID", `Question ${n} has two identical options.`);
    }
    if (q.correct.some((c) => !Number.isInteger(c) || c < 0 || c >= options.length)) {
      fail("INVALID", `Question ${n} marks an option as correct that doesn't exist.`);
    }
    if (q.type === "single" && q.correct.length > 1) fail("INVALID", `Question ${n} can only have one correct answer.`);
  });
}

const sameSet = (a: number[], b: number[]) =>
  a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");

/** Auto-mark a choice question that has an answer key. Returns null when it needs a teacher. */
function autoMark(q: QuestionValue, selected: number[] | undefined): number | null {
  if (q.type === "text" || q.correct.length === 0) return null;
  return sameSet(selected ?? [], q.correct) ? q.points : 0;
}

async function notifyTeacher(ctx: MutationCtx, teacherId: Id<"teachers">, n: Parameters<typeof notify>[2]) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
    .first();
  if (user?.active) await notify(ctx, user._id, n);
}

async function notifyClass(ctx: MutationCtx, classId: Id<"classes">, n: { type: string; title: string; body: string }) {
  const students = await ctx.db
    .query("students")
    .withIndex("by_class", (q) => q.eq("classId", classId))
    .collect();
  for (const s of students.filter((x) => x.status === "active")) {
    const pupil = await ctx.db
      .query("users")
      .withIndex("by_student", (q) => q.eq("studentId", s._id))
      .first();
    if (pupil?.active) await notify(ctx, pupil._id, { ...n, href: "/portal/pupil/assignments" });
    const links = await ctx.db
      .query("guardianships")
      .withIndex("by_student", (q) => q.eq("studentId", s._id))
      .collect();
    for (const link of links) {
      const parent = await ctx.db
        .query("users")
        .withIndex("by_parent", (q) => q.eq("parentId", link.parentId))
        .first();
      if (parent?.active) await notify(ctx, parent._id, { ...n, href: "/portal/parent/assignments" });
    }
  }
}

export async function assertCanManageAssignment(ctx: Ctx, viewer: Viewer, assignment: Doc<"assignments">) {
  if (isAdmin(viewer)) return;
  if (viewer.teacherId && assignment.teacherId === viewer.teacherId) return;
  await assertTeachesSubject(ctx, viewer, assignment.classId, assignment.subjectId);
}

/* ----------------------------- pupil & parent ----------------------------- */

/** Every assignment for a pupil's class, with their own submission. */
export const forStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, { studentId }) => {
    const viewer = await requireViewer(ctx);
    await assertStudentAccess(ctx, viewer, studentId);
    const student = await ctx.db.get(studentId);
    if (!student) fail("NOT_FOUND", "Pupil not found.");
    const now = Date.now();
    const assignments = (
      await ctx.db
        .query("assignments")
        .withIndex("by_class", (q) => q.eq("classId", student.classId))
        .collect()
    )
      .filter((a) => visibleToPupils(a, now))
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
    return await Promise.all(
      assignments.map(async (a) => forFamily(a, await submissionFor(ctx, a._id, studentId), now)),
    );
  },
});

/** One assignment as a pupil (or their parent) sees it. */
export const getForStudent = query({
  args: { assignmentId: v.string(), studentId: v.id("students") },
  handler: async (ctx, { assignmentId, studentId }) => {
    const viewer = await requireViewer(ctx);
    await assertStudentAccess(ctx, viewer, studentId);
    const assignment = await getByLooseId(ctx, "assignments", assignmentId);
    const student = await ctx.db.get(studentId);
    const now = Date.now();
    if (!assignment || !student || assignment.classId !== student.classId || !visibleToPupils(assignment, now)) {
      return null;
    }
    const submission = await submissionFor(ctx, assignment._id, studentId);
    return { ...forFamily(assignment, submission, now), now: new Date(now).toISOString() };
  },
});

/** Submit answers. One submission per pupil — there is no resubmission. */
export const submit = mutation({
  args: {
    assignmentId: v.id("assignments"),
    answers: v.array(
      v.object({ questionId: v.string(), text: v.optional(v.string()), selected: v.optional(v.array(v.number())) }),
    ),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, "pupil");
    if (!viewer.studentId) fail("FORBIDDEN", "This account is not linked to a pupil.");
    const student = await ctx.db.get(viewer.studentId);
    const assignment = await ctx.db.get(args.assignmentId);
    const now = Date.now();
    if (!student || !assignment || assignment.classId !== student.classId || !visibleToPupils(assignment, now)) {
      fail("NOT_FOUND", "This assignment is not available.");
    }
    if (assignment.status !== "published") fail("INVALID", "This assignment is closed.");
    if (Date.parse(assignment.dueDate) < now) fail("INVALID", "The due date has passed, so this assignment can no longer be submitted.");
    if (await submissionFor(ctx, assignment._id, student._id)) {
      fail("CONFLICT", "You have already submitted this assignment.");
    }

    const given = new Map(args.answers.map((a) => [a.questionId, a]));
    for (const id of given.keys()) {
      if (!assignment.questions.some((q) => q.id === id)) fail("INVALID", "One of the answers doesn't match a question.");
    }

    let needsTeacher = false;
    const answers: QuestionAnswerValue[] = assignment.questions.map((q, i) => {
      const a = given.get(q.id);
      if (q.type === "text") {
        const text = (a?.text ?? "").trim();
        if (text.length > 5000) fail("INVALID", `Your answer to question ${i + 1} is too long.`);
        needsTeacher = true;
        return { questionId: q.id, text };
      }
      const selected = [...new Set(a?.selected ?? [])];
      if (selected.some((s) => !Number.isInteger(s) || s < 0 || s >= q.options.length)) {
        fail("INVALID", `Question ${i + 1} has an invalid choice.`);
      }
      if (q.type === "single" && selected.length > 1) fail("INVALID", `Question ${i + 1} takes only one answer.`);
      const mark = autoMark(q, selected);
      if (mark === null) {
        needsTeacher = true;
        return { questionId: q.id, selected };
      }
      return { questionId: q.id, selected, awarded: mark, autoMarked: true };
    });

    const score = answers.reduce((n, a) => n + (a.awarded ?? 0), 0);
    const at = new Date(now).toISOString();
    const graded = !needsTeacher;
    const submissionId = await ctx.db.insert("submissions", {
      assignmentId: assignment._id,
      studentId: student._id,
      status: graded ? "graded" : "submitted",
      answers,
      submittedAt: at,
      score,
      grade: graded ? gradeFor(assignment.maxScore ? (score / assignment.maxScore) * 100 : 0).grade : undefined,
      gradedAt: graded ? at : undefined,
    });

    if (graded) {
      for (const userId of await accountsForStudent(ctx, student._id)) {
        const isPupil = userId === viewer._id;
        await notify(ctx, userId, {
          type: "assignment_graded",
          title: isPupil ? `${assignment.title} has been marked` : `${student.firstName}'s ${assignment.title} has been marked`,
          body: `${score} out of ${assignment.maxScore}.`,
          href: isPupil ? `/portal/pupil/assignments/${assignment._id}` : "/portal/parent/assignments",
        });
      }
    } else {
      await notifyTeacher(ctx, assignment.teacherId, {
        type: "assignment_published",
        title: `New submission: ${assignment.title}`,
        body: `${student.firstName} ${student.lastName} has submitted work for marking.`,
        href: `/portal/teacher/assignments/${assignment._id}`,
      });
    }
    return { submissionId, graded, score: graded ? score : undefined, maxScore: assignment.maxScore };
  },
});

/* --------------------------------- staff ---------------------------------- */

/** A teacher's own assignments (admins may pass any teacher). */
export const forTeacher = query({
  args: { teacherId: v.optional(v.id("teachers")) },
  handler: async (ctx, args) => {
    const viewer = await requireStaff(ctx);
    const teacherId = args.teacherId ?? viewer.teacherId;
    if (!teacherId) return [];
    if (teacherId !== viewer.teacherId && !isAdmin(viewer)) fail("FORBIDDEN", "You can only see your own assignments.");
    const rows = await ctx.db
      .query("assignments")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
      .collect();
    rows.sort((a, b) => b.startDate.localeCompare(a.startDate));
    return await Promise.all(rows.map(async (a) => ({ assignment: withId(a), stats: await statsFor(ctx, a) })));
  },
});

/** Every assignment in the school, for administrators. */
export const listAll = query({
  args: {
    classId: v.optional(v.string()),
    subjectId: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "super_admin", "admin");
    const term = args.search?.trim().toLowerCase() ?? "";
    const rows = (await ctx.db.query("assignments").collect())
      .filter((a) => {
        if (args.classId && args.classId !== "all" && a.classId !== args.classId) return false;
        if (args.subjectId && args.subjectId !== "all" && a.subjectId !== args.subjectId) return false;
        if (args.status && args.status !== "all" && a.status !== args.status) return false;
        if (term && !`${a.title} ${a.topic}`.toLowerCase().includes(term)) return false;
        return true;
      })
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
    const pageSize = args.pageSize ?? 12;
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
    const page = Math.min(Math.max(1, args.page ?? 1), pageCount);
    const items = await Promise.all(
      rows.slice((page - 1) * pageSize, page * pageSize).map(async (a) => ({
        assignment: withId(a),
        stats: await statsFor(ctx, a),
      })),
    );
    const all = await ctx.db.query("submissions").collect();
    return {
      items,
      total: rows.length,
      page,
      pageSize,
      pageCount,
      totals: {
        assignments: rows.length,
        submissions: all.length,
        graded: all.filter((s) => s.status === "graded").length,
        pending: all.filter((s) => s.status === "submitted").length,
      },
    };
  },
});

/** An assignment with its class roster and every submission, for the teacher who marks it. */
export const getForStaff = query({
  args: { assignmentId: v.string() },
  handler: async (ctx, { assignmentId }) => {
    const viewer = await requireStaff(ctx);
    const assignment = await getByLooseId(ctx, "assignments", assignmentId);
    if (!assignment) return null;
    await assertCanManageAssignment(ctx, viewer, assignment);
    const [students, submissions] = await Promise.all([
      ctx.db
        .query("students")
        .withIndex("by_class", (q) => q.eq("classId", assignment.classId))
        .collect(),
      ctx.db
        .query("submissions")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id))
        .collect(),
    ]);
    const bySubmitter = new Map(submissions.map((s) => [s.studentId, s]));
    const roster = students
      .filter((s) => s.status === "active" || bySubmitter.has(s._id))
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
      .map((s) => {
        const sub = bySubmitter.get(s._id) ?? null;
        return {
          student: { id: s._id, firstName: s.firstName, lastName: s.lastName, studentNo: s.studentNo, avatarSeed: s.avatarSeed },
          submission: sub ? withId(sub) : null,
          progress: progressOf(assignment, sub, Date.now()),
        };
      });
    return { assignment: withId(assignment), roster, stats: await statsFor(ctx, assignment) };
  },
});

/** Submissions waiting for a teacher to mark written answers. */
export const pendingForTeacher = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireStaff(ctx);
    if (!viewer.teacherId) return [];
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_teacher", (q) => q.eq("teacherId", viewer.teacherId!))
      .collect();
    const out = [];
    for (const a of assignments) {
      const subs = await ctx.db
        .query("submissions")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", a._id))
        .collect();
      for (const s of subs.filter((x) => x.status === "submitted")) {
        const student = await ctx.db.get(s.studentId);
        if (!student) continue;
        out.push({
          assignment: withId(a),
          submission: withId(s),
          student: { id: student._id, firstName: student.firstName, lastName: student.lastName, avatarSeed: student.avatarSeed },
        });
      }
    }
    return out.sort((x, y) => x.submission.submittedAt.localeCompare(y.submission.submittedAt));
  },
});

const assignmentFields = {
  classId: v.id("classes"),
  subjectId: v.id("subjects"),
  title: v.string(),
  topic: v.string(),
  description: v.string(),
  instructions: v.string(),
  questions: v.array(question),
  startDate: v.string(),
  dueDate: v.string(),
  publish: v.boolean(),
};

function validateDetails(args: { title: string; topic: string; startDate: string; dueDate: string }) {
  if (args.title.trim().length < 3) fail("INVALID", "Give the assignment a title of at least 3 characters.");
  if (args.title.length > 140) fail("INVALID", "The title is too long.");
  if (!args.topic.trim()) fail("INVALID", "Enter the topic.");
  const start = Date.parse(args.startDate);
  const due = Date.parse(args.dueDate);
  if (Number.isNaN(start) || Number.isNaN(due)) fail("INVALID", "Enter valid start and due dates.");
  if (due <= start) fail("INVALID", "The due date must be after the start date.");
}

function normaliseQuestions(questions: QuestionValue[]): QuestionValue[] {
  return questions.map((q) => ({
    ...q,
    prompt: q.prompt.trim(),
    options: q.type === "text" ? [] : q.options.map((o) => o.trim()),
    correct: q.type === "text" ? [] : [...new Set(q.correct)].sort((a, b) => a - b),
  }));
}

export const create = mutation({
  args: assignmentFields,
  handler: async (ctx, args) => {
    const viewer = await requireStaff(ctx);
    await assertTeachesSubject(ctx, viewer, args.classId, args.subjectId);
    validateDetails(args);
    const questions = normaliseQuestions(args.questions);
    validateQuestions(questions);
    if (args.publish && Date.parse(args.dueDate) < Date.now()) fail("INVALID", "The due date is already in the past.");

    // The teacher who owns the work: the caller, or (for an admin) whoever teaches the subject.
    let teacherId = viewer.teacherId;
    if (isAdmin(viewer)) {
      const row = await ctx.db
        .query("teachingAssignments")
        .withIndex("by_class_subject", (q) => q.eq("classId", args.classId).eq("subjectId", args.subjectId))
        .first();
      const cls = await ctx.db.get(args.classId);
      teacherId = row?.teacherId ?? cls?.classTeacherId ?? viewer.teacherId;
    }
    if (!teacherId) fail("INVALID", "No teacher is assigned to this subject in this class yet.");

    const now = nowISO();
    const id = await ctx.db.insert("assignments", {
      title: args.title.trim(),
      topic: args.topic.trim(),
      description: args.description.trim(),
      instructions: args.instructions.trim(),
      classId: args.classId,
      subjectId: args.subjectId,
      teacherId,
      termId: await activeTermId(ctx),
      questions,
      maxScore: questions.reduce((n, q) => n + q.points, 0),
      publishedAt: args.publish ? now : "",
      startDate: args.startDate,
      dueDate: args.dueDate,
      status: args.publish ? "published" : "draft",
      createdAt: now,
    });
    await audit(ctx, viewer, { action: args.publish ? "Published assignment" : "Drafted assignment", entity: "Assignment", entityId: id, newValue: args.title });
    if (args.publish) {
      const subject = await ctx.db.get(args.subjectId);
      await notifyClass(ctx, args.classId, {
        type: "assignment_published",
        title: `New ${subject?.name ?? ""} assignment: ${args.title.trim()}`,
        body: `Due ${new Date(args.dueDate).toUTCString().slice(0, 16)}.`,
      });
    }
    return id;
  },
});

export const update = mutation({
  args: { assignmentId: v.id("assignments"), ...assignmentFields },
  handler: async (ctx, { assignmentId, ...args }) => {
    const viewer = await requireStaff(ctx);
    const assignment = await ctx.db.get(assignmentId);
    if (!assignment) fail("NOT_FOUND", "Assignment not found.");
    await assertCanManageAssignment(ctx, viewer, assignment);
    await assertTeachesSubject(ctx, viewer, args.classId, args.subjectId);
    validateDetails(args);
    const questions = normaliseQuestions(args.questions);
    validateQuestions(questions);

    const hasSubmissions = Boolean(
      await ctx.db
        .query("submissions")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", assignmentId))
        .first(),
    );
    if (hasSubmissions) {
      const changed =
        JSON.stringify(questions) !== JSON.stringify(assignment.questions) ||
        args.classId !== assignment.classId ||
        args.subjectId !== assignment.subjectId;
      if (changed) fail("INVALID", "Pupils have already submitted, so the class, subject and questions can no longer change.");
    }

    const publishing = args.publish && assignment.status === "draft";
    await ctx.db.patch(assignmentId, {
      title: args.title.trim(),
      topic: args.topic.trim(),
      description: args.description.trim(),
      instructions: args.instructions.trim(),
      classId: args.classId,
      subjectId: args.subjectId,
      questions,
      maxScore: questions.reduce((n, q) => n + q.points, 0),
      startDate: args.startDate,
      dueDate: args.dueDate,
      ...(publishing ? { status: "published" as const, publishedAt: nowISO() } : {}),
    });
    await audit(ctx, viewer, { action: "Edited assignment", entity: "Assignment", entityId: assignmentId, newValue: args.title });
    if (publishing) {
      const subject = await ctx.db.get(args.subjectId);
      await notifyClass(ctx, args.classId, {
        type: "assignment_published",
        title: `New ${subject?.name ?? ""} assignment: ${args.title.trim()}`,
        body: `Due ${new Date(args.dueDate).toUTCString().slice(0, 16)}.`,
      });
    }
  },
});

export const setStatus = mutation({
  args: {
    assignmentId: v.id("assignments"),
    status: v.union(v.literal("published"), v.literal("closed"), v.literal("archived")),
  },
  handler: async (ctx, { assignmentId, status }) => {
    const viewer = await requireStaff(ctx);
    const assignment = await ctx.db.get(assignmentId);
    if (!assignment) fail("NOT_FOUND", "Assignment not found.");
    await assertCanManageAssignment(ctx, viewer, assignment);
    if (status === "published" && Date.parse(assignment.dueDate) < Date.now()) {
      fail("INVALID", "Move the due date into the future before publishing.");
    }
    await ctx.db.patch(assignmentId, {
      status,
      ...(status === "published" && !assignment.publishedAt ? { publishedAt: nowISO() } : {}),
    });
    await audit(ctx, viewer, { action: `Set assignment ${status}`, entity: "Assignment", entityId: assignmentId, previousValue: assignment.status, newValue: status });
  },
});

export const remove = mutation({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, { assignmentId }) => {
    const viewer = await requireStaff(ctx);
    const assignment = await ctx.db.get(assignmentId);
    if (!assignment) return;
    await assertCanManageAssignment(ctx, viewer, assignment);
    const anySubmission = await ctx.db
      .query("submissions")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", assignmentId))
      .first();
    if (anySubmission) fail("INVALID", "Pupils have submitted work for this assignment. Archive it instead.");
    await ctx.db.delete(assignmentId);
    await audit(ctx, viewer, { action: "Deleted assignment", entity: "Assignment", entityId: assignmentId, previousValue: assignment.title });
  },
});

/** Mark a submission: set marks per question and feedback. Pupils see the score immediately. */
export const grade = mutation({
  args: {
    submissionId: v.id("submissions"),
    marks: v.array(v.object({ questionId: v.string(), awarded: v.number() })),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, { submissionId, marks, feedback }) => {
    const viewer = await requireStaff(ctx);
    const submission = await ctx.db.get(submissionId);
    if (!submission) fail("NOT_FOUND", "Submission not found.");
    const assignment = await ctx.db.get(submission.assignmentId);
    if (!assignment) fail("NOT_FOUND", "Assignment not found.");
    await assertCanManageAssignment(ctx, viewer, assignment);

    const given = new Map(marks.map((m) => [m.questionId, m.awarded]));
    const answers = assignment.questions.map((q, i) => {
      const existing: QuestionAnswerValue = submission.answers.find((a) => a.questionId === q.id) ?? { questionId: q.id };
      const awarded = given.has(q.id) ? given.get(q.id)! : existing.awarded;
      if (awarded === undefined) fail("INVALID", `Enter a mark for question ${i + 1}.`);
      if (!Number.isFinite(awarded) || awarded < 0 || awarded > q.points) {
        fail("INVALID", `Question ${i + 1} is worth ${q.points} marks — enter a mark from 0 to ${q.points}.`);
      }
      return { ...existing, awarded: Math.round(awarded * 2) / 2 };
    });
    const score = answers.reduce((n, a) => n + (a.awarded ?? 0), 0);
    const wasGraded = submission.status === "graded";
    await ctx.db.patch(submissionId, {
      answers,
      score,
      grade: gradeFor(assignment.maxScore ? (score / assignment.maxScore) * 100 : 0).grade,
      feedback: feedback?.trim() || undefined,
      status: "graded",
      gradedAt: nowISO(),
      gradedBy: viewer._id,
    });
    await audit(ctx, viewer, {
      action: wasGraded ? "Re-marked submission" : "Marked submission",
      entity: "Submission",
      entityId: submissionId,
      previousValue: wasGraded ? String(submission.score ?? "") : undefined,
      newValue: `${score}/${assignment.maxScore}`,
    });

    const student = await ctx.db.get(submission.studentId);
    for (const userId of await accountsForStudent(ctx, submission.studentId)) {
      const user = await ctx.db.get(userId);
      const isPupil = Boolean(user?.studentId);
      await notify(ctx, userId, {
        type: "assignment_graded",
        title: isPupil
          ? `${assignment.title} has been marked`
          : `${student?.firstName ?? "Your child"}'s ${assignment.title} has been marked`,
        body: `${score} out of ${assignment.maxScore}.`,
        href: isPupil ? `/portal/pupil/assignments/${assignment._id}` : "/portal/parent/assignments",
      });
    }
    return { score, maxScore: assignment.maxScore };
  },
});

/** Classes and subjects a teacher may set work for. */
export const teachingOptions = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireStaff(ctx);
    const rows = isAdmin(viewer)
      ? await ctx.db.query("teachingAssignments").collect()
      : viewer.teacherId
        ? await ctx.db
            .query("teachingAssignments")
            .withIndex("by_teacher", (q) => q.eq("teacherId", viewer.teacherId!))
            .collect()
        : [];
    const pairs = new Map<string, { classId: Id<"classes">; subjectId: Id<"subjects"> }>();
    for (const r of rows) pairs.set(`${r.classId}:${r.subjectId}`, { classId: r.classId, subjectId: r.subjectId });

    // Class teachers may set work in any subject for their own class.
    if (viewer.teacherId) {
      const own = await teacherClassIds(ctx, viewer.teacherId);
      for (const classId of own) {
        const cls = await ctx.db.get(classId);
        if (cls?.classTeacherId !== viewer.teacherId) continue;
        const subjects = (await ctx.db.query("subjects").collect()).filter((s) => s.levelIds.includes(cls.levelId));
        for (const s of subjects) pairs.set(`${classId}:${s._id}`, { classId, subjectId: s._id });
      }
    }
    return [...pairs.values()];
  },
});
