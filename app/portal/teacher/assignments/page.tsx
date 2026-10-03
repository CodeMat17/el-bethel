import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, PlusIcon } from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { requireTeacher } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory, type Directory } from "@/lib/school/directory";
import { formatDateTime } from "@/lib/school/format";
import type { Assignment } from "@/lib/school/types";

interface Stats {
  students: number;
  submitted: number;
  notSubmitted: number;
  graded: number;
  pendingGrading: number;
}

export const metadata: Metadata = { title: "Assignments" };

function AssignmentRow({ assignment, stats, dir }: { assignment: Assignment; stats: Stats; dir: Directory }) {
  const pct = stats.students ? Math.round((stats.submitted / stats.students) * 100) : 0;
  const closed = new Date(assignment.dueDate) < new Date();

  return (
    <Link href={`/portal/teacher/assignments/${assignment.id}`} className="block">
      <Card className="gap-0 p-5 transition-colors hover:border-gold/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-bold">{dir.subjectName(assignment.subjectId)}</Badge>
              <Badge variant="outline" className="font-bold">{dir.className(assignment.classId)}</Badge>
              {assignment.status !== "published" ? <StatusPill tone="neutral">{assignment.status}</StatusPill> : null}
            </div>
            <h3 className="mt-2 font-heading text-base font-extrabold">{assignment.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {assignment.topic} · {assignment.questions.length} questions · due {formatDateTime(assignment.dueDate)}
              {closed ? " · deadline passed" : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {stats.pendingGrading > 0 ? (
              <StatusPill tone="warning">{stats.pendingGrading} to mark</StatusPill>
            ) : (
              <StatusPill tone="success">All marked</StatusPill>
            )}
            <ArrowRightIcon className="size-4 text-muted-foreground" />
          </div>
        </div>

        <Progress value={pct} className="mt-4" />
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {[
            ["Pupils", stats.students],
            ["Submitted", stats.submitted],
            ["Marked", stats.graded],
            ["Not submitted", stats.notSubmitted],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg bg-muted/70 p-2 text-center">
              <p className="text-[0.6rem] font-bold text-muted-foreground uppercase">{label}</p>
              <p className="mt-0.5 text-sm font-extrabold">{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </Link>
  );
}

export default async function TeacherAssignmentsPage() {
  const user = await requireTeacher();
  if (!user.teacherId) {
    return <EmptyState icon="GraduationCap" title="No teaching record" description="Contact the school administrator." />;
  }

  const [all, dir] = await Promise.all([query(api.assignments.forTeacher, {}), getDirectory()]);
  const now = new Date();
  const open = all.filter((a) => a.assignment.status === "published" && new Date(a.assignment.dueDate) >= now);
  const closed = all.filter((a) => a.assignment.status !== "draft" && (a.assignment.status !== "published" || new Date(a.assignment.dueDate) < now));
  const drafts = all.filter((a) => a.assignment.status === "draft");
  const needsMarking = all.filter((a) => a.stats.pendingGrading > 0);

  const tabs = [
    { value: "open", label: `Open (${open.length})`, items: open, empty: "No assignments are currently open." },
    { value: "marking", label: `To mark (${needsMarking.length})`, items: needsMarking, empty: "Nothing is waiting to be marked." },
    { value: "closed", label: `Closed (${closed.length})`, items: closed, empty: "No assignments have closed yet." },
    { value: "drafts", label: `Drafts (${drafts.length})`, items: drafts, empty: "You have no drafts." },
  ];

  return (
    <>
      <PortalPageHeader
        title="Assignments"
        description="Everything you have set, with submission and marking progress for each class."
        action={
          <Button size="lg" className="font-bold" render={<Link href="/portal/teacher/assignments/create" />}>
            <PlusIcon />
            New assignment
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total set" value={all.length} icon="ClipboardList" tone="info" />
        <StatCard label="Currently open" value={open.length} icon="Clock" tone="gold" />
        <StatCard
          label="Awaiting marking"
          value={needsMarking.length}
          icon="PenSquare"
          tone={needsMarking.length > 0 ? "warning" : "success"}
        />
        <StatCard label="Drafts" value={drafts.length} icon="ClipboardPen" tone="neutral" />
      </div>

      <Tabs defaultValue="open">
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
                  <AssignmentRow key={item.assignment.id} assignment={item.assignment} stats={item.stats} dir={dir} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
