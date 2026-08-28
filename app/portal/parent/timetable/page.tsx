import type { Metadata } from "next";

import { EmptyState } from "@/components/common";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { PortalPageHeader } from "@/components/portal/page-header";
import { TimetableGrid } from "@/components/portal/shared";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireParent } from "@/lib/school/auth";
import { DAY_NAMES } from "@/lib/school/config";
import {
  childrenForSession,
  classDisplayName,
  getSubject,
  getTimetableForClass,
  getTodaySlots,
  resolveActiveChild,
  studentName,
  teacherNameById,
} from "@/lib/school/data";
import { DEMO_TODAY } from "@/lib/school/seed";

export const metadata: Metadata = { title: "Timetable" };

export default async function ParentTimetablePage({ searchParams }: PageProps<"/portal/parent/timetable">) {
  const user = await requireParent();
  const params = await searchParams;
  const child = resolveActiveChild(user, typeof params.child === "string" ? params.child : undefined);
  const myChildren = childrenForSession(user);

  if (!child) {
    return <EmptyState icon="Users" title="No children linked" description="Contact the school office." />;
  }

  const slots = getTimetableForClass(child.classId);
  const today = getTodaySlots(child.classId);
  const weekday = DEMO_TODAY.getUTCDay();
  const dayLabel = DAY_NAMES[weekday === 0 || weekday === 6 ? 1 : weekday];

  return (
    <>
      <PortalPageHeader
        eyebrow={`${studentName(child)} · ${classDisplayName(child.classId)}`}
        title="Class timetable"
        description="The full weekly timetable for your child's class, including breaks."
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

      {/* Mobile: today's list. Desktop: full grid. */}
      <Card className="mb-6 gap-0 p-5 lg:hidden">
        <h2 className="font-heading text-base font-extrabold">{dayLabel}</h2>
        <Separator className="my-4" />
        <ol className="space-y-2">
          {today.map((slot) => (
            <li
              key={slot.id}
              className={`flex items-center gap-3 rounded-xl border p-3 ${slot.label ? "border-gold/30 bg-gold/8" : "bg-card"}`}
            >
              <span className="w-20 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                {slot.startTime}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">
                  {slot.label ?? getSubject(slot.subjectId ?? "")?.name}
                </span>
                {slot.teacherId ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {teacherNameById(slot.teacherId)}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="hidden lg:block">
        <TimetableGrid slots={slots} />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Timetables are set by the school administrator and can change at the start of a term. Any change
        is announced through notifications before it takes effect.
      </p>
    </>
  );
}
