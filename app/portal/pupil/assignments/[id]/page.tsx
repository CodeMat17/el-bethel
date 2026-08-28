import Link from "next/link";
import type { Metadata } from "next";
import { forbidden, notFound } from "next/navigation";
import { ArrowLeftIcon, CalendarClockIcon, FileIcon, PaperclipIcon } from "lucide-react";

import { StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { SubmitAssignmentForm } from "@/components/portal/submit-assignment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { requirePupil } from "@/lib/school/auth";
import {
  getAssignment,
  getStudent,
  getSubject,
  getSubmission,
  teacherNameById,
} from "@/lib/school/data";
import { SUBMISSION_STATUS, fileSize, formatDateTime } from "@/lib/school/format";
import { DEMO_TODAY } from "@/lib/school/seed";

export const metadata: Metadata = { title: "Assignment" };

export default async function PupilAssignmentPage({ params }: PageProps<"/portal/pupil/assignments/[id]">) {
  const user = await requirePupil();
  const { id } = await params;
  const assignment = getAssignment(id);
  if (!assignment) notFound();

  const student = user.studentId ? getStudent(user.studentId) : null;
  // A pupil may only open an assignment set for their own class.
  if (!student || student.classId !== assignment.classId) forbidden();

  const submission = getSubmission(assignment.id, student.id);
  const subject = getSubject(assignment.subjectId);
  const status = SUBMISSION_STATUS[submission?.status ?? "not_started"];
  const overdue = new Date(assignment.dueDate) < DEMO_TODAY;
  const pct = submission?.score ? Math.round((submission.score / assignment.maxScore) * 100) : 0;
  const canSubmit =
    !submission ||
    ["not_started", "in_progress", "resubmission_required"].includes(submission.status) ||
    assignment.allowResubmission;

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/pupil/assignments" />}>
        <ArrowLeftIcon />
        My assignments
      </Button>

      <PortalPageHeader
        eyebrow={`${subject?.name} · ${assignment.topic}`}
        title={assignment.title}
        description={`Set by ${teacherNameById(assignment.teacherId)}`}
        action={<StatusPill tone={overdue && canSubmit ? "danger" : status.tone}>{status.label}</StatusPill>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">What to do</h2>
            <Separator className="my-4" />
            <p className="text-base leading-relaxed">{assignment.instructions}</p>
            {assignment.description ? (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{assignment.description}</p>
            ) : null}

            {assignment.attachments.length > 0 ? (
              <>
                <Separator className="my-5" />
                <p className="flex items-center gap-2 text-sm font-bold">
                  <PaperclipIcon className="size-4" />
                  Resources from your teacher
                </p>
                <ul className="mt-3 space-y-2">
                  {assignment.attachments.map((attachment) => (
                    <li key={attachment.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{attachment.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{fileSize(attachment.sizeBytes)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </Card>

          {submission?.status === "graded" ? (
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

          {submission?.status === "resubmission_required" ? (
            <Card className="gap-0 border-destructive/30 bg-destructive/10 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Please try again</h2>
              <Separator className="my-4" />
              <p className="text-sm leading-relaxed">{submission.feedback}</p>
            </Card>
          ) : null}

          {canSubmit ? (
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Send your work</h2>
              <Separator className="my-4" />
              <SubmitAssignmentForm
                assignmentId={assignment.id}
                allowResubmission={assignment.allowResubmission}
                alreadySubmitted={Boolean(submission?.submittedAt)}
                defaultText={submission?.textAnswer ?? ""}
              />
            </Card>
          ) : null}
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
              <div>
                <dt className="text-xs font-bold text-muted-foreground uppercase">Maximum score</dt>
                <dd className="mt-0.5 font-semibold">{assignment.maxScore} marks</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground uppercase">How to send it</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {assignment.submissionTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="font-bold capitalize">{type}</Badge>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground uppercase">Can you send it again?</dt>
                <dd className="mt-0.5 font-semibold">
                  {assignment.allowResubmission ? "Yes, until it is marked" : "No — check before you submit"}
                </dd>
              </div>
            </dl>
          </Card>

          {submission?.submittedAt ? (
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Your submission</h2>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground">
                Sent {formatDateTime(submission.submittedAt)} · version {submission.version}
              </p>
              {submission.textAnswer ? (
                <p className="mt-3 rounded-xl bg-muted/70 p-3.5 text-sm leading-relaxed">
                  {submission.textAnswer}
                </p>
              ) : null}
              {submission.files.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {submission.files.map((file) => (
                    <li key={file.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{file.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{fileSize(file.sizeBytes)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
