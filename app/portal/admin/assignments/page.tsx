import type { Metadata } from "next";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { HeroFigure } from "@/components/portal/charts";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { requireAdmin } from "@/lib/school/auth";
import {
  classDisplayName,
  getAssignmentStats,
  getClasses,
  getSubject,
  getSubjects,
  getSubmissionRate,
  paginate,
  teacherNameById,
} from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";
import { DEMO_TODAY } from "@/lib/school/seed";

export const metadata: Metadata = { title: "Assignments" };

export default async function AdminAssignmentsPage({ searchParams }: PageProps<"/portal/admin/assignments">) {
  await requireAdmin();
  const params = await searchParams;

  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const classId = typeof params.class === "string" ? params.class : "all";
  const subjectId = typeof params.subject === "string" ? params.subject : "all";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const db = getDb();
  const filtered = db.assignments
    .filter((assignment) => {
      if (classId !== "all" && assignment.classId !== classId) return false;
      if (subjectId !== "all" && assignment.subjectId !== subjectId) return false;
      if (!q) return true;
      return `${assignment.title} ${assignment.topic}`.toLowerCase().includes(q);
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const result = paginate(filtered, page, 10);
  const submissions = getSubmissionRate();
  const openNow = db.assignments.filter(
    (a) => a.status === "published" && new Date(a.dueDate) >= DEMO_TODAY,
  ).length;

  return (
    <>
      <PortalPageHeader
        title="Assignments"
        description="Every assignment set across the school, with submission and grading progress."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assignments" value={db.assignments.length} icon="ClipboardList" tone="info" />
        <StatCard label="Currently open" value={openNow} icon="Clock" tone="gold" />
        <StatCard
          label="Awaiting grading"
          value={submissions.pending}
          icon="PenSquare"
          tone={submissions.pending > 0 ? "warning" : "success"}
        />
        <StatCard label="Late submissions" value={submissions.late} icon="CalendarX" tone={submissions.late > 0 ? "danger" : "success"} />
      </div>

      <Card className="mb-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Engagement across the school</h2>
        <Separator className="my-5" />
        <div className="grid gap-6 sm:grid-cols-3">
          <HeroFigure
            value={`${submissions.submissionRate}%`}
            label="Submission rate"
            progress={submissions.submissionRate}
            detail={`${submissions.submitted} of ${submissions.total} expected submissions`}
          />
          <HeroFigure
            value={String(submissions.graded)}
            label="Graded submissions"
            detail={`${submissions.pending} still awaiting a mark`}
          />
          <HeroFigure
            value={String(submissions.averageScore)}
            label="Average score awarded"
            detail="Across every graded submission this term"
          />
        </div>
      </Card>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by title or topic"
          filters={[
            { key: "class", label: "Classes", options: getClasses().map((c) => ({ value: c.id, label: c.name })) },
            { key: "subject", label: "Subjects", options: getSubjects().map((s) => ({ value: s.id, label: s.name })) },
          ]}
        />
      </Card>

      {result.items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="ClipboardList"
          title="No assignments match your filters"
          description="Try a different title, class or subject."
        />
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {result.items.map((assignment) => {
              const stats = getAssignmentStats(assignment.id);
              const pct = stats.students ? Math.round((stats.submitted / stats.students) * 100) : 0;
              return (
                <li key={assignment.id}>
                  <Card className="gap-0 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-heading text-base font-extrabold">{assignment.title}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {classDisplayName(assignment.classId)} · {getSubject(assignment.subjectId)?.name} ·{" "}
                          {teacherNameById(assignment.teacherId)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Published {formatDate(assignment.publishedAt)} · due {formatDate(assignment.dueDate)}
                        </p>
                      </div>
                      <StatusPill
                        tone={
                          assignment.status === "published"
                            ? stats.pendingGrading > 0
                              ? "warning"
                              : "success"
                            : "neutral"
                        }
                      >
                        {assignment.status === "published"
                          ? stats.pendingGrading > 0
                            ? `${stats.pendingGrading} to mark`
                            : "All marked"
                          : assignment.status}
                      </StatusPill>
                    </div>

                    <Progress value={pct} className="mt-4" />

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      {[
                        ["Pupils", stats.students],
                        ["Submitted", stats.submitted],
                        ["Graded", stats.graded],
                        ["Not submitted", stats.notSubmitted],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="rounded-lg bg-muted/70 p-2 text-center">
                          <p className="text-[0.6rem] font-bold text-muted-foreground uppercase">{label}</p>
                          <p className="mt-0.5 text-sm font-extrabold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          <Pager
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={result.pageSize}
            basePath="/portal/admin/assignments"
            params={{ q, class: classId, subject: subjectId }}
          />
        </>
      )}
    </>
  );
}
