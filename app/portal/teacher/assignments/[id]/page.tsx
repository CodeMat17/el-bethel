import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { StatCard, StatusPill } from "@/components/common";
import { GradeDialog } from "@/components/portal/grade-dialog";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assertClassAccess, requireTeacher } from "@/lib/school/auth";
import {
  classDisplayName,
  getAssignment,
  getAssignmentStats,
  getStudentsByClass,
  getSubject,
  getSubmission,
  studentName,
} from "@/lib/school/data";
import { SUBMISSION_STATUS, fileSize, formatDate, formatDateTime, initials, avatarTone } from "@/lib/school/format";
import { cn } from "@/lib/utils";
import type { Student, Submission } from "@/lib/school/types";

export const metadata: Metadata = { title: "Assignment" };

export default async function TeacherAssignmentPage({
  params,
}: PageProps<"/portal/teacher/assignments/[id]">) {
  const user = await requireTeacher();
  const { id } = await params;
  const assignment = getAssignment(id);
  if (!assignment) notFound();
  // Authorisation: only a teacher of this class may open the submission list.
  assertClassAccess(user, assignment.classId);
  const asg = assignment;

  const stats = getAssignmentStats(assignment.id);
  const roster = getStudentsByClass(assignment.classId);

  const rows: { student: Student; submission: Submission | null }[] = roster.map((student) => ({
    student,
    submission: getSubmission(assignment.id, student.id),
  }));

  const toMark = rows.filter((r) => ["submitted", "late", "grading"].includes(r.submission?.status ?? ""));
  const graded = rows.filter((r) => ["graded", "returned"].includes(r.submission?.status ?? ""));
  const missing = rows.filter((r) => !r.submission || ["not_started", "in_progress"].includes(r.submission.status));

  const scores = graded.map((r) => r.submission?.score ?? 0);
  const average = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

  function Row({ student, submission }: { student: Student; submission: Submission | null }) {
    const status = SUBMISSION_STATUS[submission?.status ?? "not_started"];
    return (
      <li>
        <Card className="gap-0 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar className="size-10 shrink-0">
              <AvatarFallback className={cn("text-xs font-bold", avatarTone(student.avatarSeed))}>
                {initials(student.firstName, student.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{studentName(student)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {submission?.submittedAt
                  ? `Submitted ${formatDateTime(submission.submittedAt)}${submission.version > 1 ? ` · version ${submission.version}` : ""}`
                  : "Not submitted"}
              </p>
            </div>
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            {submission?.score !== undefined ? (
              <Badge className="font-bold">
                {submission.score}/{asg.maxScore}
              </Badge>
            ) : null}
            {submission && submission.submittedAt ? (
              <GradeDialog
                submissionId={submission.id}
                studentName={studentName(student)}
                assignmentTitle={asg.title}
                maxScore={asg.maxScore}
                currentScore={submission.score}
                currentFeedback={submission.feedback}
                textAnswer={submission.textAnswer}
                files={submission.files.map((f) => ({ id: f.id, name: f.name, size: fileSize(f.sizeBytes) }))}
              />
            ) : null}
          </div>
          {submission?.feedback ? (
            <p className="mt-3 rounded-lg bg-muted/70 p-3 text-xs leading-relaxed">
              <span className="font-bold">Feedback · </span>
              {submission.feedback}
            </p>
          ) : null}
        </Card>
      </li>
    );
  }

  const tabs = [
    { value: "toMark", label: `To mark (${toMark.length})`, items: toMark, empty: "Nothing is waiting to be marked." },
    { value: "graded", label: `Graded (${graded.length})`, items: graded, empty: "Nothing has been graded yet." },
    { value: "missing", label: `Not submitted (${missing.length})`, items: missing, empty: "Every pupil has submitted." },
    { value: "all", label: `All (${rows.length})`, items: rows, empty: "This class has no pupils." },
  ];

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/teacher/assignments" />}>
        <ArrowLeftIcon />
        All assignments
      </Button>

      <PortalPageHeader
        eyebrow={`${classDisplayName(assignment.classId)} · ${getSubject(assignment.subjectId)?.name}`}
        title={assignment.title}
        description={`${assignment.topic} · due ${formatDate(assignment.dueDate)} · out of ${assignment.maxScore}`}
      />

      <Card className="mb-6 gap-0 p-5">
        <p className="text-sm leading-relaxed">{assignment.instructions}</p>
        <Separator className="my-4" />
        <div className="flex flex-wrap gap-1.5">
          {assignment.submissionTypes.map((type) => (
            <Badge key={type} variant="secondary" className="font-bold capitalize">{type}</Badge>
          ))}
          <Badge variant="outline" className="font-bold">
            {assignment.allowResubmission ? "Resubmission allowed" : "One submission only"}
          </Badge>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Pupils" value={stats.students} icon="Backpack" tone="neutral" />
        <StatCard label="Submitted" value={stats.submitted} icon="CircleCheck" tone="info" />
        <StatCard label="Graded" value={stats.graded} icon="ClipboardCheck" tone="success" />
        <StatCard label="To mark" value={stats.pendingGrading} icon="PenSquare" tone={stats.pendingGrading > 0 ? "warning" : "success"} />
        <StatCard
          label="Average score"
          value={graded.length ? `${average}/${assignment.maxScore}` : "—"}
          icon="ChartColumn"
          tone="gold"
        />
      </div>

      <Card className="mt-6 gap-0 p-5">
        <div className="flex items-baseline justify-between gap-3 text-sm font-bold">
          <span>Submission rate</span>
          <span className="tabular-nums text-muted-foreground">
            {stats.students ? Math.round((stats.submitted / stats.students) * 100) : 0}%
          </span>
        </div>
        <Progress value={stats.students ? (stats.submitted / stats.students) * 100 : 0} className="mt-3" />
      </Card>

      <Tabs defaultValue="toMark" className="mt-6">
        <TabsList className="h-auto w-full overflow-x-auto sm:w-fit">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs font-bold whitespace-nowrap sm:text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-5">
            {tab.items.length === 0 ? (
              <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                {tab.empty}
              </p>
            ) : (
              <ul className="space-y-3">
                {tab.items.map((row) => (
                  <Row key={row.student.id} student={row.student} submission={row.submission} />
                ))}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
