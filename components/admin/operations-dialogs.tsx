"use client";

import * as React from "react";
import { AwardIcon, BanIcon, PencilIcon, PlusIcon } from "lucide-react";

import { CheckField, Hidden, SelectField, TextField, TextareaField } from "@/components/admin/fields";
import { FormDialog } from "@/components/admin/form-dialog";
import { StudentPicker } from "@/components/admin/student-picker";
import { Button } from "@/components/ui/button";
import { issueCertificate, revokeCertificate, saveAchievement } from "@/lib/school/actions/operations";
import { AWARD_CATEGORIES } from "@/lib/school/awards";
import type { Achievement } from "@/lib/school/types";

const CATEGORY_OPTIONS = AWARD_CATEGORIES.map((c) => ({ value: c, label: c }));

function Trigger({ editing, label }: { editing: boolean; label: string }) {
  return editing ? (
    <Button size="sm" variant="outline" className="font-bold">
      <PencilIcon />
      Edit
    </Button>
  ) : (
    <Button size="lg" className="font-bold">
      <PlusIcon />
      {label}
    </Button>
  );
}

/* ------------------------------ certificates ------------------------------ */

export function CertificateDialog({ classNames, sessionName }: { classNames: Record<string, string>; sessionName: string }) {
  return (
    <FormDialog
      trigger={
        <Button size="lg" className="font-bold">
          <AwardIcon />
          Issue certificate
        </Button>
      }
      title="Issue a certificate"
      description="The certificate gets a unique number and a QR code for public verification. The family is notified and can download it."
      action={issueCertificate}
      submitLabel="Issue certificate"
      pendingLabel="Issuing…"
    >
      <StudentPicker classNames={classNames} />
      <SelectField name="category" label="Category" options={CATEGORY_OPTIONS} defaultValue={CATEGORY_OPTIONS[0].value} />
      <TextField name="award" label="Award title" placeholder="Top of Primary 4 — First Term" maxLength={120} description="Leave blank to use the category." />
      <TextareaField name="citation" label="Citation (optional)" rows={2} maxLength={300} placeholder="For outstanding effort and excellent results in Mathematics." />
      <TextField name="sessionName" label="Session" defaultValue={sessionName} />
    </FormDialog>
  );
}

export function RevokeCertificateDialog({ id, certificateNo }: { id: string; certificateNo: string }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="ghost" className="font-bold text-destructive">
          <BanIcon />
          Withdraw
        </Button>
      }
      title={`Withdraw ${certificateNo}?`}
      description="The certificate stays on record, but the public verification page will say it is no longer valid."
      action={revokeCertificate}
      submitLabel="Withdraw certificate"
      pendingLabel="Withdrawing…"
    >
      <Hidden name="id" value={id} />
      <TextareaField name="reason" label="Reason" rows={2} required maxLength={300} />
    </FormDialog>
  );
}

/* ------------------------------- achievements ----------------------------- */

export function AchievementDialog({
  achievement,
  classNames,
}: {
  achievement?: Achievement & { studentName: string | null; published: boolean };
  classNames: Record<string, string>;
}) {
  const [linked, setLinked] = React.useState(Boolean(achievement?.studentId) || !achievement);
  return (
    <FormDialog
      trigger={<Trigger editing={Boolean(achievement)} label="Add achievement" />}
      title={achievement ? "Edit achievement" : "Add to Our Stars"}
      description="The public website shows only the pupil's initials and year group."
      action={saveAchievement}
      wide
    >
      <Hidden name="id" value={achievement?.id} />
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={linked} onChange={(e) => setLinked(e.target.checked)} className="size-4 accent-primary" />
        Link to a pupil&apos;s record (adds it to their portal and stars)
      </label>
      {linked ? (
        <StudentPicker
          classNames={classNames}
          initial={achievement?.studentId && achievement.studentName ? { id: achievement.studentId, name: achievement.studentName } : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="studentInitials" label="Initials" defaultValue={achievement?.studentInitials} placeholder="D. C." />
          <TextField name="classLabel" label="Year group" defaultValue={achievement?.classLabel} placeholder="Primary 4" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField name="category" label="Category" options={CATEGORY_OPTIONS} defaultValue={achievement?.category ?? CATEGORY_OPTIONS[0].value} />
        <TextField name="date" type="date" label="Date" defaultValue={(achievement?.date ?? new Date().toISOString()).slice(0, 10)} />
      </div>
      <TextField name="title" label="Title" defaultValue={achievement?.title} required maxLength={140} />
      <TextareaField name="description" label="Description" rows={3} defaultValue={achievement?.description} maxLength={500} />
      <CheckField name="published" label="Show on the public Our Stars page" defaultChecked={achievement?.published ?? true} />
      {linked ? <CheckField name="issueCertificate" label="Also issue a certificate for this achievement" /> : null}
    </FormDialog>
  );
}
