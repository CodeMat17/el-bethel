"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2Icon, HeartHandshakeIcon, SendIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { pledgeGift, registerAlumnus, type PublicFormState } from "@/lib/school/actions/premium";
import { SCHOOL } from "@/lib/school/config";
import { money } from "@/lib/school/format";

const INITIAL: PublicFormState = { ok: false };

function Submit({ label, pendingLabel, icon }: { label: string; pendingLabel: string; icon: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11 w-full font-bold sm:w-auto" disabled={pending}>
      {pending ? <Spinner /> : icon}
      {pending ? pendingLabel : label}
    </Button>
  );
}

function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      {message}
    </div>
  );
}

function Text({ name, label, hint, ...props }: React.ComponentProps<typeof Input> & { name: string; label: string; hint?: string }) {
  const id = React.useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} name={name} className="h-11" {...props} />
      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
    </Field>
  );
}

export function AlumniRegisterForm() {
  const [state, action] = useActionState<PublicFormState, FormData>(registerAlumnus, INITIAL);
  const [who, setWho] = React.useState<"self" | "parent">("self");
  const year = new Date().getFullYear();

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center">
        <CheckCircle2Icon className="mx-auto size-10 text-success" />
        <h3 className="mt-4 font-heading text-lg font-extrabold">Welcome back to El-Bethel!</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <ErrorBox message={state.ok ? undefined : state.message} />
      <fieldset>
        <legend className="text-sm font-bold">Who is registering?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["self", "I am a former pupil (18 or over)"],
              ["parent", "I'm a parent registering my child"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2.5 rounded-xl border bg-card p-3 text-sm font-semibold has-checked:border-primary">
              <input type="radio" name="registeredBy" value={value} checked={who === value} onChange={() => setWho(value)} className="size-4 accent-primary" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Text name="firstName" label="Former pupil's first name" required autoComplete={who === "self" ? "given-name" : "off"} />
        <Text name="lastName" label="Last name" required autoComplete={who === "self" ? "family-name" : "off"} />
        <Text name="graduationYear" type="number" min={1990} max={year} label="Year they left El-Bethel" required />
        <Text name="lastClass" label="Class they left from" placeholder="Primary 6" required />
        <Text name="email" type="email" label={who === "parent" ? "Your email" : "Email"} required autoComplete="email" />
        <Text name="phone" type="tel" label="Phone (optional)" autoComplete="tel" />
        <Text name="currently" label={who === "parent" ? "Their school now (optional)" : "What you do now (optional)"} placeholder={who === "parent" ? "Secondary school" : "Studying medicine at UNILAG"} />
        <Text name="city" label="City (optional)" />
      </div>
      {who === "self" ? (
        <div className="space-y-2">
          <label className="flex items-start gap-3 rounded-xl border bg-card p-3 text-sm">
            <input type="checkbox" name="confirmsAdult" className="mt-0.5 size-4 accent-primary" />
            <span>
              <span className="block font-bold">I am 18 or older</span>
              <span className="text-xs text-muted-foreground">Former pupils under 18 should be registered by a parent or guardian.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl border bg-card p-3 text-sm">
            <input type="checkbox" name="directoryOptIn" className="mt-0.5 size-4 accent-primary" />
            <span>
              <span className="block font-bold">List me in the alumni directory</span>
              <span className="text-xs text-muted-foreground">Shows your first name, surname initial, year, what you do now and city. Never your email or phone.</span>
            </span>
          </label>
        </div>
      ) : (
        <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
          Children are never listed publicly. We&apos;ll use your email for alumni news and reunion invitations.
        </p>
      )}
      <Submit label="Register" pendingLabel="Sending…" icon={<SendIcon />} />
    </form>
  );
}

export function PledgeForm({ campaignId, campaignTitle }: { campaignId: string; campaignTitle: string }) {
  const [state, action] = useActionState<PublicFormState, FormData>(pledgeGift, INITIAL);

  if (state.ok && state.reference) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 p-6 sm:p-8">
        <CheckCircle2Icon className="size-10 text-success" />
        <h3 className="mt-4 font-heading text-lg font-extrabold">Thank you for your pledge</h3>
        <p className="mt-2 text-sm leading-relaxed">
          You pledged <strong>{money(state.amount ?? 0)}</strong> to {campaignTitle}. Your reference is{" "}
          <strong className="font-mono">{state.reference}</strong>.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Please pay at the school bursary, or call {SCHOOL.phone} or email {SCHOOL.email} for the school&apos;s transfer details, and quote your reference. Your gift
          appears on the campaign once the bursary confirms it has arrived.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <ErrorBox message={state.ok ? undefined : state.message} />
      <input type="hidden" name="campaignId" value={campaignId} />
      <div className="flex flex-wrap gap-2">
        {[5000, 20000, 50000, 100000].map((amount) => (
          <label key={amount} className="cursor-pointer rounded-xl border bg-card px-3 py-2 text-sm font-bold has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground">
            <input type="radio" name="preset" value={amount} className="sr-only" />
            {money(amount)}
          </label>
        ))}
      </div>
      <Text name="amount" type="number" min={1000} step={500} label="Or another amount (₦)" placeholder="10000" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Text name="name" label="Your name" required autoComplete="name" />
        <Text name="email" type="email" label="Email" required autoComplete="email" />
      </div>
      <Text name="phone" type="tel" label="Phone (optional)" autoComplete="tel" />
      <Field>
        <FieldLabel htmlFor="pledge-message">Message (optional)</FieldLabel>
        <Textarea id="pledge-message" name="message" rows={2} maxLength={280} />
      </Field>
      <label className="flex items-center gap-2.5 text-sm">
        <input type="checkbox" name="anonymous" className="size-4 accent-primary" />
        Don&apos;t show my name on the thank-you wall
      </label>
      <Submit label="Pledge a gift" pendingLabel="Saving…" icon={<HeartHandshakeIcon />} />
    </form>
  );
}
