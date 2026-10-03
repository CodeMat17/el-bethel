import Link from "next/link";
import type { Metadata } from "next";
import { PlusIcon } from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { requireTeacher } from "@/lib/school/auth";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "Quizzes" };

const STATUS_TONE = { draft: "neutral", published: "success", closed: "info" } as const;

export default async function TeacherQuizzesPage() {
  const user = await requireTeacher();
  if (!user.teacherId) {
    return <EmptyState icon="GraduationCap" title="No teaching record" description="Contact the school administrator." />;
  }

  // Quizzes for classes and subjects this teacher teaches (enforced in Convex).
  const [items, dir] = await Promise.all([query(api.quizzes.forTeacher, {}), getDirectory()]);
  const toMark = items.reduce((n, i) => n + i.needsMarking, 0);

  return (
    <>
      <PortalPageHeader
        title="Quizzes"
        description="Timed checks of understanding with automatic marking, typed answers you mark yourself, and results per question."
        action={
          <Button size="lg" className="font-bold" render={<Link href="/portal/teacher/quizzes/new" />}>
            <PlusIcon />
            New quiz
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Live quizzes" value={items.filter((i) => i.quiz.status === "published").length} icon="Puzzle" tone="info" />
        <StatCard label="Drafts" value={items.filter((i) => i.quiz.status === "draft").length} icon="ClipboardPen" tone="neutral" />
        <StatCard label="Attempts handed in" value={items.reduce((n, i) => n + i.attempts, 0)} icon="Activity" tone="success" />
        <StatCard label="Waiting for marking" value={toMark} icon="PenSquare" tone={toMark > 0 ? "warning" : "success"} />
      </div>

      {items.length === 0 ? (
        <EmptyState icon="Puzzle" title="No quizzes yet" description="Create your first quiz — pupils see it as soon as you publish." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(({ quiz, roster, pupils, needsMarking, averagePercent, maxScore }) => {
            const rate = roster ? Math.round((pupils / roster) * 100) : 0;
            return (
              <Card key={quiz.id} className="flex h-full flex-col gap-0 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/portal/teacher/quizzes/${quiz.id}`} className="block truncate font-heading text-base font-extrabold hover:underline">
                      {quiz.title}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {dir.className(quiz.classId)} · {dir.subjectName(quiz.subjectId)}
                    </p>
                  </div>
                  <StatusPill tone={STATUS_TONE[quiz.status]}>{quiz.status}</StatusPill>
                </div>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{quiz.description}</p>
                <Separator className="my-4" />

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="font-bold">{quiz.questions.length} questions · {maxScore} marks</Badge>
                  <Badge variant="secondary" className="font-bold">{quiz.durationMinutes} min</Badge>
                  {averagePercent !== null ? <Badge variant="outline" className="font-bold">Average {averagePercent}%</Badge> : null}
                  {needsMarking > 0 ? <Badge className="font-bold">{needsMarking} to mark</Badge> : null}
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-xs font-bold">
                    <span>Pupils who have sat it</span>
                    <span className="tabular-nums text-muted-foreground">
                      {pupils} of {roster}
                    </span>
                  </div>
                  <Progress value={rate} className="mt-2" />
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Opens {formatDate(quiz.opensAt)} — closes {formatDate(quiz.closesAt)}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
