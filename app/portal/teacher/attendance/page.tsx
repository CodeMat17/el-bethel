import Link from "next/link";
import type { Metadata } from "next";

import { EmptyState, StatCard } from "@/components/common";
import { AttendanceRegister, type RegisterPupil } from "@/components/portal/attendance-register";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isAdmin, requireTeacher } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { studentName, summariseAttendance, todayKey } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { formatLongDate } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Attendance" };

export default async function TeacherAttendancePage({
  searchParams,
}: PageProps<"/portal/teacher/attendance">) {
  const user = await requireTeacher();
  const params = await searchParams;

  const dir = await getDirectory();
  const classes = isAdmin(user) ? dir.classes : dir.classesForTeacher(user.teacherId);
  if (classes.length === 0) {
    return (
      <EmptyState
        icon="School"
        title="No classes assigned"
        description="The school administrator assigns classes at the start of each session."
      />
    );
  }

  // Only ever accept a class this teacher actually teaches.
  const requested = typeof params.class === "string" ? params.class : undefined;
  const cls = classes.find((c) => c.id === requested) ?? classes[0];
  const today = todayKey();
  const date =
    typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date) && params.date <= today
      ? params.date
      : today;

  const [roster, existing] = await Promise.all([
    query(api.people.classRoster, { classId: cls.id as Id<"classes"> }),
    query(api.attendance.classDay, { classId: cls.id as Id<"classes">, date }),
  ]);
  const summary = summariseAttendance(existing);

  const pupils: RegisterPupil[] = roster.map((student) => {
    const record = existing.find((r) => r.studentId === student.id);
    return {
      id: student.id,
      name: studentName(student),
      studentNo: student.studentNo,
      avatarSeed: student.avatarSeed,
      status: record?.status ?? "present",
      note: record?.note ?? "",
    };
  });

  return (
    <>
      <PortalPageHeader
        eyebrow={formatLongDate(date)}
        title="Attendance register"
        description="Mark today's register. Parents of absent pupils are notified automatically."
      />

      <Card className="mb-6 gap-0 p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase">Choose a class</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {classes.map((option) => (
            <Button
              key={option.id}
              variant={option.id === cls.id ? "default" : "outline"}
              size="sm"
              className={cn("font-bold", option.id === cls.id && "pointer-events-none")}
              render={<Link href={`/portal/teacher/attendance?class=${option.id}&date=${date}`} />}
            >
              {option.name}
            </Button>
          ))}
        </div>
      </Card>

      {existing.length > 0 ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Recorded" value={existing.length} icon="ClipboardCheck" tone="info" />
          <StatCard label="Present" value={summary.present} icon="CircleCheck" tone="success" />
          <StatCard label="Late" value={summary.late} icon="Clock" tone="warning" />
          <StatCard label="Absent" value={summary.absent} icon="CircleAlert" tone={summary.absent > 0 ? "danger" : "success"} />
        </div>
      ) : null}

      {/* key remounts the register when the class or date changes, so its local state reseeds. */}
      <AttendanceRegister key={cls.id + ":" + date} classId={cls.id} className={cls.name} date={date} pupils={pupils} />
    </>
  );
}
