import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, PuzzleIcon } from "lucide-react";

import { EmptyState, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requirePupil } from "@/lib/school/auth";
import { getQuizAttempts, getQuizzesForClass, getStudent, getSubject } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "Quizzes" };

export default async function PupilQuizzesPage() {
  const user = await requirePupil();
  const student = user.studentId ? getStudent(user.studentId) : null;
  if (!student) {
    return <EmptyState icon="Backpack" title="No pupil record" description="Please ask your class teacher." />;
  }

  const quizzes = getQuizzesForClass(student.classId);

  return (
    <>
      <PortalPageHeader
        title="Quizzes"
        description="Quick checks set by your teachers. You see your score straight away."
      />

      {quizzes.length === 0 ? (
        <EmptyState
          icon="Puzzle"
          title="No quizzes right now"
          description="When your teacher sets a quiz it will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {quizzes.map((quiz) => {
            const attempts = getQuizAttempts(quiz.id, student.id);
            const best = attempts.sort((a, b) => b.score - a.score)[0];
            const used = attempts.length;
            const remaining = quiz.attemptsAllowed - used;
            const pct = best ? Math.round((best.score / best.maxScore) * 100) : 0;

            return (
              <Card key={quiz.id} className="flex h-full flex-col gap-0 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold-foreground dark:text-gold">
                    <PuzzleIcon className="size-5" />
                  </span>
                  {best ? (
                    <StatusPill tone={pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger"}>
                      {best.score}/{best.maxScore}
                    </StatusPill>
                  ) : (
                    <StatusPill tone="info">Not tried yet</StatusPill>
                  )}
                </div>

                <h2 className="mt-4 font-heading text-base font-extrabold">{quiz.title}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {quiz.description}
                </p>

                {best ? <Progress value={pct} className="mt-4" /> : null}

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="font-bold">{getSubject(quiz.subjectId)?.name}</Badge>
                  <Badge variant="secondary" className="font-bold">{quiz.questions.length} questions</Badge>
                  <Badge variant="secondary" className="font-bold">{quiz.durationMinutes} minutes</Badge>
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Closes {formatDate(quiz.closesAt)} · {remaining > 0 ? `${remaining} attempt${remaining === 1 ? "" : "s"} left` : "No attempts left"}
                </p>

                <Button
                  className="mt-5 w-full font-bold"
                  size="lg"
                  disabled={remaining <= 0}
                  render={<Link href={`/portal/pupil/quizzes/${quiz.id}`} />}
                >
                  {used > 0 ? "See my result" : "Start the quiz"}
                  <ArrowRightIcon />
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
