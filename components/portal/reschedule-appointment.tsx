"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClockIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { rescheduleAppointment } from "@/lib/school/actions/portal";
import { formatDate } from "@/lib/school/format";

/** Move a booked meeting to another open slot with the same teacher. */
export function RescheduleAppointmentDialog({
  appointmentId,
  teacherName,
  slots,
}: {
  appointmentId: string;
  teacherName: string;
  slots: { id: string; date: string; time: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [slotId, setSlotId] = React.useState(slots[0]?.id ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  if (slots.length === 0) {
    return (
      <Button variant="outline" size="sm" className="font-bold" disabled title={`${teacherName} has no other open slots`}>
        <CalendarClockIcon />
        Reschedule
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="font-bold" />}>
        <CalendarClockIcon />
        Reschedule
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move this meeting</DialogTitle>
          <DialogDescription>Choose another open slot with {teacherName}. Your current slot is released for other parents.</DialogDescription>
        </DialogHeader>
        {error ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        ) : null}
        <Field>
          <FieldLabel htmlFor={`slot-${appointmentId}`}>New slot</FieldLabel>
          <Select value={slotId} items={slots.map((s) => ({ value: s.id, label: `${formatDate(s.date)} at ${s.time}` }))} onValueChange={(v) => setSlotId(String(v ?? ""))}>
            <SelectTrigger id={`slot-${appointmentId}`} className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {slots.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {formatDate(s.date)} at {s.time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button
          size="lg"
          className="h-11 w-full font-bold"
          disabled={pending || !slotId}
          onClick={() =>
            startTransition(async () => {
              const res = await rescheduleAppointment(appointmentId, slotId);
              if (!res.ok) return setError(res.message ?? "That didn't work.");
              toast.success(res.message ?? "Meeting moved");
              setOpen(false);
              router.refresh();
            })
          }
        >
          {pending ? <Spinner /> : <CalendarClockIcon />}
          {pending ? "Moving…" : "Move meeting"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
