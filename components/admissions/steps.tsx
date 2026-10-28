"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowRightIcon,
  BanknoteIcon,
  FileCheckIcon,
  FileTextIcon,
  InfoIcon,
  LandmarkIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  createApplicantAccount,
  payApplicationFee,
  saveGuardianStep,
  savePupilStep,
  submitApplication,
  type FormState,
} from "@/lib/school/actions/admissions";
import { money } from "@/lib/school/format";
import type { ApplicationDocument, ApplicationGuardian, ApplicationPupil } from "@/lib/school/types";

const INITIAL: FormState = { ok: false };

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11 w-full font-bold sm:w-auto" disabled={pending}>
      {pending ? <Spinner /> : null}
      {pending ? pendingLabel : label}
      {!pending ? <ArrowRightIcon /> : null}
    </Button>
  );
}

function FormAlert({ state }: { state: FormState }) {
  if (!state.message || state.ok) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      {state.message}
    </div>
  );
}

/* ------------------------------- step: account ---------------------------- */

export function AccountStep({ levels }: { levels: { id: string; name: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(createApplicantAccount, INITIAL);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormAlert state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(state.fieldErrors?.fullName) || undefined}>
          <FieldLabel htmlFor="fullName">Your full name</FieldLabel>
          <Input id="fullName" name="fullName" autoComplete="name" required className="h-11" />
          {state.fieldErrors?.fullName ? <FieldError>{state.fieldErrors.fullName}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.phone) || undefined}>
          <FieldLabel htmlFor="phone">Phone number</FieldLabel>
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="h-11" placeholder="0812 390 8499" />
          {state.fieldErrors?.phone ? <FieldError>{state.fieldErrors.phone}</FieldError> : null}
        </Field>
      </div>

      <Field data-invalid={Boolean(state.fieldErrors?.email) || undefined}>
        <FieldLabel htmlFor="email">Email address</FieldLabel>
        <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" required className="h-11" />
        <FieldDescription>You will need this email, with your application number, to check your application status.</FieldDescription>
        {state.fieldErrors?.email ? <FieldError>{state.fieldErrors.email}</FieldError> : null}
      </Field>


      <Field data-invalid={Boolean(state.fieldErrors?.intendedLevelId) || undefined}>
        <FieldLabel htmlFor="intendedLevelId">Class you are applying for</FieldLabel>
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
        <FieldDescription>You can change this later in the application.</FieldDescription>
        {state.fieldErrors?.intendedLevelId ? <FieldError>{state.fieldErrors.intendedLevelId}</FieldError> : null}
      </Field>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Your progress is saved in this browser, so please finish the application on this device.
      </p>

      <Submit label="Start my application" pendingLabel="Starting…" />
    </form>
  );
}

/* -------------------------------- step: pupil ----------------------------- */

export function PupilStep({
  pupil,
  intendedLevelId,
  levels,
}: {
  pupil: ApplicationPupil;
  intendedLevelId: string;
  levels: { id: string; name: string }[];
}) {
  const [state, action] = useActionState<FormState, FormData>(savePupilStep, INITIAL);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormAlert state={state} />

      <div className="grid gap-5 sm:grid-cols-3">
        <Field data-invalid={Boolean(state.fieldErrors?.firstName) || undefined}>
          <FieldLabel htmlFor="firstName">First name</FieldLabel>
          <Input id="firstName" name="firstName" defaultValue={pupil.firstName} required className="h-11" />
          {state.fieldErrors?.firstName ? <FieldError>{state.fieldErrors.firstName}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="middleName">Middle name</FieldLabel>
          <Input id="middleName" name="middleName" defaultValue={pupil.middleName} className="h-11" />
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.lastName) || undefined}>
          <FieldLabel htmlFor="lastName">Last name</FieldLabel>
          <Input id="lastName" name="lastName" defaultValue={pupil.lastName} required className="h-11" />
          {state.fieldErrors?.lastName ? <FieldError>{state.fieldErrors.lastName}</FieldError> : null}
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field data-invalid={Boolean(state.fieldErrors?.dateOfBirth) || undefined}>
          <FieldLabel htmlFor="dateOfBirth">Date of birth</FieldLabel>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={pupil.dateOfBirth} required className="h-11" />
          {state.fieldErrors?.dateOfBirth ? <FieldError>{state.fieldErrors.dateOfBirth}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.gender) || undefined}>
          <FieldLabel htmlFor="gender">Gender</FieldLabel>
          <Select name="gender" defaultValue={pupil.gender || undefined}>
            <SelectTrigger id="gender" className="h-11 w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
            </SelectContent>
          </Select>
          {state.fieldErrors?.gender ? <FieldError>{state.fieldErrors.gender}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.nationality) || undefined}>
          <FieldLabel htmlFor="nationality">Nationality</FieldLabel>
          <Input id="nationality" name="nationality" defaultValue={pupil.nationality || "Nigerian"} required className="h-11" />
          {state.fieldErrors?.nationality ? <FieldError>{state.fieldErrors.nationality}</FieldError> : null}
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="previousSchool">Previous school</FieldLabel>
          <Input id="previousSchool" name="previousSchool" defaultValue={pupil.previousSchool} className="h-11" />
        </Field>
        <Field>
          <FieldLabel htmlFor="currentClass">Current class</FieldLabel>
          <Input id="currentClass" name="currentClass" defaultValue={pupil.currentClass} className="h-11" placeholder="e.g. Primary 3" />
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.intendedLevelId) || undefined}>
          <FieldLabel htmlFor="intendedLevelId">Intended class</FieldLabel>
          <Select name="intendedLevelId" defaultValue={intendedLevelId}>
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
      </div>

      <Field data-invalid={Boolean(state.fieldErrors?.address) || undefined}>
        <FieldLabel htmlFor="address">Home address</FieldLabel>
        <Textarea id="address" name="address" defaultValue={pupil.address} required rows={3} />
        {state.fieldErrors?.address ? <FieldError>{state.fieldErrors.address}</FieldError> : null}
      </Field>

      <Submit label="Save and continue" pendingLabel="Saving…" />
    </form>
  );
}

