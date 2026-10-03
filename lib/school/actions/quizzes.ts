"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { tryMutation } from "@/lib/school/convex";
import type { QuizQuestion } from "@/lib/school/types";

/**
 * Quiz server actions. Convex does the authorization, timing and marking;
 * these only shape results for the UI.
 */

export interface QuizActionResult {
  ok: boolean;
  message?: string;
  id?: string;
  score?: number | null;
  maxScore?: number;
  needsMarking?: boolean;
  savedAt?: string;
}

/* ---------------------------------- pupil --------------------------------- */

export async function startQuiz(quizId: string): Promise<QuizActionResult> {
  const result = await tryMutation(api.quizzes.start, { quizId: quizId as Id<"quizzes"> });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath(`/portal/pupil/quizzes/${quizId}`);
  return { ok: true, id: result.data };
}

export async function saveQuizProgress(attemptId: string, answers: Record<string, string>): Promise<QuizActionResult> {
  const result = await tryMutation(api.quizzes.saveProgress, { attemptId: attemptId as Id<"quizAttempts">, answers });
  return result.ok ? { ok: true, savedAt: result.data } : { ok: false, message: result.message };
}

export async function submitQuiz(attemptId: string, answers: Record<string, string>): Promise<QuizActionResult> {
  const result = await tryMutation(api.quizzes.submit, { attemptId: attemptId as Id<"quizAttempts">, answers });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/pupil", "layout");
  const { score, maxScore, needsMarking, late } = result.data;
  return {
    ok: true,
    score,
    maxScore,
    needsMarking,
    message: late
      ? "Time ran out — the answers saved before the end have been handed in."
      : score === null
        ? needsMarking
          ? "Handed in. Your teacher will mark the written answers."
          : "Handed in. Your score will appear when the quiz closes."
        : `You scored ${score} out of ${maxScore}.`,
  };
}

/* --------------------------------- teacher -------------------------------- */

export interface QuizInput {
  id?: string;
  classId: string;
  subjectId: string;
  title: string;
  description: string;
  durationMinutes: number;
  attemptsAllowed: number;
  randomize: boolean;
  showResultsImmediately: boolean;
  opensAt: string;
  closesAt: string;
  questions: QuizQuestion[];
  publish: boolean;
}

export async function saveQuiz(input: QuizInput): Promise<QuizActionResult> {
  const result = await tryMutation(api.quizzes.save, {
    id: input.id ? (input.id as Id<"quizzes">) : undefined,
    publish: input.publish,
    classId: input.classId as Id<"classes">,
    subjectId: input.subjectId as Id<"subjects">,
    title: input.title,
    description: input.description,
    durationMinutes: input.durationMinutes,
    attemptsAllowed: input.attemptsAllowed,
    randomize: input.randomize,
    showResultsImmediately: input.showResultsImmediately,
    opensAt: input.opensAt,
    closesAt: input.closesAt,
    questions: input.questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      answer: q.answer,
      points: q.points,
      imageUrl: q.imageUrl,
      pairs: q.pairs,
    })),
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/teacher", "layout");
  revalidatePath("/portal/pupil/quizzes", "layout");
  return {
    ok: true,
    id: result.data.id,
    message: result.data.locked
      ? "Saved. Pupils have already sat this quiz, so the questions were left unchanged."
      : input.publish
        ? "Published. Pupils and parents have been notified."
        : "Saved.",
  };
}

export async function setQuizStatus(id: string, status: "draft" | "published" | "closed"): Promise<QuizActionResult> {
  const result = await tryMutation(api.quizzes.setStatus, { id: id as Id<"quizzes">, status });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/teacher", "layout");
  revalidatePath("/portal/pupil/quizzes", "layout");
  return {
    ok: true,
    message: status === "closed" ? "Quiz closed. Unfinished attempts were handed in." : status === "published" ? "Quiz published." : "Moved back to draft.",
  };
}

export async function deleteQuiz(id: string): Promise<QuizActionResult> {
  const result = await tryMutation(api.quizzes.remove, { id: id as Id<"quizzes"> });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/teacher", "layout");
  return { ok: true, message: "Quiz deleted." };
}

export async function markQuizAttempt(attemptId: string, marks: Record<string, number>, feedback: string): Promise<QuizActionResult> {
  const result = await tryMutation(api.quizzes.mark, { attemptId: attemptId as Id<"quizAttempts">, marks, feedback });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/teacher/quizzes", "layout");
  return { ok: true, message: `Marked: ${result.data.score} marks.` };
}
