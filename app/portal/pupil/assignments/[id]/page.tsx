import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CalendarClockIcon, ListChecksIcon } from "lucide-react";

import { StatusPill } from "@/components/common";
import { AnswerReview } from "@/components/portal/answer-review";
import { PortalPageHeader } from "@/components/portal/page-header";
import { AnswerAssignmentForm } from "@/components/portal/submit-assignment";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { requirePupil } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { SUBMISSION_STATUS, formatDateTime } from "@/lib/school/format";

export const metadata: Metadata = { title: "Assignment" };

export default async function PupilAssignmentPage({ params }: PageProps<"/portal/pupil/assignments/[id]">) {
  const user = await requirePupil();
  const { id } = await params;
  if (!user.studentId) notFound();

  const [data, dir] = await Promise.all([
    query(api.assignments.getForStudent, { assignmentId: id, studentId: user.studentId }),
    getDirectory(),
  ]);
  // Only assignments for the pupil's own class are returned.
  if (!data) notFound();

  const { assignment, submission, progress } = data;
  const status = SUBMISSION_STATUS[progress];
  const pct = submission?.score !== undefined ? Math.round((submission.score / Math.max(1, assignment.maxScore)) * 100) : 0;
  const types = new Set(assignment.questions.map((q) => q.type));

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/pupil/assignments" />}>
        <ArrowLeftIcon />
        My assignments
      </Button>

      <PortalPageHeader
        eyebrow={`${dir.subjectName(assignment.subjectId)} · ${assignment.topic}`}
        title={assignment.title}
        description={`Set by ${dir.teacherName(assignment.teacherId)}`}
        action={<StatusPill tone={status.tone}>{status.label}</StatusPill>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {assignment.instructions || assignment.description ? (
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">What to do</h2>
              <Separator className="my-4" />
              {assignment.instructions ? <p className="text-base leading-relaxed">{assignment.instructions}</p> : null}
              {assignment.description ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{assignment.description}</p>
              ) : null}
            </Card>
          ) : null}

          {progress === "graded" && submission ? (
            <Card className="gap-0 border-success/40 bg-success/10 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Your result</h2>
              <Separator className="my-4" />
              <p className="font-heading text-3xl font-extrabold">
                {submission.score}
                <span className="text-lg text-muted-foreground"> / {assignment.maxScore}</span>
                <span className="ml-3 text-xl">{submission.grade}</span>
              </p>
              <Progress value={pct} className="mt-4" />
              {submission.feedback ? (
                <p className="mt-5 rounded-xl bg-card p-4 text-sm leading-relaxed">
                  <span className="font-extrabold">What your teacher said · </span>
                  {submission.feedback}
                </p>
              ) : null}
            </Card>
          ) : null}

          {progress === "submitted" ? (
            <Card className="gap-0 border-info/40 bg-info/10 p-5 sm:p-6">
              <p className="text-sm font-semibold">
                Your work was submitted on {formatDateTime(submission!.submittedAt)}. Your teacher will mark it soon and
                your score will appear here.
              </p>
            </Card>
          ) : null}

          {progress === "missed" ? (
            <Card className="gap-0 border-destructive/30 bg-destructive/10 p-5 sm:p-6">
              <p className="text-sm font-semibold">
                This assignment closed on {formatDateTime(assignment.dueDate)} and was not submitted.
              </p>
            </Card>
          ) : null}

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">
              {progress === "not_started" ? "Answer the questions" : "Your answers"}
            </h2>
            <Separator className="my-4" />
            {progress === "not_started" ? (
              <AnswerAssignmentForm assignmentId={assignment.id} questions={assignment.questions} dueDate={assignment.dueDate} />
            ) : submission ? (
              <AnswerReview questions={assignment.questions} answers={submission.answers} showMarks={progress === "graded"} />
            ) : (
              <ol className="space-y-3">
                {assignment.questions.map((q, i) => (
                  <li key={q.id} className="rounded-xl border bg-card p-3 text-sm">
                    <span className="mr-1.5 font-bold text-gold-foreground dark:text-gold">{i + 1}.</span>
                    {q.prompt}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Details</h2>
            <Separator className="my-4" />
            <dl className="space-y-4 text-sm">
              <div className="flex gap-3">
                <CalendarClockIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                <div>
                  <dt className="text-xs font-bold text-muted-foreground uppercase">Due</dt>
                  <dd className="mt-0.5 font-semibold">{formatDateTime(assignment.dueDate)}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <ListChecksIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                <div>
                  <dt className="text-xs font-bold text-muted-foreground uppercase">Questions</dt>
                  <dd className="mt-0.5 font-semibold">
                    {assignment.questions.length} · {assignment.maxScore} marks in total
                  </dd>
                </div>
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground uppercase">How marking works</dt>
                <dd className="mt-0.5 leading-relaxed">
                  {types.has("text")
                    ? "Choice questions are marked straight away. Your teacher marks written answers, then you'll see your score."
                    : "Every question is marked as soon as you submit, so you'll see your score straight away."}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground uppercase">Can you submit again?</dt>
                <dd className="mt-0.5 font-semibold">No — check your answers before you submit.</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground uppercase">Files and drawings</dt>
                <dd className="mt-0.5 leading-relaxed text-muted-foreground">
                  If your teacher asked for written or drawn work on paper, hand it in at school.
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
