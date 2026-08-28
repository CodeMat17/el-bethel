"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { PenSquareIcon, RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { gradeSubmission, type SubmissionState } from "@/lib/school/actions/submissions";

const INITIAL: SubmissionState = { ok: false };

const QUICK_FEEDBACK = [
  "Excellent work. Your working is clear and easy to follow.",
  "Good effort. Check your answers to the last two questions.",
  "Neat presentation — remember to show every step next time.",
  "Well done. Read the question once more before you answer.",
];

function Actions() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button
        type="submit"
        name="outcome"
        value="graded"
        size="lg"
        className="h-11 flex-1 font-bold"
        disabled={pending}
      >
        {pending ? <Spinner /> : <PenSquareIcon />}
        {pending ? "Saving…" : "Save grade"}
      </Button>
      <Button
        type="submit"
        name="outcome"
        value="resubmission_required"
        variant="outline"
        size="lg"
        className="h-11 font-bold"
        disabled={pending}
      >
        <RotateCcwIcon />
        Ask to resubmit
      </Button>
    </div>
  );
}

export function GradeDialog({
  submissionId,
  studentName,
  assignmentTitle,
  maxScore,
  currentScore,
  currentFeedback,
  textAnswer,
  files,
}: {
  submissionId: string;
  studentName: string;
  assignmentTitle: string;
  maxScore: number;
  currentScore?: number;
  currentFeedback?: string;
  textAnswer?: string;
  files: { id: string; name: string; size: string }[];
}) {
  const [state, action] = useActionState<SubmissionState, FormData>(gradeSubmission, INITIAL);
  const [requestedOpen, setRequestedOpen] = React.useState(false);
  // Derived, not synchronised: a successful action closes the dialog without an effect.
  const open = requestedOpen && !state.ok;
  const [feedback, setFeedback] = React.useState(currentFeedback ?? "");

  React.useEffect(() => {
    if (state.ok && state.message) {
      toast.success("Saved", { description: state.message });
    } else if (!state.ok && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setRequestedOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="font-bold" />}>
        <PenSquareIcon />
        {currentScore === undefined ? "Grade" : "Edit grade"}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grade submission</DialogTitle>
          <DialogDescription>
            {studentName} · {assignmentTitle}
          </DialogDescription>
        </DialogHeader>

        {textAnswer || files.length > 0 ? (
          <div className="rounded-xl border bg-muted/50 p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase">Pupil&apos;s work</p>
            {textAnswer ? (
              <p className="mt-2 text-sm leading-relaxed">{textAnswer}</p>
            ) : null}
            {files.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-semibold">{file.name}</span>
                    <span className="shrink-0 text-muted-foreground">{file.size}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-[0.68rem] text-muted-foreground">
              File previews are disabled in this demonstration environment.
            </p>
          </div>
        ) : null}

        <form action={action} className="space-y-5">
          <input type="hidden" name="submissionId" value={submissionId} />

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
            <FieldLabel htmlFor={`score-${submissionId}`}>Score out of {maxScore}</FieldLabel>
            <Input
              id={`score-${submissionId}`}
              name="score"
              type="number"
              min={0}
              max={maxScore}
              step={0.5}
              defaultValue={currentScore ?? ""}
              className="h-11"
              required
            />
            <FieldDescription>A grade letter is calculated automatically from the percentage.</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor={`feedback-${submissionId}`}>Feedback for the pupil</FieldLabel>
            <Textarea
              id={`feedback-${submissionId}`}
              name="feedback"
              rows={4}
              maxLength={2000}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Say what went well and one thing to work on."
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_FEEDBACK.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => setFeedback(phrase)}
                  className="rounded-full border bg-card px-2.5 py-1 text-[0.68rem] font-semibold transition-colors hover:border-gold/50 hover:bg-accent"
                >
                  {phrase.slice(0, 28)}…
                </button>
              ))}
            </div>
          </Field>

          <Separator />
          <Actions />

          <p className="text-xs text-muted-foreground">
            Saving a grade notifies the pupil and every parent linked to them.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
