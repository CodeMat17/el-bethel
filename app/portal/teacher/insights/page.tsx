import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { BarChart, ColumnChart } from "@/components/portal/charts";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { requireTeacher } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { param } from "@/lib/school/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Class insights" };

const pctText = (n: number | null) => (n === null ? "—" : `${n}%`);

export default async function TeacherInsightsPage({ searchParams }: PageProps<"/portal/teacher/insights">) {
  await requireTeacher();
  const params = await searchParams;
  const classes = await query(api.insights.classOptions, {});
  if (classes.length === 0) return <EmptyState icon="School" title="No classes assigned" description="Contact the school administrator." />;

  // Only classes Convex says this teacher may analyse are selectable.
  const cls = classes.find((c) => c.id === param(params.class)) ?? classes[0];
  const data = await query(api.insights.forClass, { classId: cls.id });
  const { summary } = data;

  return (
    <>
      <PortalPageHeader
        title="Class insights"
        description="Who may need support, which topics the class found hard, and how each pupil is doing across results, homework, quizzes and attendance."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {classes.map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={c.id === cls.id ? "default" : "outline"}
            className={cn("font-bold", c.id === cls.id && "pointer-events-none")}
            render={<Link href={`/portal/teacher/insights?class=${c.id}`} />}
          >
            {c.name}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Class average" value={pctText(summary.average)} icon="Trophy" tone="info" />
        <StatCard label="Homework handed in" value={pctText(summary.homeworkRate)} icon="ClipboardList" tone="neutral" />
        <StatCard label="Quiz average" value={pctText(summary.quizScore)} icon="Puzzle" tone="neutral" />
        <StatCard label="Attendance" value={pctText(summary.attendance)} icon="CalendarCheck" tone="neutral" />
        <StatCard
          label="May need support"
          value={summary.needingSupport}
          hint="Two or more concerns"
          icon="CircleAlert"
          tone={summary.needingSupport > 0 ? "warning" : "success"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Spread of term averages</h2>
          <Separator className="my-4" />
          <ColumnChart data={data.distribution} caption="Pupils in each band, latest term." />
        </Card>
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Subject averages</h2>
          <Separator className="my-4" />
          {data.subjects.length ? <BarChart data={data.subjects} /> : <p className="text-sm text-muted-foreground">No results entered yet.</p>}
        </Card>
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Topics to reteach</h2>
          <p className="mt-1 text-xs text-muted-foreground">Lowest average marks on homework topics (three or more pupils marked).</p>
          <Separator className="my-4" />
          {data.hardTopics.length ? (
            <BarChart unit="%" data={data.hardTopics.map((t) => ({ label: `${t.topic} · ${t.subject}`, value: t.score, hint: `${t.pupils} pupils` }))} />
          ) : (
            <p className="text-sm text-muted-foreground">Not enough marked homework yet.</p>
          )}
        </Card>
      </div>

      <Card className="mt-6 gap-0 p-0">
        <div className="p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Pupils</h2>
          <p className="mt-1 text-xs text-muted-foreground">Pupils with the most concerns first. Open a pupil for their full learning profile.</p>
        </div>
        {data.pupils.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">No pupils in this class.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pupil</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">Homework</TableHead>
                  <TableHead className="text-right">Quizzes</TableHead>
                  <TableHead className="text-right">Attendance</TableHead>
                  <TableHead>Concerns</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pupils.map((p) => (
                  <TableRow key={p.studentId}>
                    <TableCell className="font-semibold">{p.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{pctText(p.average)}</TableCell>
                    <TableCell className={cn("text-right tabular-nums", p.change !== null && p.change < 0 && "text-destructive", p.change !== null && p.change > 0 && "text-success")}>
                      {p.change === null ? "—" : `${p.change > 0 ? "+" : ""}${p.change}`}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{pctText(p.homeworkRate)}</TableCell>
                    <TableCell className="text-right tabular-nums">{pctText(p.quizScore)}</TableCell>
                    <TableCell className="text-right tabular-nums">{pctText(p.attendance)}</TableCell>
                    <TableCell className="max-w-72">
                      {p.signals.length === 0 ? (
                        <StatusPill tone="success">None</StatusPill>
                      ) : (
                        <ul className="space-y-0.5 text-xs">
                          {p.signals.map((s, i) => (
                            <li key={i} className={s.tone === "danger" ? "text-destructive" : "text-warning"}>
                              {s.text}
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="font-bold" render={<Link href={`/portal/teacher/insights/${p.studentId}`} />}>
                        Profile
                        <ArrowRightIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </>
  );
}
