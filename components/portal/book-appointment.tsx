"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarPlusIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { bookAppointment, type SimpleState } from "@/lib/school/actions/portal";
import { formatDate } from "@/lib/school/format";

const INITIAL: SimpleState = { ok: false };

export interface AvailabilityOption {
  id: string;
  teacherName: string;
  date: string;
  time: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11 w-full font-bold" disabled={pending}>
      {pending ? <Spinner /> : <CalendarPlusIcon />}
      {pending ? "Booking…" : "Confirm booking"}
    </Button>
  );
}

export function BookAppointmentDialog({
  slots,
  options,
}: {
  slots: AvailabilityOption[];
  options: { id: string; name: string }[];
}) {
  const [state, action] = useActionState<SimpleState, FormData>(bookAppointment, INITIAL);
  const [requestedOpen, setRequestedOpen] = React.useState(false);
  // Derived, not synchronised: a successful action closes the dialog without an effect.
  const open = requestedOpen && !state.ok;

  React.useEffect(() => {
    if (state.ok && state.message) toast.success("Appointment confirmed", { description: state.message });
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setRequestedOpen}>
      <DialogTrigger render={<Button size="lg" className="font-bold" />}>
        <CalendarPlusIcon />
        Book a meeting
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book a parent-teacher meeting</DialogTitle>
          <DialogDescription>
            Choose an available slot. You will receive a confirmation immediately.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-5">
          {state.message && !state.ok ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
            >
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
              {state.message}
            </div>
          ) : null}

          <Field>
            <FieldLabel htmlFor="studentId">Which child?</FieldLabel>
            <Select name="studentId" defaultValue={options[0]?.id}>
              <SelectTrigger id="studentId" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((child) => (
                  <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="slotId">Available slot</FieldLabel>
            <Select name="slotId" defaultValue={slots[0]?.id}>
              <SelectTrigger id="slotId" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {slots.map((slot) => (
                  <SelectItem key={slot.id} value={slot.id}>
                    {slot.teacherName} · {formatDate(slot.date)} at {slot.time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <fieldset>
            <legend className="text-sm font-extrabold">How would you like to meet?</legend>
            <RadioGroup name="mode" defaultValue="in_person" className="mt-3 grid gap-2">
              {[
                { value: "in_person", label: "In person, at school" },
                { value: "virtual", label: "Video call" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3.5 text-sm font-semibold transition-colors has-data-checked:border-gold has-data-checked:bg-gold/8"
                >
                  <RadioGroupItem value={option.value} />
                  {option.label}
                </label>
              ))}
            </RadioGroup>
          </fieldset>

          <Field>
            <FieldLabel htmlFor="note">What would you like to discuss? (optional)</FieldLabel>
            <Textarea id="note" name="note" rows={3} maxLength={500} />
          </Field>

          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
