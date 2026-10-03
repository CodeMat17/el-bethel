import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CheckIcon, XIcon } from "lucide-react";

import { StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { QuizRunner, StartQuizButton } from "@/components/portal/quiz-runner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { requirePupil } from "@/lib/school/auth";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { formatDateTime } from "@/lib/school/format";

export const metadata: Metadata = { title: "Quiz" };

function shown(type: string, value: string): string {
  if (type !== "matching") return value || "—";
  try {
    const list: unknown = JSON.parse(value || "[]");
    return Array.isArray(list) ? list.map((x) => String(x || "—")).join(" · ") : "—";
  } catch {
    return "—";
  }
}

export default async function PupilQuizPage({ params }: PageProps<"/portal/pupil/quizzes/[id]">) {
  await requirePupil();
  const { id } = await params;
  // Convex only returns quizzes for the pupil's own class, and never the answer key while it could help.
  const [data, dir] = await Promise.all([query(api.quizzes.takeForPupil, { id }), getDirectory()]);
  if (!data) notFound();
  const { quiz, attempts, live, review } = data;
  const now = Date.parse(data.serverNow);
  const closed = quiz.status === "closed" || Date.parse(quiz.closesAt) < now;
  const notYet = Date.parse(quiz.opensAt) > now;
  const remaining = quiz.attemptsAllowed - attempts.length;

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/pupil/quizzes" />}>
        <ArrowLeftIcon />
        All quizzes
      </Button>

      <PortalPageHeader
        eyebrow={`${dir.subjectName(quiz.subjectId)} · ${dir.teacherName(quiz.teacherId)}`}
        title={quiz.title}
        description={quiz.description}
      />

      {live ? (
        <QuizRunner
          attemptId={live.id}
          title={quiz.title}
          questions={live.questions}
          deadline={live.deadline}
          serverNow={data.serverNow}
          savedAnswers={live.answers}
        />
      ) : (
        <>
          {attempts.length > 0 ? (
            <Card className="mb-6 gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Your attempts</h2>
              <Separator className="my-4" />
              <ul className="space-y-3">
                {attempts.map((attempt) => (
                  <li key={attempt.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">Attempt {attempt.attemptNo}</p>
                      {attempt.score !== null ? (
                        <p className="font-heading text-base font-extrabold tabular-nums">
                          {attempt.score}/{attempt.maxScore}
                        </p>
                      ) : (
                        <StatusPill tone="info">{attempt.needsMarking ? "Being marked" : "Score shown when the quiz closes"}</StatusPill>
                      )}
                    </div>
                    {attempt.score !== null ? <Progress value={Math.round((attempt.score / attempt.maxScore) * 100)} className="mt-2.5" /> : null}
                    {attempt.submittedAt ? <p className="mt-2 text-xs text-muted-foreground">Handed in {formatDateTime(attempt.submittedAt)}</p> : null}
                    {attempt.feedback ? (
                      <p className="mt-3 rounded-lg bg-muted/70 p-3 text-sm">
                        <span className="font-extrabold">Teacher&apos;s comment · </span>
                        {attempt.feedback}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {notYet ? (
            <Card className="gap-0 p-8 text-center">
              <p className="font-heading text-lg font-extrabold">This quiz opens {formatDateTime(quiz.opensAt)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Come back then to start it.</p>
            </Card>
          ) : !closed && remaining > 0 ? (
            <Card className="gap-0 p-6 sm:p-8">
              <h2 className="font-heading text-lg font-extrabold">Ready?</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li>• {quiz.questionCount} questions, {quiz.maxScore} marks in total.</li>
                <li>• You have {quiz.durationMinutes} minutes once you press Start. The clock keeps going if you leave the page.</li>
                <li>• Your answers save as you go. When time runs out, your quiz is handed in for you.</li>
                <li>• {remaining} attempt{remaining === 1 ? "" : "s"} left.</li>
              </ul>
              <div className="mt-6">
                <StartQuizButton quizId={quiz.id} label={attempts.length > 0 ? "Try again" : "Start the quiz"} />
              </div>
            </Card>
          ) : (
            <Card className="gap-0 p-8 text-center">
              <p className="font-heading text-lg font-extrabold">{closed ? "This quiz has closed" : "You have used all your attempts"}</p>
              <p className="mt-2 text-sm text-muted-foreground">Talk to your teacher if you would like another go at this quiz.</p>
            </Card>
          )}

          {review ? (
            <Card className="mt-6 gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Check your answers</h2>
              <Separator className="my-4" />
              <ol className="space-y-3">
                {review.map((q, i) => {
                  const full = q.awarded !== null && q.awarded >= q.points;
                  return (
                    <li key={q.id} className="rounded-xl border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold">
                          {i + 1}. {q.prompt}
                        </p>
                        <span className={`flex shrink-0 items-center gap-1 text-sm font-extrabold ${full ? "text-success" : "text-destructive"}`}>
                          {full ? <CheckIcon className="size-4" /> : <XIcon className="size-4" />}
                          {q.awarded ?? 0}/{q.points}
                        </span>
                      </div>
                      <p className="mt-2 text-sm">
                        <span className="text-muted-foreground">Your answer: </span>
                        {shown(q.type, q.given)}
                      </p>
                      {!full && q.correct ? (
                        <p className="mt-1 text-sm">
                          <span className="text-muted-foreground">Correct answer: </span>
                          <span className="font-semibold">{shown(q.type, q.correct)}</span>
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </Card>
          ) : null}
        </>
      )}
    </>
  );
}
