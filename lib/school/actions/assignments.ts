"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { tryMutation } from "@/lib/school/convex";
import type { Question } from "@/lib/school/types";

/**
 * Assignment server actions. Each one forwards to a Convex mutation that does
 * the real authorization and validation; these only shape the result for the UI.
 */

export interface ActionResult {
  ok: boolean;
  message?: string;
  id?: string;
  score?: number;
  maxScore?: number;
  graded?: boolean;
}

export interface AnswerInput {
  questionId: string;
  text?: string;
  selected?: number[];
}

export async function submitAnswers(assignmentId: string, answers: AnswerInput[]): Promise<ActionResult> {
  const result = await tryMutation(api.assignments.submit, {
    assignmentId: assignmentId as Id<"assignments">,
    answers,
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/pupil", "layout");
  return {
    ok: true,
    graded: result.data.graded,
    score: result.data.score,
    maxScore: result.data.maxScore,
    message: result.data.graded
      ? `Your work has been marked: ${result.data.score} out of ${result.data.maxScore}.`
      : "Your work has been sent to your teacher for marking.",
  };
}

export interface AssignmentInput {
  classId: string;
  subjectId: string;
  title: string;
  topic: string;
  description: string;
  instructions: string;
  questions: Question[];
  startDate: string;
  dueDate: string;
  publish: boolean;
}

function toArgs(input: AssignmentInput) {
  return {
    ...input,
    classId: input.classId as Id<"classes">,
    subjectId: input.subjectId as Id<"subjects">,
    questions: input.questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      correct: q.correct,
      points: q.points,
    })),
  };
}

/** Sets the work for the main class plus any `alsoFor` classes; each gets its own copy. */
export async function createAssignment(input: AssignmentInput, alsoFor: string[] = []): Promise<ActionResult> {
  const { classId, ...args } = toArgs(input);
  const result = await tryMutation(api.assignments.create, {
    ...args,
    classIds: [classId, ...alsoFor.map((id) => id as Id<"classes">)],
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/teacher", "layout");
  const count = result.data.length;
  const target = count === 1 ? "the class" : `${count} classes`;
  return {
    ok: true,
    // With several classes there is no single assignment page to open.
    id: count === 1 ? result.data[0] : undefined,
    message: input.publish
      ? `Assignment published to ${target}.`
      : `${count === 1 ? "Draft" : `${count} drafts`} saved. Publish when you're ready.`,
  };
}

export async function updateAssignment(assignmentId: string, input: AssignmentInput): Promise<ActionResult> {
  const result = await tryMutation(api.assignments.update, {
    assignmentId: assignmentId as Id<"assignments">,
    ...toArgs(input),
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/teacher", "layout");
  return { ok: true, id: assignmentId, message: "Assignment saved." };
}

export async function setAssignmentStatus(
  assignmentId: string,
  status: "published" | "closed" | "archived",
): Promise<ActionResult> {
  const result = await tryMutation(api.assignments.setStatus, {
    assignmentId: assignmentId as Id<"assignments">,
    status,
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal", "layout");
  const labels = { published: "Assignment published.", closed: "Assignment closed.", archived: "Assignment archived." };
  return { ok: true, message: labels[status] };
}

export async function deleteAssignment(assignmentId: string): Promise<ActionResult> {
  const result = await tryMutation(api.assignments.remove, { assignmentId: assignmentId as Id<"assignments"> });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal", "layout");
  return { ok: true, message: "Assignment deleted." };
}

export async function gradeSubmission(
  submissionId: string,
  marks: { questionId: string; awarded: number }[],
  feedback: string,
): Promise<ActionResult> {
  const result = await tryMutation(api.assignments.grade, {
    submissionId: submissionId as Id<"submissions">,
    marks,
    feedback,
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/teacher", "layout");
  return {
    ok: true,
    score: result.data.score,
    maxScore: result.data.maxScore,
    message: `Marked: ${result.data.score} out of ${result.data.maxScore}. The pupil can see it now.`,
  };
}
