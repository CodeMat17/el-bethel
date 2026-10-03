import type { Metadata } from "next";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { pageParam, param } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "Assignments" };

export default async function AdminAssignmentsPage({ searchParams }: PageProps<"/portal/admin/assignments">) {
  await requireAdmin();
  const params = await searchParams;

  const q = param(params.q).trim();
  const classId = param(params.class, "all");
  const subjectId = param(params.subject, "all");
  const status = param(params.status, "all");
  const page = pageParam(params.page);

  const [result, dir] = await Promise.all([
    query(api.assignments.listAll, { search: q, classId, subjectId, status, page, pageSize: 10 }),
    getDirectory(),
  ]);
  const totals = result.totals;

  return (
    <>
      <PortalPageHeader
        title="Assignments"
        description="Every assignment set across the school, with submission and marking progress. Open one to see each pupil's answers."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assignments" value={totals.assignments} icon="ClipboardList" tone="info" />
        <StatCard label="Submissions" value={totals.submissions} icon="Send" tone="gold" />
        <StatCard label="Marked" value={totals.graded} icon="ClipboardCheck" tone="success" />
        <StatCard label="Awaiting marking" value={totals.pending} icon="PenSquare" tone={totals.pending > 0 ? "warning" : "success"} />
      </div>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by title or topic"
          filters={[
            { key: "class", label: "Classes", options: dir.classes.map((c) => ({ value: c.id, label: c.name })) },
            { key: "subject", label: "Subjects", options: dir.subjects.map((s) => ({ value: s.id, label: s.name })) },
            {
              key: "status",
              label: "Statuses",
              options: ["published", "draft", "closed", "archived"].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })),
            },
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
            {result.items.map(({ assignment, stats }) => {
              const pct = stats.students ? Math.round((stats.submitted / stats.students) * 100) : 0;
              return (
                <li key={assignment.id}>
                  <Card className="gap-0 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-heading text-base font-extrabold">{assignment.title}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {dir.className(assignment.classId)} · {dir.subjectName(assignment.subjectId)} ·{" "}
                          {dir.teacherName(assignment.teacherId)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {assignment.questions.length} questions · opens {formatDate(assignment.startDate)} · due {formatDate(assignment.dueDate)}
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
                        ["Marked", stats.graded],
                        ["Not submitted", stats.notSubmitted],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="rounded-lg bg-muted/70 p-2 text-center">
                          <p className="text-[0.6rem] font-bold text-muted-foreground uppercase">{label}</p>
                          <p className="mt-0.5 text-sm font-extrabold">{value}</p>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="mt-4 w-fit font-bold" render={<Link href={`/portal/teacher/assignments/${assignment.id}`} />}>
                      Open
                    </Button>
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
            params={{ q, class: classId, subject: subjectId, status }}
          />
        </>
      )}
    </>
  );
}
