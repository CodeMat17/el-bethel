import type { Metadata } from "next";

import { EmptyState } from "@/components/common";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { PortalPageHeader } from "@/components/portal/page-header";
import { TimetableGrid } from "@/components/portal/shared";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireParent } from "@/lib/school/auth";
import { DAY_NAMES } from "@/lib/school/config";
import { api } from "@/convex/_generated/api";
import { schoolDay, slotsForDay, sortTimetable, studentName } from "@/lib/school/data";
import { getMyChildren, resolveActiveChild } from "@/lib/school/parent";
import { getDirectory } from "@/lib/school/directory";
import { query } from "@/lib/school/convex";

export const metadata: Metadata = { title: "Timetable" };

export default async function ParentTimetablePage({ searchParams }: PageProps<"/portal/parent/timetable">) {
  await requireParent();
  const dir = await getDirectory();
  const params = await searchParams;
  const child = await resolveActiveChild(typeof params.child === "string" ? params.child : undefined);
  const myChildren = await getMyChildren();

  if (!child) {
    return <EmptyState icon="Users" title="No children linked" description="Contact the school office." />;
  }

  const slots = sortTimetable(await query(api.timetable.forClass, { classId: child.classId }));
  const today = slotsForDay(slots);
  const dayLabel = DAY_NAMES[schoolDay()];

  return (
    <>
      <PortalPageHeader
        eyebrow={`${studentName(child)} · ${dir.className(child.classId)}`}
        title="Class timetable"
        description="The full weekly timetable for your child's class, including breaks."
        action={
          <ChildSwitcher
            activeId={child.id}
            options={myChildren.map((c) => ({
              id: c.id,
              name: studentName(c),
              className: dir.className(c.classId),
              avatarSeed: c.avatarSeed,
              photoUrl: c.photo?.url,
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
                  {slot.label ?? dir.subjectName(slot.subjectId ?? "")}
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

      <div className="hidden lg:block">
        <TimetableGrid slots={slots} dir={dir} />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Timetables are set by the school administrator and can change at the start of a term. Any change
        is announced through notifications before it takes effect.
      </p>
    </>
  );
}
