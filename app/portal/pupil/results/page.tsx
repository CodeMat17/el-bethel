import type { Metadata } from "next";
import { TrophyIcon } from "lucide-react";

import { EmptyState, StatCard } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { GradeKey, MidtermTable, ResultsTable } from "@/components/portal/shared";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { requirePupil } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";

export const metadata: Metadata = { title: "My results" };

export default async function PupilResultsPage() {
  const user = await requirePupil();
  if (!user.studentId) {
    return <EmptyState icon="Backpack" title="No school record" description="Please ask your class teacher." />;
  }

  const [reports, midterms, assignments, dir] = await Promise.all([
    query(api.results.allForStudent, { studentId: user.studentId }),
    query(api.midterm.allForStudent, { studentId: user.studentId }),
    query(api.assignments.forStudent, { studentId: user.studentId }),
    getDirectory(),
  ]);
  // The current term (so the mid-term section is always there) and every term with results, newest first.
  const termMap = new Map([...reports, ...midterms].map((r) => [r.term.id as string, { id: r.term.id as string, name: r.term.name, startDate: r.term.startDate }]));
  if (dir.activeTerm && !termMap.has(dir.activeTerm.id)) termMap.set(dir.activeTerm.id, dir.activeTerm);
  const terms = [...termMap.values()].sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  );
  const graded = assignments.filter((a) => a.progress === "graded");
  const average = graded.length
    ? Math.round(
        (graded.reduce((s, a) => s + (a.submission?.score ?? 0) / a.assignment.maxScore, 0) / graded.length) * 100,
      )
    : 0;

  return (
    <>
      <PortalPageHeader
        title="My results"
        description="Your marked assignments, mid-term test scores and a summary of your published exam results. Your full report card is given to you at school."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Assignments marked" value={graded.length} icon="ClipboardCheck" tone="info" />
        <StatCard
          label="My average"
          value={graded.length ? `${average}%` : "—"}
          icon="ChartColumn"
          tone={average >= 70 ? "success" : "warning"}
        />
        <StatCard label="Terms with results" value={new Set([...reports, ...midterms].map((r) => r.term.id)).size} icon="Trophy" tone="gold" />
      </div>

      <Card className="mt-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">My marked work this term</h2>
        <Separator className="my-4" />
        {graded.length === 0 ? (
          <div className="py-8 text-center">
            <TrophyIcon className="mx-auto size-9 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">Nothing has been marked yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {graded.map(({ assignment, submission }) => {
              const pct = Math.round(((submission?.score ?? 0) / assignment.maxScore) * 100);
              return (
                <li key={assignment.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold">{assignment.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{dir.subjectName(assignment.subjectId)}</p>
                    </div>
                    <p className="shrink-0 font-heading text-base font-extrabold tabular-nums">
                      {submission?.score}/{assignment.maxScore}
                    </p>
                  </div>
                  <Progress value={pct} className="mt-3" />
                  {submission?.feedback ? (
                    <p className="mt-3 rounded-lg bg-muted/70 p-3 text-xs leading-relaxed">
                      <span className="font-bold">Your teacher said · </span>
                      {submission.feedback}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {terms.length > 0 ? (
        <div className="mt-6">
          <h2 className="mb-4 font-heading text-base font-extrabold">My test and exam results</h2>
          <Tabs defaultValue={terms[0].id}>
            <TabsList className="h-auto w-full overflow-x-auto sm:w-fit">
              {terms.map((term) => (
                <TabsTrigger key={term.id} value={term.id} className="text-xs font-bold whitespace-nowrap sm:text-sm">
                  {term.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {terms.map((term) => {
              const entry = reports.find((r) => r.term.id === term.id);
              const results = entry?.results ?? [];
              const report = entry?.reportCard ?? null;
              const midterm = midterms.find((m) => m.term.id === term.id);
              return (
                <TabsContent key={term.id} value={term.id} className="mt-5 space-y-5">
                  {midterm ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-heading text-sm font-extrabold">Mid-term test</h3>
                        <p className="text-sm font-bold">
                          Average {midterm.average}% · {midterm.position} of {midterm.classSize} in class
                        </p>
                      </div>
                      <MidtermTable scores={midterm.scores} finals={results} dir={dir} />
                    </div>
                  ) : (
                    <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                      Your {term.name} mid-term test scores will appear here once your class teacher publishes them.
                    </p>
                  )}
                  {entry && midterm ? <h3 className="font-heading text-sm font-extrabold">End of term</h3> : null}
                  {report ? (
                    <Card className="gap-0 border-gold/30 bg-gold/8 p-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="text-center">
                          <p className="font-heading text-2xl font-extrabold">{report.average}%</p>
                          <p className="mt-1 text-xs font-bold text-muted-foreground uppercase">Average</p>
                        </div>
                        <div className="text-center">
                          <p className="font-heading text-2xl font-extrabold">{report.position}</p>
                          <p className="mt-1 text-xs font-bold text-muted-foreground uppercase">
                            of {report.classSize} in class
                          </p>
                        </div>
                      </div>
                      <Separator className="my-5" />
                      <p className="text-sm leading-relaxed">
                        <span className="font-extrabold">Your teacher wrote · </span>
                        {report.teacherComment}
                      </p>
                    </Card>
                  ) : null}
                  {entry ? <ResultsTable results={results} dir={dir} /> : null}
                  <GradeKey />
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      ) : null}
    </>
  );
}
