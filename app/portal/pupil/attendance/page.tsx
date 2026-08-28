import type { Metadata } from "next";

import { EmptyState, StatCard } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { AttendanceLegend, AttendanceStrip } from "@/components/portal/shared";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { requirePupil } from "@/lib/school/auth";
import { getAttendanceForStudent, getStudent, summariseAttendance } from "@/lib/school/data";

export const metadata: Metadata = { title: "My attendance" };

export default async function PupilAttendancePage() {
  const user = await requirePupil();
  const student = user.studentId ? getStudent(user.studentId) : null;
  if (!student) {
    return <EmptyState icon="Backpack" title="No pupil record" description="Please ask your class teacher." />;
  }

  const records = getAttendanceForStudent(student.id);
  const summary = summariseAttendance(records);

  return (
    <>
      <PortalPageHeader
        title="My attendance"
        description="How many days you have been at school this term."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My attendance" value={`${summary.rate}%`} icon="CalendarCheck" tone={summary.rate >= 95 ? "success" : "warning"} />
        <StatCard label="Days present" value={summary.present} icon="CircleCheck" tone="success" />
        <StatCard label="Days late" value={summary.late} icon="Clock" tone={summary.late > 3 ? "warning" : "neutral"} />
        <StatCard label="Days absent" value={summary.absent} icon="CircleAlert" tone={summary.absent > 2 ? "danger" : "neutral"} />
      </div>

      <Card className="mt-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">My last 30 school days</h2>
        <Separator className="my-4" />
        <AttendanceStrip records={records} />
        <div className="mt-5">
          <AttendanceLegend />
        </div>
        <Separator className="my-5" />
        <Progress value={summary.rate} />
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {summary.rate >= 95
            ? "Brilliant attendance. Being in school every day is one of the biggest things that helps you learn."
            : "Try to be in school every day you can. If you are unwell, your parent should tell your class teacher."}
        </p>
      </Card>
    </>
  );
}
