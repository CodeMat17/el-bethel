import Link from "next/link";
import type { Metadata } from "next";

import { StatCard, StatusPill } from "@/components/common";
import { ColumnChart } from "@/components/portal/charts";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { param } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { formatDate } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Results" };

export default async function AdminResultsPage({ searchParams }: PageProps<"/portal/admin/results">) {
  await requireAdmin();
  const params = await searchParams;
  const dir = await getDirectory();
  const terms = [...dir.terms].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const term = terms.find((t) => t.id === param(params.term)) ?? dir.activeTerm ?? terms[0];
  const overview = term ? await query(api.results.overview, { termId: term.id as Id<"terms"> }) : null;

  const rows = (overview?.classes ?? []).filter((c) => dir.getClass(c.classId));
  const published = rows.filter((r) => r.published).length;
  const withScores = rows.filter((r) => r.entries > 0).length;

  return (
    <>
      <PortalPageHeader
        title="Exam results"
        description="Every class's term results. Subject teachers enter scores; the class teacher or an administrator publishes them."
      />

      <Card className="mb-6 gap-0 p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase">Term</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {terms.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={t.id === term?.id ? "default" : "outline"}
              className={cn("font-bold", t.id === term?.id && "pointer-events-none")}
              render={<Link href={`/portal/admin/results?term=${t.id}`} />}
            >
              {t.name} · {dir.getSession(t.sessionId)?.name}
            </Button>
          ))}
        </div>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Classes" value={rows.length} icon="School" tone="neutral" />
        <StatCard label="With scores entered" value={withScores} icon="PenSquare" tone="info" />
        <StatCard label="Published" value={published} icon="CircleCheck" tone="success" />
        <StatCard label="Not yet published" value={withScores - published} icon="Clock" tone={withScores - published > 0 ? "warning" : "success"} />
      </div>

      {overview && overview.grades.some((g) => g.count > 0) ? (
        <Card className="mb-6 gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Grade distribution</h2>
          <p className="mt-1 text-sm text-muted-foreground">{term?.name}, all subjects, whole school.</p>
          <Separator className="my-5" />
          <ColumnChart data={overview.grades.map((g) => ({ label: g.grade, value: g.count }))} caption="Number of subject results in each grade band." />
        </Card>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead className="text-right">Pupils</TableHead>
              <TableHead className="text-right">Subjects entered</TableHead>
              <TableHead className="text-right">Average</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.classId}>
                <TableCell className="font-bold">{dir.className(row.classId)}</TableCell>
                <TableCell className="text-right tabular-nums">{row.pupils}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.subjects}/{dir.subjectsForClass(row.classId).length}
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.entries ? `${row.average}%` : "—"}</TableCell>
                <TableCell>
                  {row.published ? (
                    <StatusPill tone="success">Published {row.publishedAt ? formatDate(row.publishedAt) : ""}</StatusPill>
                  ) : row.entries ? (
                    <StatusPill tone="warning">Not published</StatusPill>
                  ) : (
                    <StatusPill tone="neutral">No scores</StatusPill>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-bold"
                      render={<Link href={`/portal/teacher/results?class=${row.classId}&term=${term?.id}&view=scores`} />}
                    >
                      Scores
                    </Button>
                    <Button
                      size="sm"
                      className="font-bold"
                      render={<Link href={`/portal/teacher/results?class=${row.classId}&term=${term?.id}&view=publish`} />}
                    >
                      {row.published ? "Review" : "Publish"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
