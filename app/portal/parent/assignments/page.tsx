import type { Metadata } from "next";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireParent } from "@/lib/school/auth";
import { api } from "@/convex/_generated/api";
import { studentName } from "@/lib/school/data";
import { getMyChildren, resolveActiveChild } from "@/lib/school/parent";
import { getDirectory, type Directory } from "@/lib/school/directory";
import type { FamilyAssignment } from "@/lib/school/api-types";
import { AnswerReview } from "@/components/portal/answer-review";
import { query } from "@/lib/school/convex";
import { SUBMISSION_STATUS, formatDate, formatDateTime } from "@/lib/school/format";

export const metadata: Metadata = { title: "Assignments" };

function AssignmentCard({ item, dir }: { item: FamilyAssignment; dir: Directory }) {
  const { assignment, submission, progress } = item;
  const status = SUBMISSION_STATUS[progress];
  const pct = submission?.score !== undefined ? Math.round((submission.score / Math.max(1, assignment.maxScore)) * 100) : 0;

  return (
    <Card className="gap-0 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-bold">{dir.subjectName(assignment.subjectId)}</Badge>
            <span className="text-xs text-muted-foreground">{assignment.topic}</span>
          </div>
          <h3 className="mt-2 font-heading text-base font-extrabold">{assignment.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Set by {dir.teacherName(assignment.teacherId)} · due {formatDateTime(assignment.dueDate)} · {assignment.questions.length} questions
          </p>
        </div>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </div>

      {assignment.instructions ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{assignment.instructions}</p> : null}

      {progress === "graded" && submission ? (
        <>
          <Separator className="my-4" />
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">Score</p>
            <p className="font-heading text-lg font-extrabold tabular-nums">
              {submission.score}/{assignment.maxScore}
              <span className="ml-2 text-sm font-bold text-muted-foreground">{submission.grade}</span>
            </p>
          </div>
          <Progress value={pct} className="mt-3" />
          {submission.feedback ? (
            <p className="mt-4 rounded-xl bg-muted/70 p-3.5 text-sm leading-relaxed">
              <span className="font-extrabold">Teacher feedback · </span>
              {submission.feedback}
            </p>
          ) : null}
          {submission.gradedAt ? <p className="mt-2 text-xs text-muted-foreground">Marked {formatDate(submission.gradedAt)}</p> : null}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-bold">See the answers</summary>
            <div className="mt-3">
              <AnswerReview questions={assignment.questions} answers={submission.answers} showMarks />
            </div>
          </details>
        </>
      ) : null}

      {submission ? (
        <p className="mt-3 text-xs text-muted-foreground">Submitted {formatDateTime(submission.submittedAt)}</p>
      ) : null}
    </Card>
  );
}

export default async function ParentAssignmentsPage({ searchParams }: PageProps<"/portal/parent/assignments">) {
  await requireParent();
  const dir = await getDirectory();
  const params = await searchParams;
  const child = await resolveActiveChild(typeof params.child === "string" ? params.child : undefined);
  const myChildren = await getMyChildren();

  if (!child) {
    return (
      <EmptyState
        icon="Users"
        title="No children are linked to your account"
        description="Contact the school office if you believe this is a mistake."
      />
    );
  }

  const all = await query(api.assignments.forStudent, { studentId: child.id });
  const pending = all.filter((a) => a.progress === "not_started");
  const submitted = all.filter((a) => a.progress === "submitted");
  const graded = all.filter((a) => a.progress === "graded");

  const averagePct = graded.length
    ? Math.round(
        (graded.reduce((sum, a) => sum + (a.submission?.score ?? 0) / Math.max(1, a.assignment.maxScore), 0) /
          graded.length) *
          100,
      )
    : 0;

  const tabs: { value: string; label: string; items: FamilyAssignment[]; empty: string }[] = [
    { value: "all", label: `All (${all.length})`, items: all, empty: "No assignments have been posted for this class yet." },
    { value: "pending", label: `To do (${pending.length})`, items: pending, empty: "You're all caught up. Nothing is outstanding." },
    { value: "submitted", label: `Awaiting marking (${submitted.length})`, items: submitted, empty: "Nothing is currently awaiting marking." },
    { value: "graded", label: `Marked (${graded.length})`, items: graded, empty: "No assignments have been marked yet." },
  ];

  return (
    <>
      <PortalPageHeader
        eyebrow={`${studentName(child)} · ${dir.className(child.classId)}`}
        title="Assignments"
        description="Everything set for this class, with submission status, scores and teacher feedback."
        action={
          <ChildSwitcher
            activeId={child.id}
            options={myChildren.map((c) => ({
              id: c.id,
              name: studentName(c),
              className: dir.className(c.classId),
              avatarSeed: c.avatarSeed,
            }))}
          />
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Set this term" value={all.length} icon="ClipboardList" tone="info" />
        <StatCard
          label="Still to do"
          value={pending.length}
          icon="PenLine"
          tone={pending.length > 0 ? "warning" : "success"}
        />
        <StatCard label="Awaiting grading" value={submitted.length} icon="Clock" tone="neutral" />
        <StatCard
          label="Average score"
          value={graded.length ? `${averagePct}%` : "—"}
          hint={graded.length ? `Across ${graded.length} graded assignments` : "No graded work yet"}
          icon="Trophy"
          tone={averagePct >= 70 ? "success" : "warning"}
        />
      </div>

      <Tabs defaultValue="all">
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
              <EmptyState icon="ClipboardList" title="Nothing here" description={tab.empty} />
            ) : (
              <div className="grid gap-4">
                {tab.items.map((item) => (
                  <AssignmentCard key={item.assignment.id} item={item} dir={dir} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
