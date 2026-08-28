import type { Metadata } from "next";
import { DownloadIcon } from "lucide-react";

import { StatCard } from "@/components/common";
import { BarChart, ColumnChart, HeroFigure, TrendChart } from "@/components/portal/charts";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdmin } from "@/lib/school/auth";
import { CLASS_LEVELS } from "@/lib/school/config";
import {
  getAdminMetrics,
  getApplicationsByStatus,
  getAttendanceTrend,
  getEnrolmentByLevel,
  getGradeDistribution,
  getStudent,
  getSubject,
  getSubmissionRate,
} from "@/lib/school/data";
import { APPLICATION_STATUS, compactMoney, formatDate, money } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";
import type { ApplicationStatus } from "@/lib/school/types";

export const metadata: Metadata = { title: "Reports & analytics" };

export default async function AdminReportsPage() {
  await requireAdmin();

  const db = getDb();
  const metrics = getAdminMetrics();
  const enrolment = getEnrolmentByLevel();
  const trend = getAttendanceTrend(12);
  const grades = getGradeDistribution("term-2025-3");
  const submissions = getSubmissionRate();
  const applications = getApplicationsByStatus();

  const results = db.results.filter((r) => r.termId === "term-2025-3");
  const bySubject = Array.from(new Set(results.map((r) => r.subjectId)))
    .map((subjectId) => {
      const rows = results.filter((r) => r.subjectId === subjectId);
      return {
        label: getSubject(subjectId)?.name ?? subjectId,
        value: Math.round(rows.reduce((s, r) => s + r.total, 0) / Math.max(1, rows.length)),
      };
    })
    .sort((a, b) => b.value - a.value);

  const applicationsByLevel = CLASS_LEVELS.map((level) => ({
    label: level.name,
    value: db.applications.filter((a) => a.intendedLevelId === level.id).length,
  })).filter((row) => row.value > 0);

  const outstandingByLevel = CLASS_LEVELS.map((level) => {
    const classIds = db.classes.filter((c) => c.levelId === level.id).map((c) => c.id);
    const amount = db.invoices
      .filter((i) => {
        const student = getStudent(i.studentId);
        return student ? classIds.includes(student.classId) : false;
      })
      .reduce((sum, i) => sum + (i.total - i.amountPaid), 0);
    return { label: level.name, value: Math.round(amount / 1000), hint: money(amount) };
  });

  const enquiriesByCategory = ["admissions", "fees", "academics", "transport", "general"].map((category) => ({
    label: category.charAt(0).toUpperCase() + category.slice(1),
    value: db.enquiries.filter((e) => e.category === category).length,
  }));

  return (
    <>
      <PortalPageHeader
        title="Reports & analytics"
        description="Academic, attendance, admissions, finance and enquiry reporting across the school."
        action={
          <Button variant="outline" size="lg" className="font-bold" disabled>
            <DownloadIcon />
            Export report
          </Button>
        }
      />

      <Tabs defaultValue="academic">
        <TabsList className="h-auto w-full overflow-x-auto sm:w-fit">
          {[
            ["academic", "Academic"],
            ["attendance", "Attendance"],
            ["assignments", "Assignments"],
            ["admissions", "Admissions"],
            ["finance", "Finance"],
            ["enquiries", "Enquiries"],
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
              <p className="mt-1 text-sm text-muted-foreground">Third Term 2025/2026, all subjects.</p>
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
        </TabsContent>

        <TabsContent value="attendance" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Today" value={`${metrics.attendanceRate}%`} icon="CalendarCheck" tone="success" />
            <StatCard label="Records held" value={db.attendance.length} icon="ClipboardCheck" tone="neutral" />
            <StatCard
              label="Absences"
              value={db.attendance.filter((a) => a.status === "absent").length}
              icon="CalendarX"
              tone="warning"
            />
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
        </TabsContent>

        <TabsContent value="assignments" className="mt-6 space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Submission and grading</h2>
            <Separator className="my-5" />
            <div className="grid gap-6 sm:grid-cols-4">
              <HeroFigure value={`${submissions.submissionRate}%`} label="Submission rate" progress={submissions.submissionRate} />
              <HeroFigure value={String(submissions.graded)} label="Graded" />
              <HeroFigure value={String(submissions.pending)} label="Awaiting grading" />
              <HeroFigure value={String(submissions.late)} label="Late submissions" />
            </div>
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
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Enquiries" value={db.enquiries.length} icon="Inbox" tone="info" />
            <StatCard label="Resolved" value={db.enquiries.filter((e) => e.status === "resolved").length} icon="CircleCheck" tone="success" />
            <StatCard label="Tour bookings" value={db.tourBookings.length} icon="MapPin" tone="gold" />
          </div>
        </TabsContent>
      </Tabs>

      <p className="mt-8 text-xs text-muted-foreground">
        Report export is disabled in this demonstration environment. Charts use a single validated
        colour ramp and always label their values, so they remain readable in both themes and for
        colour-blind readers.
      </p>
    </>
  );
}
