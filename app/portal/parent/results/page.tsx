import Link from "next/link";
import type { Metadata } from "next";

import { EmptyState, StatCard } from "@/components/common";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { PortalPageHeader } from "@/components/portal/page-header";
import { GradeKey, ResultsTable } from "@/components/portal/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireParent } from "@/lib/school/auth";
import { api } from "@/convex/_generated/api";
import { studentName } from "@/lib/school/data";
import { getMyChildren, resolveActiveChild } from "@/lib/school/parent";
import { getDirectory } from "@/lib/school/directory";
import { query } from "@/lib/school/convex";
import { formatDate, percent } from "@/lib/school/format";

export const metadata: Metadata = { title: "Results" };

export default async function ParentResultsPage({ searchParams }: PageProps<"/portal/parent/results">) {
  const user = await requireParent();
  const dir = await getDirectory();
  const params = await searchParams;
  const child = await resolveActiveChild(typeof params.child === "string" ? params.child : undefined);
  const myChildren = await getMyChildren();

  if (!child) {
    return <EmptyState icon="Users" title="No children linked" description="Contact the school office." />;
  }

  const reports = await query(api.results.allForStudent, { studentId: child.id });
  const terms = reports.map((r) => r.term);

  if (terms.length === 0) {
    return (
      <>
        <PortalPageHeader
          eyebrow={studentName(child)}
          title="Results"
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
        <EmptyState
          icon="Trophy"
          title="No results have been published yet"
          description="Results appear here as soon as the class teacher publishes them at the end of each term."
        />
      </>
    );
  }

  return (
    <>
      <PortalPageHeader
        eyebrow={`${studentName(child)} · ${dir.className(child.classId)}`}
        title="Exam results"
        description="A summary of each published term: subject scores, average, class position and teacher comments."
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

      <Tabs defaultValue={terms[0].id}>
        <TabsList className="h-auto w-full overflow-x-auto sm:w-fit">
          {terms.map((term) => (
            <TabsTrigger key={term.id} value={term.id} className="text-xs font-bold whitespace-nowrap sm:text-sm">
              {term.name} · {dir.getSession(term.sessionId)?.name ?? ""}
            </TabsTrigger>
          ))}
        </TabsList>

        {terms.map((term) => {
          const entry = reports.find((r) => r.term.id === term.id);
          const results = entry?.results ?? [];
          const report = entry?.reportCard ?? null;
          const best = [...results].sort((a, b) => b.total - a.total)[0];
          const weakest = [...results].sort((a, b) => a.total - b.total)[0];

          return (
            <TabsContent key={term.id} value={term.id} className="mt-6 space-y-6">
              {report ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Average"
                    value={`${report.average}%`}
                    hint={`${results.length} subjects`}
                    icon="ChartColumn"
                    tone={report.average >= 70 ? "success" : report.average >= 50 ? "warning" : "danger"}
                  />
                  <StatCard
                    label="Class position"
                    value={`${report.position} of ${report.classSize}`}
                    hint={dir.className(report.classId)}
                    icon="Trophy"
                    tone="gold"
                  />
                  <StatCard
                    label="Attendance"
                    value={`${percent(report.attendancePresent, report.attendanceTotal)}%`}
                    hint={`${report.attendancePresent} of ${report.attendanceTotal} days`}
                    icon="CalendarCheck"
                    tone="info"
                  />
                  <StatCard
                    label="Promotion"
                    value={report.promotionStatus === "promoted" ? "Promoted" : report.promotionStatus === "repeat" ? "Repeat year" : "Pending"}
                    hint={report.publishedAt ? `Published ${formatDate(report.publishedAt)}` : undefined}
                    icon="BadgeCheck"
                    tone={report.promotionStatus === "promoted" ? "success" : "neutral"}
                  />
                </div>
              ) : null}

              <Card className="gap-0 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-heading text-base font-extrabold">Subject breakdown</h2>
                </div>
                <Separator className="my-4" />
                <ResultsTable results={results} dir={dir} />
                <div className="mt-5">
                  <GradeKey />
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  This is a summary. The full printed report card is handed to your child at school.
                </p>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="gap-0 p-5 sm:p-6">
                  <h2 className="font-heading text-base font-extrabold">Strengths and next steps</h2>
                  <Separator className="my-4" />
                  {best && weakest ? (
                    <div className="space-y-5">
                      <div>
                        <p className="text-sm font-bold text-success">Strongest subject</p>
                        <p className="mt-1 text-sm">
                          <span className="font-extrabold">{best.total}%</span> in{" "}
                          {dir.subjectName(best.subjectId)} — {best.remark}.
                        </p>
                        <Progress value={best.total} className="mt-2" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-warning">Needs the most attention</p>
                        <p className="mt-1 text-sm">
                          <span className="font-extrabold">{weakest.total}%</span> in{" "}
                          {dir.subjectName(weakest.subjectId)} — {weakest.remark}.
                        </p>
                        <Progress value={weakest.total} className="mt-2" />
                      </div>
                      <Button variant="outline" size="lg" className="w-full font-bold" render={<Link href="/portal/parent/appointments" />}>
                        Book a meeting with the class teacher
                      </Button>
                    </div>
                  ) : null}
                </Card>

                {report ? (
                  <Card className="gap-0 p-5 sm:p-6">
                    <h2 className="font-heading text-base font-extrabold">Comments</h2>
                    <Separator className="my-4" />
                    {report.conduct.length > 0 ? (
                    <ul className="mb-5 space-y-3">
                      {report.conduct.map((trait) => (
                        <li key={trait.label}>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-semibold">{trait.label}</span>
                            <span className="text-xs font-bold text-muted-foreground">{trait.rating}/5</span>
                          </div>
                          <Progress value={(trait.rating / 5) * 100} className="mt-1.5" />
                        </li>
                      ))}
                    </ul>
                    ) : null}
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Class teacher</p>
                        <p className="mt-1 leading-relaxed">{report.teacherComment}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Headteacher</p>
                        <p className="mt-1 leading-relaxed">{report.headteacherComment}</p>
                      </div>
                    </div>
                  </Card>
                ) : null}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </>
  );
}

