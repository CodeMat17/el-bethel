import type { Metadata } from "next";

import { EmptyState } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { TimetableGrid } from "@/components/portal/shared";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requirePupil } from "@/lib/school/auth";
import { DAY_NAMES } from "@/lib/school/config";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";
import { schoolDay, sortTimetable } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";

export const metadata: Metadata = { title: "My timetable" };

export default async function PupilTimetablePage() {
  const user = await requirePupil();
  const student = user.studentId ? await query(api.people.myStudent, {}) : null;
  if (!student) {
    return <EmptyState icon="Backpack" title="No pupil record" description="Please ask your class teacher." />;
  }

  const [rows, dir] = await Promise.all([query(api.timetable.forClass, { classId: student.classId }), getDirectory()]);
  const slots = sortTimetable(rows);
  const activeDay = schoolDay();

  return (
    <>
      <PortalPageHeader
        eyebrow={dir.className(student.classId)}
        title="My timetable"
        description="Your lessons for the whole week."
      />

      {/* Mobile: day-by-day cards */}
      <div className="space-y-5 lg:hidden">
        {[1, 2, 3, 4, 5].map((day) => (
          <Card
            key={day}
            className={`gap-0 p-5 ${day === activeDay ? "border-gold/50 bg-gold/8" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-extrabold">{DAY_NAMES[day]}</h2>
              {day === activeDay ? (
                <span className="rounded-full bg-gold px-2.5 py-1 text-[0.65rem] font-extrabold text-gold-foreground">
                  Today
                </span>
              ) : null}
            </div>
            <Separator className="my-4" />
            <ol className="space-y-2">
              {slots
                .filter((s) => s.day === day)
                .map((slot) => (
                  <li
                    key={slot.id}
                    className={`flex min-h-12 items-center gap-3 rounded-xl border p-3 ${
                      slot.label ? "border-gold/30 bg-gold/10 font-bold" : "bg-card"
                    }`}
                  >
                    <span className="w-16 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                      {slot.startTime}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">
                        {slot.label ?? dir.subjectName(slot.subjectId)}
                      </span>
                      {slot.teacherId ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {dir.teacherName(slot.teacherId)}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
            </ol>
          </Card>
        ))}
      </div>

      <div className="hidden lg:block">
        <TimetableGrid slots={slots} dir={dir} />
      </div>
    </>
  );
}
