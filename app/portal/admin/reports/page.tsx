import Link from "next/link";
import type { Metadata } from "next";

import { SendIcon } from "lucide-react";

import { StatCard } from "@/components/common";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { generateWeeklyInsights } from "@/lib/school/actions/premium";
import { BarChart, ColumnChart, HeroFigure, TrendChart } from "@/components/portal/charts";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdmin } from "@/lib/school/auth";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { APPLICATION_STATUS, compactMoney, formatDate, money } from "@/lib/school/format";
import type { ApplicationStatus } from "@/lib/school/types";

export const metadata: Metadata = { title: "Reports & analytics" };

export default async function AdminReportsPage() {
  await requireAdmin();

  const [metrics, academics, attendance, enquiries, insights, dir] = await Promise.all([
    query(api.dashboard.metrics, {}),
    query(api.dashboard.academics, {}),
    query(api.attendance.schoolOverview, { days: 12 }),
    query(api.dashboard.enquiryStats, {}),
    query(api.analytics.insights, {}),
    getDirectory(),
  ]);
  const weekly = await query(api.parentInsights.weekStatus, {});
  const enrolment = metrics.enrolment;
  const trend = attendance.trend;
  const grades = academics.grades;
  const submissions = metrics.submissions;
  const applications = metrics.applicationsByStatus;
  const bySubject = academics.bySubject.map((row) => ({ label: dir.subjectName(row.subjectId), value: row.average }));
  const applicationsByLevel = metrics.applicationsByLevel.filter((row) => row.value > 0);
  const outstandingByLevel = metrics.outstandingByLevel.map((row) => ({
    label: row.label,
    value: Math.round(row.amount / 1000),
    hint: money(row.amount),
  }));
  const enquiriesByCategory = enquiries.byCategory.map((row) => ({
    label: row.category.charAt(0).toUpperCase() + row.category.slice(1),
    value: row.count,
  }));

  return (
    <>
      <PortalPageHeader
        title="Reports & analytics"
        description="Academic, attendance, admissions, finance and enquiry reporting across the school."
        action={
          <ConfirmAction
            action={generateWeeklyInsights}
            icon={<SendIcon />}
            pendingText="Starting…"
            confirm={{
              title: "Send this week's parent summaries now?",
              description: `Summaries are written for every pupil for the week of ${formatDate(weekly.weekOf)}. Families who haven't had this week's summary are notified; the Friday job won't notify them twice.`,
              confirmLabel: "Write summaries",
            }}
          >
            Weekly parent summaries
          </ConfirmAction>
        }
      />

      <p className="-mt-3 mb-6 text-xs text-muted-foreground">
        Parent insights for the week of {formatDate(weekly.weekOf)}:{" "}
        {weekly.pupils > 0 ? `${weekly.pupils} pupils summarised${weekly.generatedAt ? `, last written ${formatDate(weekly.generatedAt)}` : ""}.` : "not written yet — they go out automatically on Friday afternoon."}{" "}
        Per-pupil learning profiles are on each pupil&apos;s page.
      </p>

      <Tabs defaultValue="academic">
        <TabsList className="h-auto w-full overflow-x-auto sm:w-fit">
          {[
            ["academic", "Academic"],
            ["attendance", "Attendance"],
            ["assignments", "Assignments"],
            ["admissions", "Admissions"],
            ["finance", "Finance"],
            ["enquiries", "Enquiries"],
            ["operations", "Library"],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="text-xs font-bold whitespace-nowrap sm:text-sm">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="academic" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Grade distribution</h2>
              <p className="mt-1 text-sm text-muted-foreground">{academics.term ? `${academics.term.name}, all subjects.` : "No results entered yet."}</p>
              <Separator className="my-5" />
              <ColumnChart
                data={grades.map((row) => ({ label: row.grade, value: row.count }))}
                caption="Number of subject results in each grade band."
              />
            </Card>
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Enrolment by class level</h2>
              <Separator className="my-5" />
              <BarChart data={enrolment.map((row) => ({ label: row.level, value: row.count }))} />
            </Card>
          </div>
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Average score by subject</h2>
            <Separator className="my-5" />
            <BarChart data={bySubject} unit="%" />
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Performance trend</h2>
              <p className="mt-1 text-sm text-muted-foreground">School-wide average on published report cards, term by term.</p>
              <Separator className="my-5" />
              {insights.academic.termTrend.length >= 2 ? (
                <TrendChart
                  data={insights.academic.termTrend.map((t) => ({ label: t.label, value: t.average }))}
                  caption="Average report-card score (%) per term."
                  min={0}
                  max={100}
                />
              ) : (
                <BarChart data={insights.academic.termTrend.map((t) => ({ label: t.label, value: t.average }))} unit="%" />
              )}
            </Card>
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Average by class</h2>
              <p className="mt-1 text-sm text-muted-foreground">Latest term with published report cards.</p>
              <Separator className="my-5" />
              <BarChart data={insights.academic.classAverages.map((c) => ({ label: dir.className(c.classId), value: c.average }))} unit="%" />
            </Card>
          </div>
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Pupils who may need support</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {insights.academic.needSupportCount} of {insights.academic.latestPupils} pupils averaged below 50% last term.
            </p>
            <Separator className="my-5" />
            {insights.academic.needSupport.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pupil averaged below 50%.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {insights.academic.needSupport.map((p) => (
                  <li key={p.studentId} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm">
                    <Link href={`/portal/admin/students/${p.studentId}`} className="min-w-0 truncate font-bold hover:underline">
                      {p.name}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">{dir.className(p.classId)}</span>
                    </Link>
                    <span className="shrink-0 font-bold tabular-nums">{p.average}%</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Latest register" value={`${attendance.day.rate}%`} hint={formatDate(attendance.date)} icon="CalendarCheck" tone="success" />
            <StatCard label="Last three weeks" value={`${attendance.overall.rate}%`} icon="ClipboardCheck" tone="neutral" />
            <StatCard label="Absences (three weeks)" value={attendance.overall.absent} icon="CalendarX" tone="warning" />
          </div>
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Attendance trend</h2>
            <Separator className="my-5" />
            <TrendChart
              data={trend.map((point) => ({ label: formatDate(point.date), value: point.rate }))}
              caption="Percentage of pupils present or late, most recent school days."
              min={80}
              max={100}
            />
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Late arrivals by weekday</h2>
              <p className="mt-1 text-sm text-muted-foreground">Last 30 days.</p>
              <Separator className="my-5" />
              <ColumnChart data={insights.attendance.weekdays.map((d) => ({ label: d.label, value: d.late }))} caption="Number of late marks on each school day." />
            </Card>
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Absences by weekday</h2>
              <p className="mt-1 text-sm text-muted-foreground">Last 30 days.</p>
              <Separator className="my-5" />
              <ColumnChart data={insights.attendance.weekdays.map((d) => ({ label: d.label, value: d.absent }))} caption="Number of absences on each school day." />
            </Card>
          </div>
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Attendance below 90%</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {insights.attendance.chronicCount} of {insights.attendance.pupilsTracked} pupils in the last 30 days. Lowest first.
            </p>
            <Separator className="my-5" />
            {insights.attendance.chronic.length === 0 ? (
              <p className="text-sm text-muted-foreground">Every pupil is at 90% or above.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {insights.attendance.chronic.map((p) => (
                  <li key={p.studentId} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm">
                    <Link href={`/portal/admin/students/${p.studentId}`} className="min-w-0 truncate font-bold hover:underline">
                      {p.name}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">{dir.className(p.classId)}</span>
                    </Link>
                    <span className="shrink-0 tabular-nums">
                      <span className="font-bold">{p.rate}%</span>
                      {p.late ? <span className="ml-1.5 text-xs text-muted-foreground">{p.late} late</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-6 space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Submissions and marking</h2>
            <Separator className="my-5" />
            <div className="grid gap-6 sm:grid-cols-4">
              <HeroFigure value={String(submissions.total)} label="Submissions" />
              <HeroFigure value={String(submissions.graded)} label="Marked" />
              <HeroFigure value={String(submissions.pending)} label="Awaiting marking" />
              <HeroFigure value={`${submissions.averagePercent}%`} label="Average score" progress={submissions.averagePercent} />
            </div>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Homework handed in" value={`${insights.homework.rate}%`} hint={`${insights.homework.due} assignments past due`} icon="ClipboardCheck" tone="success" />
            <StatCard label="Handed in late" value={`${insights.homework.lateRate}%`} icon="Clock" tone="warning" />
            <StatCard label="Quiz completion" value={`${insights.quizzes.completion}%`} hint={`${insights.quizzes.attempts} attempts on ${insights.quizzes.count} quizzes`} icon="Puzzle" tone="info" />
            <StatCard label="Average quiz score" value={insights.quizzes.averagePercent === null ? "—" : `${insights.quizzes.averagePercent}%`} icon="TrendingUp" tone="gold" />
          </div>
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Homework handed in, by class</h2>
            <p className="mt-1 text-sm text-muted-foreground">Share of expected submissions received for assignments past their due date.</p>
            <Separator className="my-5" />
            <BarChart
              data={insights.homework.byClass.map((c) => ({
                label: dir.className(c.classId),
                value: c.rate,
                hint: `${c.assignments} assignments · ${c.late} late`,
              }))}
              unit="%"
            />
          </Card>
        </TabsContent>

        <TabsContent value="admissions" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Applications by status</h2>
              <Separator className="my-5" />
              <BarChart
                data={applications.map((row) => ({
                  label: APPLICATION_STATUS[row.status as ApplicationStatus]?.label ?? row.status,
                  value: row.count,
                }))}
              />
            </Card>
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Applications by intended class</h2>
              <Separator className="my-5" />
              <BarChart data={applicationsByLevel} />
            </Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Admissions funnel</h2>
              <p className="mt-1 text-sm text-muted-foreground">Submitted applications and how far they have progressed.</p>
              <Separator className="my-5" />
              <BarChart data={insights.admissions.funnel} />
            </Card>
            <StatCard label="Applied → enrolled" value={`${insights.admissions.conversion}%`} icon="UserCheck" tone="success" />
          </div>
        </TabsContent>

        <TabsContent value="finance" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Billed" value={compactMoney(metrics.feesBilled)} icon="Receipt" tone="neutral" />
            <StatCard label="Collected" value={compactMoney(metrics.feesCollected)} icon="CircleCheck" tone="success" />
            <StatCard label="Outstanding" value={compactMoney(metrics.outstanding)} icon="Wallet" tone="warning" />
            <StatCard label="Collection rate" value={`${metrics.collectionRate}%`} icon="TrendingUp" tone="gold" />
          </div>
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Outstanding balance by class level</h2>
            <p className="mt-1 text-sm text-muted-foreground">Thousands of naira.</p>
            <Separator className="my-5" />
            <BarChart data={outstandingByLevel} unit="k" />
          </Card>
        </TabsContent>

        <TabsContent value="enquiries" className="mt-6 space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Website enquiries by category</h2>
            <Separator className="my-5" />
            <BarChart data={enquiriesByCategory} />
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Enquiries" value={enquiries.total} icon="Inbox" tone="info" />
            <StatCard label="Resolved" value={enquiries.resolved} icon="CircleCheck" tone="success" />
          </div>
        </TabsContent>

        <TabsContent value="operations" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Pupils who borrowed" value={`${insights.library.readerShare}%`} hint={`${insights.library.readers} readers`} icon="BookOpen" tone="info" />
            <StatCard label="Books overdue" value={insights.library.overdue} icon="CircleAlert" tone={insights.library.overdue > 0 ? "warning" : "success"} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Library loans per month</h2>
              <Separator className="my-5" />
              <ColumnChart data={insights.library.months.map((m) => ({ label: m.label, value: m.loans }))} caption="Books issued in each of the last six months." />
            </Card>
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Most borrowed books</h2>
              <Separator className="my-5" />
              <BarChart data={insights.library.topBooks} />
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <p className="mt-8 text-xs text-muted-foreground">
        Charts use a single validated
        colour ramp and always label their values, so they remain readable in both themes and for
        colour-blind readers.
      </p>
    </>
  );
}
