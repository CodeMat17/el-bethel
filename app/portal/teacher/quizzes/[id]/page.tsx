import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, LockIcon, PencilIcon, SendIcon, TrashIcon, UndoIcon } from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { QuizMarkDialog } from "@/components/portal/quiz-mark-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { deleteQuiz, setQuizStatus } from "@/lib/school/actions/quizzes";
import { requireTeacher } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { formatDateTime } from "@/lib/school/format";

export const metadata: Metadata = { title: "Quiz results" };

const TYPE_LABEL = {
  multiple_choice: "Multiple choice",
  true_false: "True / False",
  short_answer: "Short answer",
  picture: "Picture",
  matching: "Matching",
} as const;

export default async function TeacherQuizPage({ params }: PageProps<"/portal/teacher/quizzes/[id]">) {
  await requireTeacher();
  const { id } = await params;
  const [data, dir] = await Promise.all([query(api.quizzes.getForTeacher, { id }), getDirectory()]);
  if (!data) notFound();
  const { quiz, stats, questionStats, attempts, notAttempted, rosterSize, maxScore } = data;
  const submitted = attempts.filter((a) => a.status === "submitted");

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/teacher/quizzes" />}>
        <ArrowLeftIcon />
        All quizzes
      </Button>

      <PortalPageHeader
        eyebrow={`${dir.className(quiz.classId)} · ${dir.subjectName(quiz.subjectId)}`}
        title={quiz.title}
        description={`Open ${formatDateTime(quiz.opensAt)} to ${formatDateTime(quiz.closesAt)} · ${quiz.durationMinutes} minutes · ${quiz.attemptsAllowed} attempt${quiz.attemptsAllowed === 1 ? "" : "s"}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="font-bold" render={<Link href={`/portal/teacher/quizzes/${quiz.id}/edit`} />}>
              <PencilIcon />
              Edit
            </Button>
            {quiz.status === "draft" ? (
              <ConfirmAction action={setQuizStatus.bind(null, quiz.id, "published")} icon={<SendIcon />} variant="default" size="default" pendingText="Publishing…">
                Publish
              </ConfirmAction>
            ) : null}
            {quiz.status === "published" ? (
              <ConfirmAction
                action={setQuizStatus.bind(null, quiz.id, "closed")}
                icon={<LockIcon />}
                size="default"
                pendingText="Closing…"
                confirm={{ title: "Close this quiz?", description: "Pupils can no longer start it, and anyone still working is handed in with the answers saved so far.", confirmLabel: "Close quiz" }}
              >
                Close
              </ConfirmAction>
            ) : null}
            {quiz.status === "closed" ? (
              <ConfirmAction action={setQuizStatus.bind(null, quiz.id, "published")} icon={<UndoIcon />} size="default" pendingText="Reopening…">
                Reopen
              </ConfirmAction>
            ) : null}
            {attempts.length === 0 ? (
              <ConfirmAction
                action={deleteQuiz.bind(null, quiz.id)}
                icon={<TrashIcon />}
                variant="ghost"
                size="default"
                className="font-bold text-destructive"
                destructive
                pendingText="Deleting…"
                confirm={{ title: "Delete this quiz?", description: "Nobody has attempted it yet. This can't be undone.", confirmLabel: "Delete" }}
              >
                Delete
              </ConfirmAction>
            ) : null}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pupils who sat it" value={`${stats.pupils} / ${rosterSize}`} icon="Users" tone="info" />
        <StatCard label="Average score" value={stats.averagePercent === null ? "—" : `${stats.averagePercent}%`} icon="TrendingUp" tone="gold" />
        <StatCard label="Still working" value={stats.inProgress} icon="Timer" tone="neutral" />
        <StatCard label="Waiting for marking" value={stats.needsMarking} icon="PenSquare" tone={stats.needsMarking > 0 ? "warning" : "success"} />
      </div>

      <Card className="mb-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">How each question went</h2>
        <p className="mt-1 text-sm text-muted-foreground">Share of available marks earned, across marked answers. {maxScore} marks in total.</p>
        <Separator className="my-4" />
        <ol className="space-y-3">
          {quiz.questions.map((q, i) => {
            const s = questionStats.find((x) => x.questionId === q.id);
            return (
              <li key={q.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-bold">{i + 1}.</span> {q.prompt}{" "}
                    <span className="text-xs text-muted-foreground">({TYPE_LABEL[q.type]}, {q.points})</span>
                  </span>
                  <span className="shrink-0 font-bold tabular-nums">{s?.percent === null || s === undefined ? "—" : `${s.percent}%`}</span>
                </div>
                <Progress value={s?.percent ?? 0} className="mt-1.5" />
              </li>
            );
          })}
        </ol>
      </Card>

      <Card className="gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Attempts</h2>
        <Separator className="my-4" />
        {submitted.length === 0 ? (
          <EmptyState icon="Puzzle" title="No attempts handed in yet" description="Attempts appear here as pupils finish the quiz." />
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pupil</TableHead>
                  <TableHead>Attempt</TableHead>
                  <TableHead>Handed in</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Marking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submitted.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-bold">{a.studentName}</TableCell>
                    <TableCell className="tabular-nums">{a.attemptNo}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{a.submittedAt ? formatDateTime(a.submittedAt) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {a.score}/{a.maxScore}
                      {a.needsMarking ? <StatusPill tone="warning" className="ml-2">partly marked</StatusPill> : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <QuizMarkDialog
                        attemptId={a.id}
                        studentName={a.studentName}
                        attemptNo={a.attemptNo}
                        questions={quiz.questions}
                        answers={a.answers}
                        marks={a.marks ?? {}}
                        feedback={a.feedback}
                        needsMarking={Boolean(a.needsMarking)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {quiz.status !== "draft" && notAttempted.length > 0 ? (
          <>
            <Separator className="my-5" />
            <p className="text-xs font-bold text-muted-foreground uppercase">Not attempted yet ({notAttempted.length})</p>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {notAttempted.map((s) => (
                <li key={s.id}>
                  <StatusPill tone="neutral" dot={false}>{s.name}</StatusPill>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Card>
    </>
  );
}