/* ------------------------------ step: guardian ---------------------------- */

const RELATIONSHIPS = ["Mother", "Father", "Guardian", "Grandparent", "Other"];

export function GuardianStep({ guardian }: { guardian: ApplicationGuardian }) {
  const [state, action] = useActionState<FormState, FormData>(saveGuardianStep, INITIAL);

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormAlert state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(state.fieldErrors?.name) || undefined}>
          <FieldLabel htmlFor="g-name">Parent or guardian name</FieldLabel>
          <Input id="g-name" name="name" defaultValue={guardian.name} required className="h-11" />
          {state.fieldErrors?.name ? <FieldError>{state.fieldErrors.name}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.relationship) || undefined}>
          <FieldLabel htmlFor="relationship">Relationship to pupil</FieldLabel>
          <Select name="relationship" defaultValue={guardian.relationship || undefined}>
            <SelectTrigger id="relationship" className="h-11 w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.relationship ? <FieldError>{state.fieldErrors.relationship}</FieldError> : null}
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(state.fieldErrors?.phone) || undefined}>
          <FieldLabel htmlFor="g-phone">Phone number</FieldLabel>
          <Input id="g-phone" name="phone" type="tel" inputMode="tel" defaultValue={guardian.phone} required className="h-11" />
          {state.fieldErrors?.phone ? <FieldError>{state.fieldErrors.phone}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.email) || undefined}>
          <FieldLabel htmlFor="g-email">Email address</FieldLabel>
          <Input id="g-email" name="email" type="email" inputMode="email" defaultValue={guardian.email} required className="h-11" />
          {state.fieldErrors?.email ? <FieldError>{state.fieldErrors.email}</FieldError> : null}
        </Field>
      </div>

      <Field data-invalid={Boolean(state.fieldErrors?.occupation) || undefined}>
        <FieldLabel htmlFor="occupation">Occupation</FieldLabel>
        <Input id="occupation" name="occupation" defaultValue={guardian.occupation} required className="h-11" />
        {state.fieldErrors?.occupation ? <FieldError>{state.fieldErrors.occupation}</FieldError> : null}
      </Field>

      <Field data-invalid={Boolean(state.fieldErrors?.address) || undefined}>
        <FieldLabel htmlFor="g-address">Address</FieldLabel>
        <Textarea id="g-address" name="address" defaultValue={guardian.address} required rows={3} />
        {state.fieldErrors?.address ? <FieldError>{state.fieldErrors.address}</FieldError> : null}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(state.fieldErrors?.emergencyContact) || undefined}>
          <FieldLabel htmlFor="emergencyContact">Emergency contact name</FieldLabel>
          <Input id="emergencyContact" name="emergencyContact" defaultValue={guardian.emergencyContact} required className="h-11" />
          {state.fieldErrors?.emergencyContact ? <FieldError>{state.fieldErrors.emergencyContact}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.emergencyPhone) || undefined}>
          <FieldLabel htmlFor="emergencyPhone">Emergency contact phone</FieldLabel>
          <Input id="emergencyPhone" name="emergencyPhone" type="tel" inputMode="tel" defaultValue={guardian.emergencyPhone} required className="h-11" />
          {state.fieldErrors?.emergencyPhone ? <FieldError>{state.fieldErrors.emergencyPhone}</FieldError> : null}
        </Field>
      </div>

      <Submit label="Save and continue" pendingLabel="Saving…" />
    </form>
  );
}

