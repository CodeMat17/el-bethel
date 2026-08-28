"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";

import { requirePupil } from "@/lib/school/auth";
import { DEMO_TODAY } from "@/lib/school/seed";
import { getDb } from "@/lib/school/store";

export interface QuizState {
  ok: boolean;
  message?: string;
  score?: number;
  maxScore?: number;
}

/** Marks a quiz attempt on the server — answers are never scored in the browser. */
export async function submitQuizAttempt(_prev: QuizState, formData: FormData): Promise<QuizState> {
  const user = await requirePupil();
  if (!user.studentId) forbidden();

  const db = getDb();
  const quiz = db.quizzes.find((q) => q.id === String(formData.get("quizId") ?? ""));
  if (!quiz) return { ok: false, message: "We couldn't find that quiz." };

  const student = db.students.find((s) => s.id === user.studentId);
  if (!student || student.classId !== quiz.classId) forbidden();

  const previous = db.quizAttempts.filter((a) => a.quizId === quiz.id && a.studentId === student.id);
  if (previous.length >= quiz.attemptsAllowed) {
    return { ok: false, message: "You have already used all your attempts at this quiz." };
  }

  const answers: Record<string, string> = {};
  let score = 0;
  const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  for (const question of quiz.questions) {
    const given = String(formData.get(`q-${question.id}`) ?? "").trim();
    answers[question.id] = given;
    if (given && given.toLowerCase() === question.answer.toLowerCase()) score += question.points;
  }

  db.quizAttempts.push({
    id: `qa-${db.quizAttempts.length + 1}-${Date.now().toString(36)}`,
    quizId: quiz.id,
    studentId: student.id,
    answers,
    score,
    maxScore,
    startedAt: DEMO_TODAY.toISOString(),
    submittedAt: DEMO_TODAY.toISOString(),
    attemptNo: previous.length + 1,
  });

  revalidatePath(`/portal/pupil/quizzes/${quiz.id}`);
  revalidatePath("/portal/pupil/quizzes");
  return { ok: true, score, maxScore, message: `You scored ${score} out of ${maxScore}.` };
}
