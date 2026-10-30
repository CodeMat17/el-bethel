import Link from "next/link";
import type { Metadata } from "next";

import { EmptyState, StatCard } from "@/components/common";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { PortalPageHeader } from "@/components/portal/page-header";
import { GradeKey, MidtermTable, ResultsTable } from "@/components/portal/shared";
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
import { formatDate } from "@/lib/school/format";

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

  const [reports, midterms] = await Promise.all([
    query(api.results.allForStudent, { studentId: child.id }),
    query(api.midterm.allForStudent, { studentId: child.id }),
  ]);
  // The current term (so families can always find the mid-term section) and every term with results, newest first.
  const termMap = new Map([...reports, ...midterms].map((r) => [r.term.id as string, { id: r.term.id as string, name: r.term.name, sessionId: r.term.sessionId as string, startDate: r.term.startDate }]));
  if (dir.activeTerm && !termMap.has(dir.activeTerm.id)) termMap.set(dir.activeTerm.id, dir.activeTerm);
  const terms = [...termMap.values()].sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  );

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
                photoUrl: c.photo?.url,
              }))}
            />
          }
        />
        <EmptyState
          icon="Trophy"
          title="No results have been published yet"
          description="Results appear here as soon as the class teacher publishes them, after the mid-term test and at the end of each term."
        />
      </>
    );
  }

  return (
    <>
      <PortalPageHeader
        eyebrow={`${studentName(child)} · ${dir.className(child.classId)}`}
        title="Results"
        description="Mid-term test scores and the end-of-term summary for each term: subject scores, averages, class position and teacher comments."
        action={
          <ChildSwitcher
            activeId={child.id}
            options={myChildren.map((c) => ({
              id: c.id,
              name: studentName(c),
              className: dir.className(c.classId),
              avatarSeed: c.avatarSeed,
              photoUrl: c.photo?.url,
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
          const midterm = midterms.find((m) => m.term.id === term.id);

          return (
            <TabsContent key={term.id} value={term.id} className="mt-6 space-y-6">
              {midterm ? (
                <Card className="gap-0 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-heading text-base font-extrabold">Mid-term assessment</h2>
                    {midterm.publishedAt ? (
                      <p className="text-xs text-muted-foreground">Published {formatDate(midterm.publishedAt)}</p>
                    ) : null}
                  </div>
                  <Separator className="my-4" />
                  <div className="mb-5 grid gap-4 sm:grid-cols-3">
                    <StatCard
                      label="Mid-term average"
                      value={`${midterm.average}%`}
                      hint={`${midterm.scores.length} subjects`}
                      icon="ChartColumn"
                      tone={midterm.average >= 70 ? "success" : midterm.average >= 50 ? "warning" : "danger"}
                    />
                    <StatCard
                      label="Class position"
                      value={`${midterm.position} of ${midterm.classSize}`}
                      hint={dir.className(midterm.classId)}
                      icon="Trophy"
                      tone="gold"
                    />
                    <StatCard
                      label="Class average"
                      value={`${midterm.classAverage}%`}
                      hint={midterm.average >= midterm.classAverage ? "At or above the class average" : "Below the class average"}
                      icon="Users"
                    />
                  </div>
                  <MidtermTable scores={midterm.scores} finals={results} dir={dir} />
                  <p className="mt-4 text-xs text-muted-foreground">
                    The mid-term test shows progress halfway through the term. It is reported on its own and is not part
                    of the end-of-term CA or exam.
                    {results.length > 0 ? " The last column shows the end-of-term total and the change since mid-term." : ""}
                  </p>
                </Card>
              ) : (
                <Card className="gap-0 p-5 sm:p-6">
                  <h2 className="font-heading text-base font-extrabold">Mid-term assessment</h2>
                  <Separator className="my-4" />
                  <p className="text-sm text-muted-foreground">
                    {studentName(child)}&apos;s {term.name} mid-term test scores will appear here once the class teacher
                    publishes them. You will get a notification when they are ready.
                  </p>
                </Card>
              )}

              {entry ? (
              <>
              {report ? (
                <div className="grid gap-4 sm:grid-cols-3">
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
                      <Button variant="outline" size="lg" className="w-full font-bold" render={<Link href="/contact" />}>
                        Arrange a meeting with the class teacher
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
              </>
              ) : (
                <Card className="gap-0 p-5 text-sm text-muted-foreground sm:p-6">
                  End-of-term results for {term.name} will appear here once the class teacher publishes them.
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </>
  );
}

