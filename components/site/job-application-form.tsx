"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2Icon, PaperclipIcon, SendIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { submitJobApplication, type PublicFormState } from "@/lib/school/actions/public";
import { fileSize } from "@/lib/school/format";

const INITIAL: PublicFormState = { ok: false };
const MAX_BYTES = 5 * 1024 * 1024;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11 w-full font-bold" disabled={pending}>
      {pending ? <Spinner /> : <SendIcon />}
      {pending ? "Sending…" : "Submit application"}
    </Button>
  );
}

export function JobApplicationForm({ vacancySlug }: { vacancySlug: string }) {
  const [state, action] = useActionState<PublicFormState, FormData>(submitJobApplication, INITIAL);
  const [cvName, setCvName] = React.useState<string | null>(null);
  const [cvError, setCvError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (state.ok && state.message) toast.success("Application received", { description: state.message });
  }, [state]);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center">
        <CheckCircle2Icon className="mx-auto size-10 text-success" />
        <h3 className="mt-4 font-heading text-lg font-extrabold">Application received</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="vacancySlug" value={vacancySlug} />

      {state.message && !state.ok ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
        >
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </div>
      ) : null}

      <Field data-invalid={Boolean(state.fieldErrors?.name) || undefined}>
        <FieldLabel htmlFor="job-name">Full name</FieldLabel>
        <Input id="job-name" name="name" autoComplete="name" required className="h-11" />
        {state.fieldErrors?.name ? <FieldError>{state.fieldErrors.name}</FieldError> : null}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(state.fieldErrors?.email) || undefined}>
          <FieldLabel htmlFor="job-email">Email address</FieldLabel>
          <Input id="job-email" name="email" type="email" inputMode="email" autoComplete="email" required className="h-11" />
          {state.fieldErrors?.email ? <FieldError>{state.fieldErrors.email}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.phone) || undefined}>
          <FieldLabel htmlFor="job-phone">Phone number</FieldLabel>
          <Input id="job-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="h-11" />
          {state.fieldErrors?.phone ? <FieldError>{state.fieldErrors.phone}</FieldError> : null}
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="cv">Your CV</FieldLabel>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 font-bold"
            render={<label htmlFor="cv" className="cursor-pointer" />}
          >
            <PaperclipIcon />
            Choose file
          </Button>
          <span className="min-w-0 truncate text-sm text-muted-foreground">
            {cvName ?? "No file chosen"}
          </span>
        </div>
        <input
          id="cv"
          name="cv"
          type="file"
          accept=".pdf,.docx"
          required
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setCvError(null);
            if (!file) {
              setCvName(null);
              return;
            }
            if (file.size > MAX_BYTES) {
              setCvError(`This file is too large (${fileSize(file.size)}). Please choose a file smaller than 5 MB.`);
              setCvName(null);
              e.target.value = "";
              return;
            }
            setCvName(`${file.name} · ${fileSize(file.size)}`);
          }}
        />
        <FieldDescription>PDF or DOCX, up to 5 MB.</FieldDescription>
        {cvError ? <FieldError>{cvError}</FieldError> : null}
      </Field>

      <Field data-invalid={Boolean(state.fieldErrors?.message) || undefined}>
        <FieldLabel htmlFor="job-message">Why this role?</FieldLabel>
        <Textarea id="job-message" name="message" rows={5} required placeholder="Tell us about your experience with this age group and what draws you to El-Bethel." />
        {state.fieldErrors?.message ? <FieldError>{state.fieldErrors.message}</FieldError> : null}
      </Field>

      <SubmitButton />
    </form>
  );
}