/* ----------------------------- step: documents ---------------------------- */

function DocumentList({ title, documents, required }: { title: string; documents: ApplicationDocument[]; required: boolean }) {
  if (documents.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{title}</h3>
      <ul className="mt-3 grid gap-2">
        {documents.map((doc) => (
          <li key={doc.key} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-semibold">
            {required ? (
              <FileCheckIcon className="size-4 shrink-0 text-success" />
            ) : (
              <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
            )}
            {doc.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Nothing is uploaded online: families bring these documents to the screening. */
export function DocumentsStep({ documents }: { documents: ApplicationDocument[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm">
        <InfoIcon className="mt-0.5 size-4 shrink-0 text-info" />
        <p>
          Nothing needs to be uploaded. Please bring the originals and one photocopy of each document when
          you come in for screening. Our admissions team will check them and hand the originals back to you.
        </p>
      </div>

      <DocumentList title="Required" documents={documents.filter((d) => d.required)} required />
      <DocumentList title="Optional · bring if applicable" documents={documents.filter((d) => !d.required)} required={false} />

      <div className="flex justify-end pt-2">
        <Button size="lg" className="h-11 font-bold" render={<a href="/admissions/apply?step=review" />}>
          Continue to review
          <ArrowRightIcon />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------ step: payment ----------------------------- */

export function PaymentStep({
  amount,
  applicationNo,
  bank,
}: {
  amount: number;
  applicationNo: string;
  /** Optional so a page rendered by an older server (e.g. mid-deploy) still works. */
  bank?: { bankName: string; accountNumber: string; accountName: string };
}) {
  const [state, action] = useActionState<FormState, FormData>(payApplicationFee, INITIAL);

  return (
    <form action={action} className="space-y-6" noValidate>
      <FormAlert state={state} />

      <Card className="gap-0 border-gold/25 bg-gold/8 p-6">
        <p className="text-sm font-bold text-muted-foreground">Application fee</p>
        <p className="mt-1 font-heading text-3xl font-extrabold">{money(amount)}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          A one-off, non-refundable fee that covers processing and the entrance assessment arrangements.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="gap-0 p-5">
          <p className="flex items-center gap-2 text-sm font-extrabold">
            <LandmarkIcon className="size-4 text-gold" />
            Bank transfer
          </p>
          {bank ? (
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Bank", bank.bankName],
                ["Account number", bank.accountNumber],
                ["Account name", bank.accountName],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-bold text-muted-foreground uppercase">{label}</dt>
                  <dd className={`mt-0.5 font-semibold ${label === "Account number" ? "font-mono text-base tracking-wider" : ""}`}>{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Please reload this page to see the school&apos;s account details.
            </p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Use <span className="font-bold text-foreground">{applicationNo}</span> as the transfer narration or reference.
          </p>
        </Card>
        <Card className="gap-0 p-5">
          <p className="flex items-center gap-2 text-sm font-extrabold">
            <BanknoteIcon className="size-4 text-gold" />
            At the school bursary
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Pay in person by cash or POS at the school bursary during office hours, quoting your application number.
          </p>
        </Card>
      </div>

      <p className="rounded-xl bg-muted/70 p-4 text-sm leading-relaxed text-muted-foreground">
        The admissions office confirms your payment. You can submit your application now and pay before the screening.
      </p>

      <Submit label="Continue" pendingLabel="Continuing…" />
    </form>
  );
}

/* ------------------------------- step: submit ----------------------------- */

export function SubmitStep({ applicationNo }: { applicationNo: string }) {
  const [state, action] = useActionState<FormState, FormData>(submitApplication, INITIAL);

  return (
    <form action={action} className="space-y-6" noValidate>
      <FormAlert state={state} />

      <Card className="gap-0 p-6">
        <p className="text-sm font-bold text-muted-foreground">Your application number</p>
        <p className="mt-1 font-heading text-2xl font-extrabold tracking-wide">{applicationNo}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Keep this number. You can use it at any time to check your application status.
        </p>
      </Card>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4">
        <Checkbox name="declaration" className="mt-0.5" />
        <span className="text-sm leading-relaxed">
          I confirm that the information provided in this application is true and complete to the best of
          my knowledge, and I consent to El-Bethel International Academy processing it for admission purposes.
        </span>
      </label>

      <Submit label="Submit application" pendingLabel="Submitting…" />
    </form>
  );
}
