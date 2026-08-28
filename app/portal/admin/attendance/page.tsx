import type { Metadata } from "next";

import { StatCard, StatusPill } from "@/components/common";
import { BarChart, TrendChart } from "@/components/portal/charts";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/school/auth";
import {
  classDisplayName,
  getAttendanceTrend,
  getClasses,
  getStudentsByClass,
  schoolAttendanceRateToday,
  summariseAttendance,
  teacherNameById,
} from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";

export const metadata: Metadata = { title: "Attendance" };

export default async function AdminAttendancePage() {
  await requireAdmin();

  const db = getDb();
  const classes = getClasses();
  const trend = getAttendanceTrend(12);
  const todayRate = schoolAttendanceRateToday();
  const overall = summariseAttendance(db.attendance);

  const byClass = classes
    .map((cls) => {
      const records = db.attendance.filter((a) => a.classId === cls.id);
      const summary = summariseAttendance(records);
      return {
        cls,
        rate: summary.rate,
        absent: summary.absent,
        late: summary.late,
        pupils: getStudentsByClass(cls.id).length,
      };
    })
    .sort((a, b) => a.rate - b.rate);

  const concern = byClass.filter((row) => row.rate < 92);

  return (
    <>
      <PortalPageHeader
        title="Attendance"
        description="School-wide attendance, the trend over recent days, and the classes that need attention."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={`${todayRate}%`}
          hint="Present or late"
          icon="CalendarCheck"
          tone={todayRate >= 95 ? "success" : "warning"}
        />
        <StatCard label="Term average" value={`${overall.rate}%`} icon="TrendingUp" tone={overall.rate >= 95 ? "success" : "warning"} />
        <StatCard label="Absences recorded" value={overall.absent} icon="CalendarX" tone={overall.absent > 0 ? "danger" : "success"} />
        <StatCard
          label="Classes below 92%"
          value={concern.length}
          icon="CircleAlert"
          tone={concern.length > 0 ? "warning" : "success"}
        />
      </div>

      <Card className="mb-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">School attendance rate</h2>
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
          <h2 className="font-heading text-base font-extrabold">Lowest attendance by class</h2>
          <Separator className="my-5" />
          <BarChart
            data={byClass.slice(0, 8).map((row) => ({ label: row.cls.name, value: row.rate }))}
            unit="%"
          />
        </Card>

        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Needs attention</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Classes below the 92 percent threshold, with the class teacher to contact.
          </p>
          <Separator className="my-5" />
          {concern.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Every class is at or above 92 percent attendance.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {concern.map((row) => (
                <li
                  key={row.cls.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{row.cls.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {teacherNameById(row.cls.classTeacherId)}
                    </p>
                  </div>
                  <StatusPill tone={row.rate < 88 ? "danger" : "warning"}>{row.rate}%</StatusPill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">All classes</h2>
        <Separator className="my-5" />
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Class teacher</TableHead>
                <TableHead className="text-right">Pupils</TableHead>
                <TableHead className="text-right">Late</TableHead>
                <TableHead className="text-right">Absent</TableHead>
                <TableHead className="text-right">Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byClass
                .slice()
                .sort((a, b) => a.cls.name.localeCompare(b.cls.name))
                .map((row) => (
                  <TableRow key={row.cls.id}>
                    <TableCell className="font-bold">{classDisplayName(row.cls.id)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {teacherNameById(row.cls.classTeacherId)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.pupils}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.late}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.absent}</TableCell>
                    <TableCell className="text-right">
                      <StatusPill tone={row.rate >= 95 ? "success" : row.rate >= 92 ? "warning" : "danger"}>
                        {row.rate}%
                      </StatusPill>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}
