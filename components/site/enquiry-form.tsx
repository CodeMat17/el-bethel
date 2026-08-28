"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2Icon, SendIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { submitEnquiry, type PublicFormState } from "@/lib/school/actions/public";

const INITIAL: PublicFormState = { ok: false };

const CATEGORIES = [
  { value: "admissions", label: "Admissions" },
  { value: "fees", label: "Fees" },
  { value: "academics", label: "Academics" },
  { value: "transport", label: "Transport" },
  { value: "general", label: "General enquiry" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11 w-full font-bold sm:w-auto" disabled={pending}>
      {pending ? <Spinner /> : <SendIcon />}
      {pending ? "Sending…" : "Send enquiry"}
    </Button>
  );
}

export function EnquiryForm() {
  const [state, action] = useActionState<PublicFormState, FormData>(submitEnquiry, INITIAL);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok && state.message) {
      toast.success("Enquiry sent", { description: state.message });
      formRef.current?.reset();
    }
  }, [state]);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center">
        <CheckCircle2Icon className="mx-auto size-10 text-success" />
        <h3 className="mt-4 font-heading text-lg font-extrabold">Enquiry received</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{state.message}</p>
        <Button
          variant="outline"
          size="lg"
          className="mt-6 font-bold"
          onClick={() => window.location.reload()}
        >
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-5" noValidate>
      {state.message && !state.ok ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
        >
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(state.fieldErrors?.name) || undefined}>
          <FieldLabel htmlFor="name">Your name</FieldLabel>
          <Input id="name" name="name" autoComplete="name" required className="h-11" />
          {state.fieldErrors?.name ? <FieldError>{state.fieldErrors.name}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.phone) || undefined}>
          <FieldLabel htmlFor="phone">Phone number</FieldLabel>
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="h-11" />
          {state.fieldErrors?.phone ? <FieldError>{state.fieldErrors.phone}</FieldError> : null}
        </Field>
      </div>

      <Field data-invalid={Boolean(state.fieldErrors?.email) || undefined}>
        <FieldLabel htmlFor="email">Email address</FieldLabel>
        <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" required className="h-11" />
        {state.fieldErrors?.email ? <FieldError>{state.fieldErrors.email}</FieldError> : null}
      </Field>

      <Field data-invalid={Boolean(state.fieldErrors?.category) || undefined}>
        <FieldLabel htmlFor="category">What is your enquiry about?</FieldLabel>
        <Select name="category" defaultValue="admissions">
          <SelectTrigger id="category" className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.category ? <FieldError>{state.fieldErrors.category}</FieldError> : null}
      </Field>

      <Field data-invalid={Boolean(state.fieldErrors?.message) || undefined}>
        <FieldLabel htmlFor="message">Your message</FieldLabel>
        <Textarea id="message" name="message" rows={5} required maxLength={2000} />
        <FieldDescription>
          The more detail you give, the more useful our reply will be.
        </FieldDescription>
        {state.fieldErrors?.message ? <FieldError>{state.fieldErrors.message}</FieldError> : null}
      </Field>

      <SubmitButton />
    </form>
  );
}
