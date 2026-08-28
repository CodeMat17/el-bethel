import type { Metadata } from "next";

import { EmptyState } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireTeacher } from "@/lib/school/auth";
import { DAY_NAMES, PERIODS } from "@/lib/school/config";
import { classDisplayName, getSubject } from "@/lib/school/data";
import { getDb } from "@/lib/school/store";
import { DEMO_TODAY } from "@/lib/school/seed";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My timetable" };

export default async function TeacherTimetablePage() {
  const user = await requireTeacher();
  if (!user.teacherId) {
    return <EmptyState icon="GraduationCap" title="No teaching record" description="Contact the school administrator." />;
  }

  // A teacher's timetable is their own lessons only — never the whole school grid.
  const slots = getDb().timetable.filter((s) => s.teacherId === user.teacherId);
  const byKey = new Map(slots.map((s) => [`${s.day}-${s.period}`, s]));
  const weekday = DEMO_TODAY.getUTCDay();
  const activeDay = weekday === 0 || weekday === 6 ? 1 : weekday;

  const lessonsPerDay = [1, 2, 3, 4, 5].map((day) => ({
    day,
    lessons: slots.filter((s) => s.day === day).sort((a, b) => a.period - b.period),
  }));

  return (
    <>
      <PortalPageHeader
        title="My timetable"
        description={`${slots.length} timetabled lessons a week across your classes.`}
      />

      {/* Mobile: day cards */}
      <div className="space-y-5 lg:hidden">
        {lessonsPerDay.map(({ day, lessons }) => (
          <Card key={day} className={cn("gap-0 p-5", day === activeDay && "border-gold/50 bg-gold/8")}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-extrabold">{DAY_NAMES[day]}</h2>
              <span className="text-xs font-bold text-muted-foreground">{lessons.length} lessons</span>
            </div>
            <Separator className="my-4" />
            {lessons.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No lessons.</p>
            ) : (
              <ol className="space-y-2">
                {lessons.map((slot) => (
                  <li key={slot.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                    <span className="w-16 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                      {slot.startTime}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">
                        {getSubject(slot.subjectId ?? "")?.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {classDisplayName(slot.classId)}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        ))}
      </div>

      {/* Desktop: grid */}
      <div className="hidden overflow-x-auto rounded-2xl border bg-card lg:block">
        <table className="w-full min-w-3xl text-sm">
          <caption className="sr-only">My weekly teaching timetable</caption>
          <thead className="bg-muted/70">
            <tr>
              <th scope="col" className="w-28 px-3 py-3 text-left text-xs font-extrabold uppercase">Time</th>
              {[1, 2, 3, 4, 5].map((day) => (
                <th
                  key={day}
                  scope="col"
                  className={cn(
                    "px-3 py-3 text-left text-xs font-extrabold uppercase",
                    day === activeDay && "text-gold-foreground dark:text-gold",
                  )}
                >
                  {DAY_NAMES[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.filter((p) => !p.label).map((period) => (
              <tr key={period.period} className="border-t">
                <th scope="row" className="px-3 py-3 text-left text-xs font-bold tabular-nums text-muted-foreground">
                  {period.startTime}
                  <span className="block font-normal">{period.endTime}</span>
                </th>
                {[1, 2, 3, 4, 5].map((day) => {
                  const slot = byKey.get(`${day}-${period.period}`);
                  return (
                    <td key={day} className="px-2 py-2">
                      {slot ? (
                        <div className="rounded-lg border bg-background p-2.5">
                          <p className="truncate text-xs font-bold">
                            {getSubject(slot.subjectId ?? "")?.name}
                          </p>
                          <p className="mt-0.5 truncate text-[0.68rem] text-muted-foreground">
                            {classDisplayName(slot.classId)}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed p-2.5 text-center text-[0.68rem] text-muted-foreground">
                          Free
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
