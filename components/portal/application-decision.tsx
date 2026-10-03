"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { GavelIcon, TriangleAlertIcon } from "lucide-react";
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { updateApplicationStatus, type FormState } from "@/lib/school/actions/admissions";

const INITIAL: FormState = { ok: false };

const STATUSES = [
  { value: "under_review", label: "Under review" },
  { value: "documents_required", label: "Documents required" },
  { value: "assessment_scheduled", label: "Assessment scheduled" },
  { value: "assessment_completed", label: "Assessment completed" },
  { value: "interview_scheduled", label: "Interview scheduled" },
  { value: "accepted", label: "Accepted" },
  { value: "conditionally_accepted", label: "Conditionally accepted" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "not_accepted", label: "Not accepted" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "enrolled", label: "Enrolled" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11 w-full font-bold" disabled={pending}>
      {pending ? <Spinner /> : <GavelIcon />}
      {pending ? "Saving…" : "Update application"}
    </Button>
  );
}

export function ApplicationDecisionDialog({
  applicationId,
  applicationNo,
  pupilName,
  currentStatus,
  feePaid,
}: {
  applicationId: string;
  applicationNo: string;
  pupilName: string;
  currentStatus: string;
  feePaid: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(updateApplicationStatus, INITIAL);
  const [requestedOpen, setRequestedOpen] = React.useState(false);
  // Derived, not synchronised: a successful action closes the dialog without an effect.
  const open = requestedOpen && !state.ok;

  React.useEffect(() => {
    if (state.ok && state.message) {
      toast.success("Application updated", { description: state.message });
    } else if (!state.ok && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setRequestedOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="font-bold" />}>
        <GavelIcon />
        Update
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update application</DialogTitle>
          <DialogDescription>
            {applicationNo} · {pupilName}
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-5">
          <input type="hidden" name="applicationId" value={applicationId} />

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
            <FieldLabel htmlFor={`status-${applicationId}`}>New status</FieldLabel>
            <Select name="status" defaultValue={currentStatus === "submitted" ? "under_review" : currentStatus}>
              <SelectTrigger id={`status-${applicationId}`} className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>The family sees the new status when they look up their application.</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor={`note-${applicationId}`}>Note to the family</FieldLabel>
            <Textarea
              id={`note-${applicationId}`}
              name="note"
              rows={4}
              maxLength={1000}
              placeholder="Explain the decision or what is needed next."
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 text-sm font-bold">
            <input type="hidden" name="feePaid" value="off" />
            <input type="checkbox" name="feePaid" defaultChecked={feePaid} className="size-4 accent-primary" />
            Application fee received
          </label>

          <SubmitButton />

          <p className="text-xs text-muted-foreground">
            This action is written to the audit log with your name, the previous status and the new one.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
