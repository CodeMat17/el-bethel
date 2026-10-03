import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";

import { StatCard, StatusPill } from "@/components/common";
import { BarChart, ColumnChart, HeroFigure, TrendChart } from "@/components/portal/charts";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { APPLICATION_STATUS, compactMoney, formatDate, money } from "@/lib/school/format";
import type { ApplicationStatus } from "@/lib/school/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  await requireAdmin();

  const [metrics, attendance, academics, events, recentAudit, dir] = await Promise.all([
    query(api.dashboard.metrics, {}),
    query(api.attendance.schoolOverview, { days: 10 }),
    query(api.dashboard.academics, {}),
    query(api.content.events, { upcomingOnly: true, limit: 4 }),
    query(api.dashboard.recentAudit, { limit: 6 }),
    getDirectory(),
  ]);
  const enrolment = metrics.enrolment;
  const applications = metrics.applicationsByStatus;
  const trend = attendance.trend;
  const grades = academics.grades;
  const term = dir.activeTerm;
  const expected = metrics.submissions.total;

  return (
    <>
      <PortalPageHeader
        eyebrow={`${term?.name ?? "No current term set"} · ${formatDate(new Date())}`}
        title="School control centre"
        description="Enrolment, admissions, attendance, academics and finance at a glance."
        action={
          <Button size="lg" className="font-bold" render={<Link href="/portal/admin/reports" />}>
            Full reports
            <ArrowRightIcon />
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pupils" value={metrics.students} hint="Active enrolment" icon="Backpack" tone="info" href="/portal/admin/students" />
        <StatCard label="Teachers" value={metrics.teachers} hint="Active teaching staff" icon="GraduationCap" tone="neutral" href="/portal/admin/teachers" />
        <StatCard label="Parents" value={metrics.parents} hint="Registered families" icon="Users" tone="neutral" href="/portal/admin/parents" />
        <StatCard label="New applicants" value={metrics.newApplicants} hint="Last 30 days" icon="UserPlus" tone="gold" href="/portal/admin/admissions" />
        <StatCard
          label="Pending admissions"
          value={metrics.pendingAdmissions}
          hint="Awaiting review or documents"
          icon="FileCheck"
          tone={metrics.pendingAdmissions > 0 ? "warning" : "success"}
          href="/portal/admin/admissions"
        />
        <StatCard
          label="Today's attendance"
          value={`${attendance.day.rate}%`}
          hint={`Present or late · ${formatDate(attendance.date)}`}
          icon="CalendarCheck"
          tone={attendance.day.rate >= 95 ? "success" : "warning"}
          href="/portal/admin/attendance"
        />
        <StatCard label="Assignments" value={metrics.assignments} hint="Published this term" icon="ClipboardList" tone="neutral" href="/portal/admin/assignments" />
        <StatCard label="Upcoming events" value={metrics.upcomingEvents} hint="On the school calendar" icon="CalendarDays" tone="neutral" href="/portal/admin/events" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Fees collected</h2>
          <Separator className="my-5" />
          <HeroFigure
            value={compactMoney(metrics.feesCollected)}
            label={`of ${compactMoney(metrics.feesBilled)} billed this term`}
            progress={metrics.collectionRate}
            detail={`${metrics.collectionRate}% collected · ${money(metrics.outstanding)} outstanding`}
          />
          <Button variant="outline" size="lg" className="mt-6 w-full font-bold" render={<Link href="/portal/admin/fees" />}>
            Fee ledger
            <ArrowRightIcon />
          </Button>
        </Card>

        <Card className="gap-0 p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base font-extrabold">School attendance rate</h2>
            <Button variant="link" size="sm" className="font-bold" render={<Link href="/portal/admin/attendance" />}>
              Detail <ArrowRightIcon />
            </Button>
          </div>
          <Separator className="my-5" />
          <TrendChart
            data={trend.map((point) => ({ label: formatDate(point.date), value: point.rate }))}
            caption="Percentage of pupils present or late, last ten school days."
            min={80}
            max={100}
          />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base font-extrabold">Enrolment by class level</h2>
            <Button variant="link" size="sm" className="font-bold" render={<Link href="/portal/admin/classes" />}>
              Classes <ArrowRightIcon />
            </Button>
          </div>
          <Separator className="my-5" />
          <BarChart data={enrolment.map((row) => ({ label: row.level, value: row.count }))} />
        </Card>

        <Card className="gap-0 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base font-extrabold">Applications by status</h2>
            <Button variant="link" size="sm" className="font-bold" render={<Link href="/portal/admin/admissions" />}>
              Admissions <ArrowRightIcon />
            </Button>
          </div>
          <Separator className="my-5" />
          <BarChart
            data={applications.map((row) => ({
              label: APPLICATION_STATUS[row.status as ApplicationStatus]?.label ?? row.status,
              value: row.count,
            }))}
          />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Grade distribution</h2>
          <p className="mt-1 text-sm text-muted-foreground">{academics.term ? `${academics.term.name} — all subjects, whole school.` : "No results entered yet."}</p>
          <Separator className="my-5" />
          <ColumnChart
            data={grades.map((row) => ({ label: row.grade, value: row.count }))}
            caption="Number of subject results in each grade band."
          />
        </Card>

        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Assignment engagement</h2>
          <Separator className="my-5" />
          <div className="grid gap-4 sm:grid-cols-2">
            <HeroFigure
              value={String(expected)}
              label="Submissions received"
              detail={`${metrics.submissions.graded} marked · average ${metrics.submissions.averagePercent}%`}
            />
            <HeroFigure
              value={String(metrics.submissions.pending)}
              label="Awaiting marking"
              detail="Written answers waiting for a teacher"
            />
          </div>
          <Button variant="outline" size="lg" className="mt-6 w-full font-bold" render={<Link href="/portal/admin/assignments" />}>
            Assignment reports
            <ArrowRightIcon />
          </Button>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base font-extrabold">Recent administrative activity</h2>
            <Button variant="link" size="sm" className="font-bold" render={<Link href="/portal/admin/audit-logs" />}>
              Audit log <ArrowRightIcon />
            </Button>
          </div>
          <Separator className="my-5" />
          <ul className="space-y-3">
            {recentAudit.map((entry) => (
              <li key={entry.id} className="rounded-xl border bg-card p-3.5">
                <p className="text-sm font-bold">{entry.action}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {entry.actorName} · {entry.entity}
                  {entry.previousValue ? ` · ${entry.previousValue} → ${entry.newValue}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="gap-0 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base font-extrabold">Upcoming events</h2>
            <Button variant="link" size="sm" className="font-bold" render={<Link href="/portal/admin/events" />}>
              Manage <ArrowRightIcon />
            </Button>
          </div>
          <Separator className="my-5" />
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-navy text-navy-foreground">
                  <span className="font-heading text-sm leading-none font-extrabold text-gold">
                    {new Date(event.date).getUTCDate()}
                  </span>
                  <span className="text-[0.55rem] font-bold uppercase">
                    {new Date(event.date).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{event.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{event.venue}</p>
                </div>
                {event.requiresRegistration ? <StatusPill tone="gold">Registration</StatusPill> : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
