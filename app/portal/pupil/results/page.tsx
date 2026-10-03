import type { Metadata } from "next";
import { TrophyIcon } from "lucide-react";

import { EmptyState, StatCard } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { GradeKey, ResultsTable } from "@/components/portal/shared";
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
    return <EmptyState icon="Backpack" title="No pupil record" description="Please ask your class teacher." />;
  }

  const [reports, assignments, dir] = await Promise.all([
    query(api.results.allForStudent, { studentId: user.studentId }),
    query(api.assignments.forStudent, { studentId: user.studentId }),
    getDirectory(),
  ]);
  const terms = reports.map((r) => r.term);
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
        description="Your marked assignments and a summary of your published exam results. Your full report card is given to you at school."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Assignments marked" value={graded.length} icon="ClipboardCheck" tone="info" />
        <StatCard
          label="My average"
          value={graded.length ? `${average}%` : "—"}
          icon="ChartColumn"
          tone={average >= 70 ? "success" : "warning"}
        />
        <StatCard label="Terms with results" value={terms.length} icon="Trophy" tone="gold" />
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
          <h2 className="mb-4 font-heading text-base font-extrabold">My exam results</h2>
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
              return (
                <TabsContent key={term.id} value={term.id} className="mt-5 space-y-5">
                  {report ? (
                    <Card className="gap-0 border-gold/30 bg-gold/8 p-5">
                      <div className="grid gap-4 sm:grid-cols-3">
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
                        <div className="text-center">
                          <p className="font-heading text-2xl font-extrabold">
                            {report.attendancePresent}/{report.attendanceTotal}
                          </p>
                          <p className="mt-1 text-xs font-bold text-muted-foreground uppercase">Days present</p>
                        </div>
                      </div>
                      <Separator className="my-5" />
                      <p className="text-sm leading-relaxed">
                        <span className="font-extrabold">Your teacher wrote · </span>
                        {report.teacherComment}
                      </p>
                    </Card>
                  ) : null}
                  <ResultsTable results={results} dir={dir} />
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
