"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarCheckIcon, CheckCircle2Icon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { bookTour, type PublicFormState } from "@/lib/school/actions/public";

const INITIAL: PublicFormState = { ok: false };

const TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];

const MODES = [
  { value: "physical", label: "Physical school tour", detail: "About 45 minutes on campus, during a normal school day." },
  { value: "virtual", label: "Virtual tour", detail: "A guided video walkthrough with time for your questions." },
  { value: "consultation", label: "Admission consultation", detail: "A focused conversation about your child and the right class." },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11 w-full font-bold sm:w-auto" disabled={pending}>
      {pending ? <Spinner /> : <CalendarCheckIcon />}
      {pending ? "Requesting…" : "Request this visit"}
    </Button>
  );
}

export function TourForm({ levels }: { levels: { id: string; name: string }[] }) {
  const [state, action] = useActionState<PublicFormState, FormData>(bookTour, INITIAL);

  React.useEffect(() => {
    if (state.ok && state.message) toast.success("Visit requested", { description: state.message });
  }, [state]);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center">
        <CheckCircle2Icon className="mx-auto size-10 text-success" />
        <h3 className="mt-4 font-heading text-lg font-extrabold">Visit requested</h3>
        {state.reference ? (
          <p className="mt-2 font-mono text-sm font-bold">{state.reference}</p>
        ) : null}
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && !state.ok ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
        >
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </div>
      ) : null}

      <fieldset>
        <legend className="text-sm font-extrabold">What kind of visit would you like?</legend>
        <RadioGroup name="mode" defaultValue="physical" className="mt-3 grid gap-3">
          {MODES.map((mode) => (
            <label
              key={mode.value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 transition-colors has-data-checked:border-gold has-data-checked:bg-gold/8"
            >
              <RadioGroupItem value={mode.value} className="mt-0.5" />
              <span>
                <span className="block text-sm font-extrabold">{mode.label}</span>
                <span className="block text-xs text-muted-foreground">{mode.detail}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
        {state.fieldErrors?.mode ? <FieldError className="mt-2">{state.fieldErrors.mode}</FieldError> : null}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(state.fieldErrors?.parentName) || undefined}>
          <FieldLabel htmlFor="parentName">Your name</FieldLabel>
          <Input id="parentName" name="parentName" autoComplete="name" required className="h-11" />
          {state.fieldErrors?.parentName ? <FieldError>{state.fieldErrors.parentName}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.phone) || undefined}>
          <FieldLabel htmlFor="tour-phone">Phone number</FieldLabel>
          <Input id="tour-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="h-11" />
          {state.fieldErrors?.phone ? <FieldError>{state.fieldErrors.phone}</FieldError> : null}
        </Field>
      </div>

      <Field data-invalid={Boolean(state.fieldErrors?.email) || undefined}>
        <FieldLabel htmlFor="tour-email">Email address</FieldLabel>
        <Input id="tour-email" name="email" type="email" inputMode="email" autoComplete="email" required className="h-11" />
        {state.fieldErrors?.email ? <FieldError>{state.fieldErrors.email}</FieldError> : null}
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field data-invalid={Boolean(state.fieldErrors?.preferredDate) || undefined}>
          <FieldLabel htmlFor="preferredDate">Preferred date</FieldLabel>
          <Input id="preferredDate" name="preferredDate" type="date" required className="h-11" />
          <FieldDescription>Weekdays only</FieldDescription>
          {state.fieldErrors?.preferredDate ? <FieldError>{state.fieldErrors.preferredDate}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.preferredTime) || undefined}>
          <FieldLabel htmlFor="preferredTime">Preferred time</FieldLabel>
          <Select name="preferredTime" defaultValue="10:00">
            <SelectTrigger id="preferredTime" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMES.map((time) => (
                <SelectItem key={time} value={time}>{time}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.preferredTime ? <FieldError>{state.fieldErrors.preferredTime}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.visitors) || undefined}>
          <FieldLabel htmlFor="visitors">Number of visitors</FieldLabel>
          <Input id="visitors" name="visitors" type="number" min={1} max={8} defaultValue={2} required className="h-11" />
          {state.fieldErrors?.visitors ? <FieldError>{state.fieldErrors.visitors}</FieldError> : null}
        </Field>
      </div>

      <Field data-invalid={Boolean(state.fieldErrors?.intendedLevelId) || undefined}>
        <FieldLabel htmlFor="intendedLevelId">Class you are interested in</FieldLabel>
        <Select name="intendedLevelId" defaultValue={levels[0]?.id}>
          <SelectTrigger id="intendedLevelId" className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {levels.map((level) => (
              <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.intendedLevelId ? <FieldError>{state.fieldErrors.intendedLevelId}</FieldError> : null}
      </Field>

      <Field>
        <FieldLabel htmlFor="notes">Anything we should know? (optional)</FieldLabel>
        <Textarea id="notes" name="notes" rows={3} maxLength={1000} placeholder="Particular questions, accessibility needs, or something about your child we should know." />
      </Field>

      <SubmitButton />
    </form>
  );
}
