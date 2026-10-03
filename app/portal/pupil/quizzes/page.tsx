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
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { formatDate, formatDateTime } from "@/lib/school/format";

export const metadata: Metadata = { title: "Quizzes" };

export default async function PupilQuizzesPage() {
  const user = await requirePupil();
  if (!user.studentId) {
    return <EmptyState icon="Backpack" title="No pupil record" description="Please ask your class teacher." />;
  }

  const [items, dir] = await Promise.all([query(api.quizzes.forPupil, {}), getDirectory()]);
  const now = new Date().getTime();

  return (
    <>
      <PortalPageHeader title="Quizzes" description="Quick checks set by your teachers. Your answers save as you go." />

      {items.length === 0 ? (
        <EmptyState icon="Puzzle" title="No quizzes right now" description="When your teacher sets a quiz it will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(({ quiz, attempts }) => {
            const done = attempts.filter((a) => a.status === "submitted");
            const inProgress = attempts.some((a) => a.status === "in_progress");
            const scored = done.filter((a) => a.score !== null);
            const best = [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
            const remaining = quiz.attemptsAllowed - done.length - (inProgress ? 1 : 0);
            const closed = quiz.status === "closed" || Date.parse(quiz.closesAt) < now;
            const notYet = Date.parse(quiz.opensAt) > now;
            const pct = best?.score != null ? Math.round((best.score / best.maxScore) * 100) : 0;
            const waiting = done.some((a) => a.needsMarking || !a.resultVisible);

            return (
              <Card key={quiz.id} className="flex h-full flex-col gap-0 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold-foreground dark:text-gold">
                    <PuzzleIcon className="size-5" />
                  </span>
                  {best?.score != null ? (
                    <StatusPill tone={pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger"}>
                      {best.score}/{best.maxScore}
                    </StatusPill>
                  ) : inProgress ? (
                    <StatusPill tone="warning">In progress</StatusPill>
                  ) : waiting ? (
                    <StatusPill tone="info">Waiting for marks</StatusPill>
                  ) : notYet ? (
                    <StatusPill tone="neutral">Opens soon</StatusPill>
                  ) : closed ? (
                    <StatusPill tone="neutral">Closed</StatusPill>
                  ) : (
                    <StatusPill tone="info">Not tried yet</StatusPill>
                  )}
                </div>

                <h2 className="mt-4 font-heading text-base font-extrabold">{quiz.title}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{quiz.description}</p>
                {best?.score != null ? <Progress value={pct} className="mt-4" /> : null}

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="font-bold">{dir.subjectName(quiz.subjectId)}</Badge>
                  <Badge variant="secondary" className="font-bold">{quiz.questionCount} questions</Badge>
                  <Badge variant="secondary" className="font-bold">{quiz.durationMinutes} minutes</Badge>
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  {notYet
                    ? `Opens ${formatDateTime(quiz.opensAt)}`
                    : closed
                      ? `Closed ${formatDate(quiz.closesAt)}`
                      : `Closes ${formatDate(quiz.closesAt)} · ${remaining > 0 ? `${remaining} attempt${remaining === 1 ? "" : "s"} left` : "No attempts left"}`}
                </p>

                <Button className="mt-5 w-full font-bold" size="lg" disabled={notYet} render={<Link href={`/portal/pupil/quizzes/${quiz.id}`} />}>
                  {inProgress ? "Carry on" : done.length > 0 || closed ? "See my result" : "Open the quiz"}
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
