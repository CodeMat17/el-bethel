import type { FunctionReturnType } from "convex/server";

import { StatusPill } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { api } from "@/convex/_generated/api";
import { formatDate } from "@/lib/school/format";

type Insight = FunctionReturnType<typeof api.parentInsights.forChild>[number];

const weekLabel = (monday: string) => `Week of ${formatDate(monday)}`;

/** The latest weekly summary, large, followed by earlier weeks. */
export function WeeklyInsights({ insights, firstName }: { insights: Insight[]; firstName: string }) {
  if (insights.length === 0) {
    return (
      <Card className="gap-0 border-dashed p-5 text-sm text-muted-foreground">
        {firstName}&apos;s first weekly summary arrives on Friday afternoon. It covers attendance, homework, marks, quizzes and reading for the week.
      </Card>
    );
  }
  const [latest, ...earlier] = insights;
  const m = latest.metrics;
  return (
    <div className="space-y-4">
      <Card className="gap-0 overflow-hidden p-0">
        <div className="bg-navy p-5 text-navy-foreground sm:p-6">
          <p className="text-xs font-bold tracking-wide text-gold uppercase">{weekLabel(latest.weekOf)}</p>
          <h2 className="mt-1 font-heading text-xl font-extrabold">{latest.headline}</h2>
        </div>
        <div className="p-5 sm:p-6">
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs font-bold text-muted-foreground uppercase">Attendance</dt>
              <dd className="font-heading text-lg font-extrabold">{m.attendanceRate === undefined ? "—" : `${m.attendanceRate}%`}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-muted-foreground uppercase">Homework</dt>
              <dd className="font-heading text-lg font-extrabold">{m.homeworkDue ? `${m.homeworkDone}/${m.homeworkDue}` : "None due"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-muted-foreground uppercase">Marked work</dt>
              <dd className="font-heading text-lg font-extrabold">{m.averageScore === undefined ? "—" : `${m.averageScore}%`}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-muted-foreground uppercase">Reading</dt>
              <dd className="font-heading text-lg font-extrabold">{m.readingMinutes} min</dd>
            </div>
          </dl>
          <Separator className="my-4" />
          <ul className="space-y-2">
            {latest.points.map((p, i) => (
              <li key={i} className="flex flex-wrap items-start gap-2 text-sm">
                <StatusPill tone={p.tone} className="shrink-0">
                  {p.area}
                </StatusPill>
                <span className="min-w-0 flex-1 pt-0.5">{p.text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Written automatically from school records on {formatDate(latest.generatedAt)}. Questions? Message the class teacher.
          </p>
        </div>
      </Card>
      {earlier.length > 0 ? (
        <details className="rounded-xl border bg-card p-4">
          <summary className="cursor-pointer text-sm font-bold">Earlier weeks ({earlier.length})</summary>
          <ul className="mt-3 space-y-3">
            {earlier.map((w) => (
              <li key={w.id} className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase">{weekLabel(w.weekOf)}</p>
                <p className="mt-0.5 font-bold">{w.headline}</p>
                <p className="mt-1 text-muted-foreground">{w.points.map((p) => p.text).join(" ")}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
