import type { Metadata } from "next";
import { CalendarClockIcon, VideoIcon, MapPinIcon } from "lucide-react";

import { EmptyState, StatusPill } from "@/components/common";
import { BookAppointmentDialog } from "@/components/portal/book-appointment";
import { PendingButton } from "@/components/portal/pending-button";
import { RescheduleAppointmentDialog } from "@/components/portal/reschedule-appointment";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireParent } from "@/lib/school/auth";
import { cancelAppointment } from "@/lib/school/actions/portal";
import { api } from "@/convex/_generated/api";
import { studentName } from "@/lib/school/data";
import { getMyChildren } from "@/lib/school/parent";
import { getDirectory } from "@/lib/school/directory";
import { query } from "@/lib/school/convex";
import { formatLongDate } from "@/lib/school/format";
import type { ToneName } from "@/lib/school/format";

export const metadata: Metadata = { title: "Appointments" };

const STATUS_TONE: Record<string, ToneName> = {
  requested: "warning",
  confirmed: "success",
  rescheduled: "info",
  cancelled: "neutral",
  completed: "neutral",
};

export default async function ParentAppointmentsPage() {
  await requireParent();
  const [dir, myChildren, data] = await Promise.all([getDirectory(), getMyChildren(), query(api.appointments.forParent, {})]);
  const mine = data.appointments;

  // Convex only offers slots with teachers who teach one of this parent's children.
  const slots = data.slots.slice(0, 40).map((slot) => ({
    id: slot.id,
    teacherName: dir.teacherName(slot.teacherId),
    date: slot.date,
    time: slot.time,
  }));

  return (
    <>
      <PortalPageHeader
        title="Parent-teacher meetings"
        description="Book, reschedule or cancel a meeting with your child's teachers."
        action={
          slots.length > 0 && myChildren.length > 0 ? (
            <BookAppointmentDialog
              slots={slots}
              options={myChildren.map((c) => ({ id: c.id, name: studentName(c) }))}
            />
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="mb-4 font-heading text-base font-extrabold">Your appointments</h2>
          {mine.length === 0 ? (
            <EmptyState
              icon="CalendarPlus"
              title="No appointments booked"
              description="Book a slot to talk with your child's teacher about their progress."
            />
          ) : (
            <ul className="space-y-3">
              {mine.map((appointment) => {
                const child = myChildren.find((c) => c.id === appointment.studentId);
                return (
                  <li key={appointment.id}>
                    <Card className="gap-0 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-heading text-base font-extrabold">
                            {dir.teacherName(appointment.teacherId)}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {child ? `${studentName(child)} · ${dir.className(child.classId)}` : ""}
                          </p>
                        </div>
                        <StatusPill tone={STATUS_TONE[appointment.status] ?? "neutral"}>
                          {appointment.status}
                        </StatusPill>
                      </div>

                      <Separator className="my-4" />

                      <dl className="grid gap-3 text-sm sm:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <CalendarClockIcon className="size-4 shrink-0 text-gold" />
                          <span className="font-semibold">{formatLongDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarClockIcon className="size-4 shrink-0 text-gold" />
                          <span className="font-semibold">{appointment.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {appointment.mode === "virtual" ? (
                            <VideoIcon className="size-4 shrink-0 text-gold" />
                          ) : (
                            <MapPinIcon className="size-4 shrink-0 text-gold" />
                          )}
                          <span className="font-semibold">
                            {appointment.mode === "virtual" ? "Video call" : "At school"}
                          </span>
                        </div>
                      </dl>

                      {appointment.note ? (
                        <p className="mt-4 rounded-xl bg-muted/70 p-3.5 text-sm leading-relaxed">
                          {appointment.note}
                        </p>
                      ) : null}

                      {appointment.status !== "cancelled" && appointment.status !== "completed" ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <RescheduleAppointmentDialog
                            appointmentId={appointment.id}
                            teacherName={dir.teacherName(appointment.teacherId)}
                            slots={data.slots.filter((s) => s.teacherId === appointment.teacherId).map((s) => ({ id: s.id, date: s.date, time: s.time }))}
                          />
                          <form action={cancelAppointment}>
                            <input type="hidden" name="id" value={appointment.id} />
                            <PendingButton variant="ghost" size="sm" className="font-bold text-destructive" pendingText="Cancelling…">
                              Cancel appointment
                            </PendingButton>
                          </form>
                        </div>
                      ) : null}
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-4 font-heading text-base font-extrabold">Next available slots</h2>
          <Card className="gap-0 p-5">
            {slots.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No slots are currently open. Teachers publish availability at the start of each week.
              </p>
            ) : (
              <ul className="space-y-2">
                {slots.slice(0, 8).map((slot) => (
                  <li key={slot.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{slot.teacherName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatLongDate(slot.date)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-muted px-2.5 py-1 text-xs font-bold tabular-nums">
                      {slot.time}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
