"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CircleCheckIcon, CopyIcon, KeyRoundIcon, SchoolIcon, TriangleAlertIcon } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { enrolApplicant, type EnrolResult } from "@/lib/school/actions/admin";

export interface EnrolmentPreview {
  enrollable: boolean;
  genderMissing: boolean;
  classes: { id: string; name: string }[];
  guardian: { name: string; email: string };
  existingParent: { id: string; name: string } | null;
  parentHasSignIn: boolean;
}

/**
 * Enrol an accepted applicant. Shows exactly what will be created and runs only
 * when the administrator presses Confirm.
 */
export function EnrolDialog({
  applicationId,
  applicationNo,
  pupilName,
  preview,
}: {
  applicationId: string;
  applicationNo: string;
  pupilName: string;
  preview: EnrolmentPreview;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [classId, setClassId] = React.useState(preview.classes[0]?.id ?? "");
  const [pending, startTransition] = React.useTransition();
  // A new parent sign-in stays on screen until the admin has noted it down.
  const [created, setCreated] = React.useState<EnrolResult["signIn"]>();
  const className = preview.classes.find((c) => c.id === classId)?.name;

  function confirm() {
    startTransition(async () => {
      const res = await enrolApplicant(applicationId, classId);
      if (!res.ok) {
        toast.error("Enrolment didn't go through", { description: res.message });
        return;
      }
      toast.success(`${pupilName} enrolled`, { description: res.message });
      if (res.signIn) setCreated(res.signIn);
      else setOpen(false);
      router.refresh();
    });
  }

  const steps = [
    `Create a pupil record for ${pupilName}${className ? ` in ${className}` : ""}, with a house assigned to keep the houses balanced.`,
    preview.existingParent
      ? `Link the pupil to ${preview.existingParent.name}, who is already a parent at the school (${preview.guardian.email}).`
      : `Add ${preview.guardian.name} as a parent (${preview.guardian.email}) and link them to the pupil.`,
    preview.parentHasSignIn
      ? "The parent already has a sign-in, so they will see the new child straight away."
      : "Create a parent sign-in with a generated password, shown to you next so you can give it to the family.",
    "Mark the application as Enrolled.",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="font-bold" />}>
        <SchoolIcon />
        Enrol pupil
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enrol {pupilName}</DialogTitle>
          <DialogDescription>{applicationNo} · check the details, then confirm.</DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
              <KeyRoundIcon className="mt-0.5 size-4 shrink-0" />
              Give these sign-in details to {created.name} in person. The password isn&apos;t shown again; you can
              generate a new one from their record at any time.
            </div>
            <dl className="space-y-2 rounded-xl border bg-card p-4 text-sm">
              {[
                ["Sign-in page", `${window.location.host}/portal`],
                ["Email", created.email],
                ["Password", created.password],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-mono font-bold break-all">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                className="h-11 flex-1 font-bold"
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText(`Sign in at ${window.location.host}/portal\nEmail: ${created.email}\nPassword: ${created.password}`)
                    .then(() => toast.success("Copied"));
                }}
              >
                <CopyIcon />
                Copy
              </Button>
              <Button size="lg" className="h-11 flex-1 font-bold" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : preview.genderMissing || preview.classes.length === 0 ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
          >
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            {preview.classes.length === 0
              ? "There is no class for this level yet. Create one under Classes first."
              : "The application doesn't say whether the pupil is male or female. Ask the family, then enrol."}
          </div>
        ) : (
          <div className="space-y-5">
            <Field>
              <FieldLabel htmlFor={`class-${applicationId}`}>Class</FieldLabel>
              <Select value={classId} onValueChange={(v) => setClassId(String(v))}>
                <SelectTrigger id={`class-${applicationId}`} className="h-11 w-full">
                  <SelectValue>{className}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {preview.classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div>
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">This will</p>
              <ul className="mt-2 space-y-2 text-sm">
                {steps.map((step) => (
                  <li key={step} className="flex items-start gap-2">
                    <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <Button size="lg" className="h-11 w-full font-bold" disabled={pending || !classId} onClick={confirm}>
              {pending ? <Spinner /> : <SchoolIcon />}
              {pending ? "Enrolling…" : "Confirm enrolment"}
            </Button>
            <p className="text-xs text-muted-foreground">Written to the audit log with your name.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
