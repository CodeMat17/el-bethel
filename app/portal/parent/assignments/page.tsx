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
import {
  childrenForSession,
  classDisplayName,
  getStudentAssignments,
  resolveActiveChild,
  studentName,
} from "@/lib/school/data";
import { SUBMISSION_STATUS, formatDate, formatDateTime } from "@/lib/school/format";
import { DEMO_TODAY } from "@/lib/school/seed";
import type { AssignmentWithSubmission } from "@/lib/school/data";

export const metadata: Metadata = { title: "Assignments" };

function AssignmentCard({ item }: { item: AssignmentWithSubmission }) {
  const { assignment, submission, subject, teacherLabel } = item;
  const status = SUBMISSION_STATUS[submission?.status ?? "not_started"];
  const overdue =
    new Date(assignment.dueDate) < DEMO_TODAY &&
    ["not_started", "in_progress"].includes(submission?.status ?? "not_started");
  const pct = submission?.score ? Math.round((submission.score / assignment.maxScore) * 100) : 0;

  return (
    <Card className="gap-0 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-bold">{subject?.name}</Badge>
            <span className="text-xs text-muted-foreground">{assignment.topic}</span>
          </div>
          <h3 className="mt-2 font-heading text-base font-extrabold">{assignment.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Set by {teacherLabel} · due {formatDateTime(assignment.dueDate)}
          </p>
        </div>
        <StatusPill tone={overdue ? "danger" : status.tone}>
          {overdue ? "Overdue" : status.label}
        </StatusPill>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{assignment.instructions}</p>

      {submission?.status === "graded" ? (
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
          {submission.gradedAt ? (
            <p className="mt-2 text-xs text-muted-foreground">Graded {formatDate(submission.gradedAt)}</p>
          ) : null}
        </>
      ) : null}

      {submission?.status === "resubmission_required" && submission.feedback ? (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm leading-relaxed">
          <span className="font-extrabold">Resubmission requested · </span>
          {submission.feedback}
        </p>
      ) : null}

      {submission?.submittedAt ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Submitted {formatDateTime(submission.submittedAt)}
          {submission.files.length > 0 ? ` · ${submission.files.length} file(s)` : ""}
        </p>
      ) : null}
    </Card>
  );
}

export default async function ParentAssignmentsPage({ searchParams }: PageProps<"/portal/parent/assignments">) {
  const user = await requireParent();
  const params = await searchParams;
  const child = resolveActiveChild(user, typeof params.child === "string" ? params.child : undefined);
  const myChildren = childrenForSession(user);

  if (!child) {
    return (
      <EmptyState
        icon="Users"
        title="No children are linked to your account"
        description="Contact the school office if you believe this is a mistake."
      />
    );
  }

  const all = getStudentAssignments(child.id);
  const pending = all.filter((a) =>
    ["not_started", "in_progress", "resubmission_required"].includes(a.submission?.status ?? "not_started"),
  );
  const submitted = all.filter((a) =>
    ["submitted", "late", "grading"].includes(a.submission?.status ?? ""),
  );
  const graded = all.filter((a) => ["graded", "returned"].includes(a.submission?.status ?? ""));

  const averagePct = graded.length
    ? Math.round(
        (graded.reduce((sum, a) => sum + (a.submission?.score ?? 0) / a.assignment.maxScore, 0) /
          graded.length) *
          100,
      )
    : 0;

  const tabs: { value: string; label: string; items: AssignmentWithSubmission[]; empty: string }[] = [
    { value: "all", label: `All (${all.length})`, items: all, empty: "No assignments have been posted for this class yet." },
    { value: "pending", label: `To do (${pending.length})`, items: pending, empty: "You're all caught up. Nothing is outstanding." },
    { value: "submitted", label: `Submitted (${submitted.length})`, items: submitted, empty: "Nothing is currently awaiting grading." },
    { value: "graded", label: `Graded (${graded.length})`, items: graded, empty: "No assignments have been graded yet." },
  ];

  return (
    <>
      <PortalPageHeader
        eyebrow={`${studentName(child)} · ${classDisplayName(child.classId)}`}
        title="Assignments"
        description="Everything set for this class, with submission status, scores and teacher feedback."
        action={
          <ChildSwitcher
            activeId={child.id}
            options={myChildren.map((c) => ({
              id: c.id,
              name: studentName(c),
              className: classDisplayName(c.classId),
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
                  <AssignmentCard key={item.assignment.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
