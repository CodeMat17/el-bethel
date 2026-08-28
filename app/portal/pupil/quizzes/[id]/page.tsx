import Link from "next/link";
import type { Metadata } from "next";
import { forbidden, notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { PortalPageHeader } from "@/components/portal/page-header";
import { QuizRunner } from "@/components/portal/quiz-runner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { requirePupil } from "@/lib/school/auth";
import { getQuiz, getQuizAttempts, getStudent, getSubject, teacherNameById } from "@/lib/school/data";
import { formatDateTime } from "@/lib/school/format";

export const metadata: Metadata = { title: "Quiz" };

export default async function PupilQuizPage({ params }: PageProps<"/portal/pupil/quizzes/[id]">) {
  const user = await requirePupil();
  const { id } = await params;
  const quiz = getQuiz(id);
  if (!quiz) notFound();

  const student = user.studentId ? getStudent(user.studentId) : null;
  // A pupil may only open a quiz set for their own class.
  if (!student || student.classId !== quiz.classId) forbidden();

  const attempts = getQuizAttempts(quiz.id, student.id);
  const remaining = quiz.attemptsAllowed - attempts.length;
  const best = [...attempts].sort((a, b) => b.score - a.score)[0];

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/pupil/quizzes" />}>
        <ArrowLeftIcon />
        All quizzes
      </Button>

      <PortalPageHeader
        eyebrow={`${getSubject(quiz.subjectId)?.name} · ${teacherNameById(quiz.teacherId)}`}
        title={quiz.title}
        description={quiz.description}
      />

      {attempts.length > 0 ? (
        <Card className="mb-6 gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Your attempts</h2>
          <Separator className="my-4" />
          <ul className="space-y-3">
            {attempts.map((attempt) => {
              const pct = Math.round((attempt.score / attempt.maxScore) * 100);
              return (
                <li key={attempt.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold">Attempt {attempt.attemptNo}</p>
                    <p className="font-heading text-base font-extrabold tabular-nums">
                      {attempt.score}/{attempt.maxScore}
                    </p>
                  </div>
                  <Progress value={pct} className="mt-2.5" />
                  {attempt.submittedAt ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Finished {formatDateTime(attempt.submittedAt)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {best ? (
            <p className="mt-4 rounded-xl bg-muted/70 p-3.5 text-sm">
              <span className="font-extrabold">Your best score · </span>
              {best.score} out of {best.maxScore}
            </p>
          ) : null}
        </Card>
      ) : null}

      {remaining > 0 ? (
        <QuizRunner
          quizId={quiz.id}
          title={quiz.title}
          questions={quiz.questions}
          durationMinutes={quiz.durationMinutes}
        />
      ) : (
        <Card className="gap-0 p-8 text-center">
          <p className="font-heading text-lg font-extrabold">You have used all your attempts</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Talk to your teacher if you would like another go at this quiz.
          </p>
        </Card>
      )}
    </>
  );
}
