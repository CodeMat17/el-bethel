"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  FileUpIcon,
  PaperclipIcon,
  TrashIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { toast } from "sonner";

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
  removeDocument,
  saveGuardianStep,
  savePupilStep,
  submitApplication,
  uploadDocument,
  type FormState,
} from "@/lib/school/actions/admissions";
import { fileSize, money } from "@/lib/school/format";
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

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf,.docx";

function DocumentRow({ document }: { document: ApplicationDocument }) {
  const [uploadState, uploadAction] = useActionState<FormState, FormData>(uploadDocument, INITIAL);
  const [removeState, removeAction] = useActionState<FormState, FormData>(removeDocument, INITIAL);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [clientError, setClientError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (uploadState.message) {
      if (uploadState.ok) toast.success(uploadState.message);
      else toast.error(uploadState.message);
    }
  }, [uploadState]);

  React.useEffect(() => {
    if (removeState.message) toast.info(removeState.message);
  }, [removeState]);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setClientError(null);
    if (!file) {
      setFileName(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setClientError(`This file is too large (${fileSize(file.size)}). Please choose a file smaller than 5 MB.`);
      setFileName(null);
      event.target.value = "";
      return;
    }
    setFileName(file.name);
    formRef.current?.requestSubmit();
  }

  return (
    <Card className="gap-0 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-extrabold">
            {document.label}
            {document.required ? (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[0.65rem] font-bold text-destructive">
                Required
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-bold text-muted-foreground">
                Optional
              </span>
            )}
          </p>
          {document.uploaded ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-success">
              <CheckCircle2Icon className="size-3.5" />
              {document.fileName}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WEBP, PDF or DOCX · up to 5 MB</p>
          )}
        </div>

        {document.uploaded ? (
          <form action={removeAction}>
            <input type="hidden" name="key" value={document.key} />
            <Button type="submit" variant="outline" size="sm" className="font-bold">
              <TrashIcon />
              Remove
            </Button>
          </form>
        ) : (
          <form ref={formRef} action={uploadAction} className="flex items-center gap-2">
            <input type="hidden" name="key" value={document.key} />
            <input
              ref={inputRef}
              type="file"
              name="file"
              accept={ACCEPT}
              onChange={onFileChange}
              className="sr-only"
              id={`file-${document.key}`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="font-bold"
              onClick={() => inputRef.current?.click()}
            >
              <FileUpIcon />
              Choose file
            </Button>
          </form>
        )}
      </div>

      {fileName && !document.uploaded ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner className="size-3" />
          Uploading {fileName}…
        </p>
      ) : null}
      {clientError ? (
        <p role="alert" className="mt-3 text-xs font-semibold text-destructive">{clientError}</p>
      ) : null}
    </Card>
  );
}

export function DocumentsStep({ documents }: { documents: ApplicationDocument[] }) {
  const outstanding = documents.filter((d) => d.required && !d.uploaded).length;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm">
        <PaperclipIcon className="mt-0.5 size-4 shrink-0 text-info" />
        <p>
          Photographs of original documents are fine, as long as every corner is visible and the text is
          readable. Files are stored privately and are visible only to our admissions team.
        </p>
      </div>

      <div className="grid gap-3">
        {documents.map((doc) => (
          <DocumentRow key={doc.key} document={doc} />
        ))}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-muted-foreground">
          {outstanding === 0
            ? "All required documents uploaded."
            : `${outstanding} required document${outstanding === 1 ? "" : "s"} still to upload.`}
        </p>
        <Button
          size="lg"
          className="h-11 font-bold"
          disabled={outstanding > 0}
          render={<a href="/admissions/apply?step=review" />}
        >
          Continue to review
          <ArrowRightIcon />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------ step: payment ----------------------------- */

export function PaymentStep({ amount }: { amount: number }) {
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

      <div className="rounded-xl bg-muted/70 p-4 text-sm leading-relaxed">
        <p className="font-bold">How to pay</p>
        <p className="mt-1 text-muted-foreground">
          Pay the application fee at the school bursary, or by bank transfer using the account details from the school
          office, quoting your application number. The admissions office confirms your payment — you can submit your
          application now and pay before the assessment.
        </p>
      </div>

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
