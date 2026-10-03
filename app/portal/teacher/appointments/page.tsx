import type { Metadata } from "next";
import { CalendarClockIcon, CheckIcon, MapPinIcon, VideoIcon, XIcon } from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AvailabilityForm } from "@/components/portal/availability-form";
import { PortalPageHeader } from "@/components/portal/page-header";
import { PendingButton } from "@/components/portal/pending-button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireTeacher } from "@/lib/school/auth";
import { cancelAppointment, completeAppointment, removeAvailability } from "@/lib/school/actions/portal";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";
import { studentName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { todayKey } from "@/lib/school/data";
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

export default async function TeacherAppointmentsPage() {
  await requireTeacher();
  const [data, dir] = await Promise.all([query(api.appointments.forTeacher, {}), getDirectory()]);
  const mine = data.appointments;
  const slots = data.slots;
  const today = todayKey();

  return (
    <>
      <PortalPageHeader
        title="Parent meetings"
        description="Publish your availability and see who has booked which slot."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Booked meetings" value={mine.filter((a) => a.status !== "cancelled" && a.status !== "completed").length} icon="CalendarPlus" tone="info" />
        <StatCard label="Open slots" value={slots.filter((s) => !s.taken).length} icon="Clock" tone="success" />
        <StatCard label="Slots published" value={slots.length} icon="CalendarRange" tone="neutral" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="mb-4 font-heading text-base font-extrabold">Upcoming meetings</h2>
          {mine.length === 0 ? (
            <EmptyState
              icon="CalendarPlus"
              title="No meetings booked"
              description="Publish some availability and parents will be able to book with you."
            />
          ) : (
            <ul className="space-y-3">
              {mine.map((appointment) => {
                const child = appointment.child;
                return (
                  <li key={appointment.id}>
                    <Card className="gap-0 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-heading text-base font-extrabold">
                            {appointment.parentName}
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
                          <span className="font-extrabold">Parent&apos;s note · </span>
                          {appointment.note}
                        </p>
                      ) : null}

                      {appointment.parentPhone ? (
                        <p className="mt-3 text-xs text-muted-foreground">Parent&apos;s phone: {appointment.parentPhone}</p>
                      ) : null}

                      {appointment.status !== "cancelled" && appointment.status !== "completed" ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {appointment.date <= today ? (
                            <ConfirmAction action={completeAppointment.bind(null, appointment.id)} icon={<CheckIcon />} pendingText="Saving…">
                              Mark as held
                            </ConfirmAction>
                          ) : null}
                          <form action={cancelAppointment}>
                            <input type="hidden" name="id" value={appointment.id} />
                            <PendingButton variant="ghost" size="sm" className="font-bold text-destructive" pendingText="Cancelling…">
                              Cancel meeting
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

        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Publish a new slot</h2>
            <Separator className="my-4" />
            <AvailabilityForm />
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">My published slots</h2>
            <Separator className="my-4" />
            {slots.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                You have not published any availability yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {slots.slice(0, 30).map((slot) => (
                  <li
                    key={slot.id}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm"
                  >
                    <span className="min-w-0 truncate font-semibold">{formatLongDate(slot.date)}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{slot.time}</span>
                    {slot.taken ? (
                      <StatusPill tone="neutral">Booked</StatusPill>
                    ) : (
                      <ConfirmAction
                        action={removeAvailability.bind(null, slot.id)}
                        icon={<XIcon />}
                        variant="ghost"
                        className="font-bold text-muted-foreground"
                        pendingText="…"
                      >
                        Remove
                      </ConfirmAction>
                    )}
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
