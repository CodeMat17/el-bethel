import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, PartyPopperIcon } from "lucide-react";

import { EmptyState, StatusPill } from "@/components/common";
import { Icon } from "@/components/icon";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import type { FamilyAssignment } from "@/lib/school/api-types";
import { requirePupil } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory, type Directory } from "@/lib/school/directory";
import { SUBMISSION_STATUS, formatDateTime } from "@/lib/school/format";

export const metadata: Metadata = { title: "My assignments" };

function Row({ item, dir }: { item: FamilyAssignment; dir: Directory }) {
  const { assignment, submission, progress } = item;
  const status = SUBMISSION_STATUS[progress];
  const pct = submission?.score !== undefined ? Math.round((submission.score / Math.max(1, assignment.maxScore)) * 100) : 0;

  return (
    <Link href={`/portal/pupil/assignments/${assignment.id}`} className="block">
      <Card className="gap-0 p-4 transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md sm:p-5">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-foreground dark:text-gold">
            <Icon name="ClipboardList" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-bold">{dir.subjectName(assignment.subjectId)}</Badge>
              <span className="text-xs text-muted-foreground">
                due {formatDateTime(assignment.dueDate)} · {assignment.questions.length}{" "}
                {assignment.questions.length === 1 ? "question" : "questions"}
              </span>
            </div>
            <h3 className="mt-2 text-base font-extrabold">{assignment.title}</h3>
            {progress === "graded" && submission ? (
              <div className="mt-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold">
                    You scored {submission.score} out of {assignment.maxScore}
                  </span>
                  <span className="font-extrabold">{submission.grade}</span>
                </div>
                <Progress value={pct} className="mt-2" />
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            <ArrowRightIcon className="size-4 text-muted-foreground" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default async function PupilAssignmentsPage() {
  const user = await requirePupil();
  if (!user.studentId) {
    return <EmptyState icon="Backpack" title="No school record" description="Please ask your class teacher for help." />;
  }

  const [all, dir] = await Promise.all([
    query(api.assignments.forStudent, { studentId: user.studentId }),
    getDirectory(),
  ]);
  const todo = all.filter((a) => a.progress === "not_started");
  const done = all.filter((a) => a.progress === "submitted");
  const marked = all.filter((a) => a.progress === "graded");
  const missed = all.filter((a) => a.progress === "missed");

  const tabs = [
    { value: "todo", label: `To do (${todo.length})`, items: todo, empty: "You're all caught up. There is nothing to do right now." },
    { value: "done", label: `Sent (${done.length})`, items: done, empty: "Nothing is waiting to be marked right now." },
    { value: "marked", label: `Marked (${marked.length})`, items: marked, empty: "Nothing has been marked yet." },
    { value: "missed", label: `Missed (${missed.length})`, items: missed, empty: "You haven't missed anything. Well done!" },
  ];

  return (
    <>
      <PortalPageHeader
        title="My assignments"
        description="Everything your teachers have set. Tap one to answer the questions and send your work."
      />

      <Tabs defaultValue="todo">
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
              tab.value === "todo" ? (
                <Card className="gap-0 border-gold/30 bg-gold/8 p-10 text-center">
                  <PartyPopperIcon className="mx-auto size-12 text-gold" />
                  <p className="mt-4 font-heading text-xl font-extrabold">You&apos;re all caught up!</p>
                  <p className="mt-2 text-sm text-muted-foreground">{tab.empty}</p>
                </Card>
              ) : (
                <EmptyState icon="ClipboardList" title="Nothing here yet" description={tab.empty} />
              )
            ) : (
              <div className="grid gap-3">
                {tab.items.map((item) => (
                  <Row key={item.assignment.id} item={item} dir={dir} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
