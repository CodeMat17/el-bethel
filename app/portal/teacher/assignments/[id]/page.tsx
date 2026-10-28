import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { StatCard, StatusPill } from "@/components/common";
import { AssignmentActions } from "@/components/portal/assignment-actions";
import { GradeDialog } from "@/components/portal/grade-dialog";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import type { StaffAssignment } from "@/lib/school/api-types";
import { requireTeacher } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { studentName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { SUBMISSION_STATUS, avatarTone, formatDateTime, initials } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Assignment" };

const TYPE_LABEL = { text: "Written", single: "One answer", multiple: "Several answers" } as const;

type RosterRow = StaffAssignment["roster"][number];

export default async function TeacherAssignmentPage({ params }: PageProps<"/portal/teacher/assignments/[id]">) {
  await requireTeacher();
  const { id } = await params;
  // Convex only returns the assignment to a teacher of the class (or an administrator).
  const [data, dir] = await Promise.all([
    query(api.assignments.getForStaff, { assignmentId: id }),
    getDirectory(),
  ]);
  if (!data) notFound();
  const { assignment, roster, stats } = data;

  const toMark = roster.filter((r) => r.progress === "submitted");
  const graded = roster.filter((r) => r.progress === "graded");
  const missing = roster.filter((r) => r.progress === "not_started" || r.progress === "missed");
  const scores = graded.map((r) => r.submission?.score ?? 0);
  const average = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
  const dueInFuture = new Date(assignment.dueDate) > new Date();

  function Row({ row }: { row: RosterRow }) {
    const { student, submission, progress } = row;
    const status = SUBMISSION_STATUS[progress];
    const name = studentName(student);
    return (
      <li>
        <Card className="gap-0 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar className="size-10 shrink-0">
              {student.photo ? <AvatarImage src={student.photo.url} alt="" /> : null}
              <AvatarFallback className={cn("text-xs font-bold", avatarTone(student.avatarSeed))}>
                {initials(student.firstName, student.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {submission ? `Submitted ${formatDateTime(submission.submittedAt)}` : "Not submitted"}
              </p>
            </div>
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            {submission?.score !== undefined && submission.status === "graded" ? (
              <Badge className="font-bold">
                {submission.score}/{assignment.maxScore}
              </Badge>
            ) : null}
            {submission ? (
              <GradeDialog
                submissionId={submission.id}
                studentName={name}
                assignmentTitle={assignment.title}
                questions={assignment.questions}
                answers={submission.answers}
                currentFeedback={submission.feedback}
                graded={submission.status === "graded"}
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
    { value: "graded", label: `Marked (${graded.length})`, items: graded, empty: "Nothing has been marked yet." },
    { value: "missing", label: `Not submitted (${missing.length})`, items: missing, empty: "Every pupil has submitted." },
    { value: "all", label: `All (${roster.length})`, items: roster, empty: "This class has no pupils." },
  ];

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/teacher/assignments" />}>
        <ArrowLeftIcon />
        All assignments
      </Button>

      <PortalPageHeader
        eyebrow={`${dir.className(assignment.classId)} · ${dir.subjectName(assignment.subjectId)}`}
        title={assignment.title}
        description={`${assignment.topic} · opens ${formatDateTime(assignment.startDate)} · due ${formatDateTime(assignment.dueDate)} · ${assignment.maxScore} marks`}
        action={<StatusPill tone={assignment.status === "published" ? "success" : "neutral"}>{assignment.status}</StatusPill>}
      />

      <Card className="mb-6 gap-0 p-5">
        <AssignmentActions
          assignmentId={assignment.id}
          status={assignment.status}
          hasSubmissions={stats.submitted > 0}
          dueInFuture={dueInFuture}
        />
        {assignment.instructions ? (
          <>
            <Separator className="my-4" />
            <p className="text-sm leading-relaxed">{assignment.instructions}</p>
          </>
        ) : null}
        <Separator className="my-4" />
        <ol className="space-y-2">
          {assignment.questions.map((q, i) => (
            <li key={q.id} className="flex items-start gap-3 text-sm">
              <span className="font-bold text-gold-foreground dark:text-gold">{i + 1}.</span>
              <span className="min-w-0 flex-1">
                {q.prompt}
                {q.type !== "text" ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {q.options.map((o, oi) => (q.correct.includes(oi) ? `✓ ${o}` : o)).join(" · ")}
                  </span>
                ) : null}
              </span>
              <Badge variant="secondary" className="shrink-0 font-bold">{TYPE_LABEL[q.type]}</Badge>
              <span className="shrink-0 text-xs font-bold text-muted-foreground">{q.points} marks</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Pupils" value={stats.students} icon="Backpack" tone="neutral" />
        <StatCard label="Submitted" value={stats.submitted} icon="CircleCheck" tone="info" />
        <StatCard label="Marked" value={stats.graded} icon="ClipboardCheck" tone="success" />
        <StatCard label="To mark" value={stats.pendingGrading} icon="PenSquare" tone={stats.pendingGrading > 0 ? "warning" : "success"} />
        <StatCard label="Average score" value={graded.length ? `${average}/${assignment.maxScore}` : "—"} icon="ChartColumn" tone="gold" />
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
              <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{tab.empty}</p>
            ) : (
              <ul className="space-y-3">
                {tab.items.map((row) => (
                  <Row key={row.student.id} row={row} />
                ))}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
