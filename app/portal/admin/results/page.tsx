import type { Metadata } from "next";

import { StatCard, StatusPill } from "@/components/common";
import { BarChart, ColumnChart } from "@/components/portal/charts";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/school/auth";
import { CLASS_LEVELS } from "@/lib/school/config";
import { classDisplayName, getGradeDistribution, getSubject } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";

export const metadata: Metadata = { title: "Results" };

export default async function AdminResultsPage() {
  await requireAdmin();
  const db = getDb();

  const publishedTerms = db.terms
    .filter((term) => db.reportCards.some((r) => r.termId === term.id))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <>
      <PortalPageHeader
        title="Results & report cards"
        description="Grade distribution, subject performance and report card publication by term."
      />

      {publishedTerms.length === 0 ? (
        <Card className="gap-0 p-8 text-center">
          <p className="font-heading text-lg font-extrabold">No results published yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Teachers enter scores through their portal; report cards are generated on the result
            publication date.
          </p>
        </Card>
      ) : (
        <Tabs defaultValue={publishedTerms[0].id}>
          <TabsList className="h-auto w-full overflow-x-auto sm:w-fit">
            {publishedTerms.map((term) => (
              <TabsTrigger key={term.id} value={term.id} className="text-xs font-bold whitespace-nowrap sm:text-sm">
                {term.name} · {term.sessionId.replace("ses-", "")}
              </TabsTrigger>
            ))}
          </TabsList>

          {publishedTerms.map((term) => {
            const results = db.results.filter((r) => r.termId === term.id);
            const reports = db.reportCards.filter((r) => r.termId === term.id);
            const grades = getGradeDistribution(term.id);
            const average = results.length
              ? Math.round((results.reduce((s, r) => s + r.total, 0) / results.length) * 10) / 10
              : 0;
            const passRate = results.length
              ? Math.round((results.filter((r) => r.total >= 50).length / results.length) * 100)
              : 0;

            const bySubject = Array.from(new Set(results.map((r) => r.subjectId)))
              .map((subjectId) => {
                const rows = results.filter((r) => r.subjectId === subjectId);
                const avg = rows.length ? rows.reduce((s, r) => s + r.total, 0) / rows.length : 0;
                return {
                  label: getSubject(subjectId)?.name ?? subjectId,
                  value: Math.round(avg),
                };
              })
              .sort((a, b) => b.value - a.value);

            const byLevel = CLASS_LEVELS.map((level) => {
              const classIds = db.classes.filter((c) => c.levelId === level.id).map((c) => c.id);
              const rows = results.filter((r) => classIds.includes(r.classId));
              const avg = rows.length ? rows.reduce((s, r) => s + r.total, 0) / rows.length : 0;
              return { label: level.name, value: Math.round(avg) };
            }).filter((row) => row.value > 0);

            const topClasses = db.classes
              .map((cls) => {
                const rows = reports.filter((r) => r.classId === cls.id);
                const avg = rows.length ? rows.reduce((s, r) => s + r.average, 0) / rows.length : 0;
                return { cls, average: Math.round(avg * 10) / 10, pupils: rows.length };
              })
              .filter((row) => row.pupils > 0)
              .sort((a, b) => b.average - a.average);

            return (
              <TabsContent key={term.id} value={term.id} className="mt-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Subject results" value={results.length} icon="ClipboardCheck" tone="info" />
                  <StatCard label="Report cards" value={reports.length} icon="Trophy" tone="gold" />
                  <StatCard label="School average" value={`${average}%`} icon="ChartColumn" tone={average >= 70 ? "success" : "warning"} />
                  <StatCard label="Pass rate" value={`${passRate}%`} hint="50% and above" icon="TrendingUp" tone={passRate >= 80 ? "success" : "warning"} />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="gap-0 p-5 sm:p-6">
                    <h2 className="font-heading text-base font-extrabold">Grade distribution</h2>
                    <Separator className="my-5" />
                    <ColumnChart
                      data={grades.map((row) => ({ label: row.grade, value: row.count }))}
                      caption="Number of subject results in each grade band."
                    />
                  </Card>

                  <Card className="gap-0 p-5 sm:p-6">
                    <h2 className="font-heading text-base font-extrabold">Average score by class level</h2>
                    <Separator className="my-5" />
                    <BarChart data={byLevel} unit="%" />
                  </Card>
                </div>

                <Card className="gap-0 p-5 sm:p-6">
                  <h2 className="font-heading text-base font-extrabold">Average score by subject</h2>
                  <Separator className="my-5" />
                  <BarChart data={bySubject} unit="%" />
                </Card>

                <Card className="gap-0 p-5 sm:p-6">
                  <h2 className="font-heading text-base font-extrabold">Class performance</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Published {formatDate(term.resultPublishDate)}.
                  </p>
                  <Separator className="my-5" />
                  <div className="overflow-x-auto rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Class</TableHead>
                          <TableHead className="text-right">Report cards</TableHead>
                          <TableHead className="text-right">Class average</TableHead>
                          <TableHead className="text-right">Standing</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topClasses.map((row) => (
                          <TableRow key={row.cls.id}>
                            <TableCell className="font-bold">{classDisplayName(row.cls.id)}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.pupils}</TableCell>
                            <TableCell className="text-right font-bold tabular-nums">{row.average}%</TableCell>
                            <TableCell className="text-right">
                              <StatusPill
                                tone={row.average >= 75 ? "success" : row.average >= 60 ? "gold" : "warning"}
                              >
                                {row.average >= 75 ? "Strong" : row.average >= 60 ? "Steady" : "Needs support"}
                              </StatusPill>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </>
  );
}
