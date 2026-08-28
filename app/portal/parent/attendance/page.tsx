import type { Metadata } from "next";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { PortalPageHeader } from "@/components/portal/page-header";
import { AttendanceLegend, AttendanceStrip } from "@/components/portal/shared";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireParent } from "@/lib/school/auth";
import {
  childrenForSession,
  classDisplayName,
  getActiveTerm,
  getAttendanceForStudent,
  resolveActiveChild,
  studentName,
  summariseAttendance,
} from "@/lib/school/data";
import { ATTENDANCE_STATUS, formatLongDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "Attendance" };

export default async function ParentAttendancePage({ searchParams }: PageProps<"/portal/parent/attendance">) {
  const user = await requireParent();
  const params = await searchParams;
  const child = resolveActiveChild(user, typeof params.child === "string" ? params.child : undefined);
  const myChildren = childrenForSession(user);

  if (!child) {
    return <EmptyState icon="Users" title="No children linked" description="Contact the school office." />;
  }

  const records = getAttendanceForStudent(child.id);
  const summary = summariseAttendance(records);
  const term = getActiveTerm();
  const exceptions = records.filter((r) => r.status !== "present");

  return (
    <>
      <PortalPageHeader
        eyebrow={`${studentName(child)} · ${classDisplayName(child.classId)}`}
        title="Attendance"
        description={`Daily attendance recorded by the class teacher for ${term.name}.`}
        action={
          <ChildSwitcher
            activeId={child.id}
            options={myChildren.map((c) => ({
              id: c.id,
              name: studentName(c),
              className: classDisplayName(c.classId),
              avatarSeed: c.avatarSeed,
            }))}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Attendance rate"
          value={`${summary.rate}%`}
          hint={`${summary.total} school days recorded`}
          icon="CalendarCheck"
          tone={summary.rate >= 95 ? "success" : summary.rate >= 90 ? "warning" : "danger"}
        />
        <StatCard label="Present" value={summary.present} icon="CircleCheck" tone="success" />
        <StatCard label="Late" value={summary.late} icon="Clock" tone={summary.late > 3 ? "warning" : "neutral"} />
        <StatCard
          label="Absent"
          value={summary.absent}
          hint={`${summary.excused} excused`}
          icon="CircleAlert"
          tone={summary.absent > 2 ? "danger" : "neutral"}
        />
      </div>

      <Card className="mt-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Last 30 school days</h2>
        <Separator className="my-4" />
        <AttendanceStrip records={records} />
        <div className="mt-5">
          <AttendanceLegend />
        </div>
        <Separator className="my-5" />
        <div>
          <div className="flex items-baseline justify-between text-sm font-bold">
            <span>Term attendance</span>
            <span className="tabular-nums text-muted-foreground">{summary.rate}%</span>
          </div>
          <Progress value={summary.rate} className="mt-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            The school expects an attendance rate of at least 95 percent. Below 90 percent the class
            teacher will contact you to agree a plan.
          </p>
        </div>
      </Card>

      <Card className="mt-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Absences and lateness</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every day {child.firstName} was not marked present, with the reason where one was recorded.
        </p>
        <Separator className="my-4" />
        {exceptions.length === 0 ? (
          <EmptyState
            icon="CalendarCheck"
            title="A perfect record"
            description={`${child.firstName} has been present and on time every day this term.`}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exceptions.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-semibold">{formatLongDate(record.date)}</TableCell>
                    <TableCell>
                      <StatusPill tone={ATTENDANCE_STATUS[record.status].tone}>
                        {ATTENDANCE_STATUS[record.status].label}
                      </StatusPill>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.note ?? "—"}</TableCell>
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
