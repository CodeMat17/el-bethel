"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  CameraIcon,
  CheckCircle2Icon,
  FileIcon,
  SendIcon,
  TrashIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { submitAssignment, type SubmissionState } from "@/lib/school/actions/submissions";
import { fileSize } from "@/lib/school/format";

const INITIAL: SubmissionState = { ok: false };
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf,.docx";
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-12 w-full text-base font-bold" disabled={pending || disabled}>
      {pending ? <Spinner /> : <SendIcon />}
      {pending ? "Sending your work…" : "Submit my work"}
    </Button>
  );
}

export function SubmitAssignmentForm({
  assignmentId,
  allowResubmission,
  alreadySubmitted,
  defaultText,
}: {
  assignmentId: string;
  allowResubmission: boolean;
  alreadySubmitted: boolean;
  defaultText: string;
}) {
  const [state, action] = useActionState<SubmissionState, FormData>(submitAssignment, INITIAL);
  const [files, setFiles] = React.useState<File[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [text, setText] = React.useState(defaultText);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (state.ok && state.message) {
      toast.success("Work submitted", { description: state.message });
    } else if (!state.ok && state.message) {
      toast.error("Not submitted", { description: state.message });
    }
  }, [state]);

  function onFilesChosen(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const chosen = Array.from(event.target.files ?? []);
    const next: File[] = [];
    for (const file of chosen) {
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is too large (${fileSize(file.size)}). Please choose a file smaller than 5 MB.`);
        continue;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`${file.name} is not a file we can accept. Use a photo, a PDF or a Word document.`);
        continue;
      }
      next.push(file);
    }
    setFiles((current) => {
      const merged = [...current, ...next].slice(0, 5);
      syncInput(merged);
      return merged;
    });
  }

  /** Keep the file input in sync with our list so FormData submits exactly what is shown. */
  function syncInput(list: File[]) {
    if (!inputRef.current) return;
    const transfer = new DataTransfer();
    for (const file of list) transfer.items.add(file);
    inputRef.current.files = transfer.files;
  }

  function removeFile(index: number) {
    setFiles((current) => {
      const next = current.filter((_, i) => i !== index);
      syncInput(next);
      return next;
    });
  }

  const canSubmit = files.length > 0 || text.trim().length > 0;

  if (state.ok) {
    return (
      <Card className="gap-0 border-success/40 bg-success/10 p-8 text-center">
        <CheckCircle2Icon className="mx-auto size-12 text-success" />
        <h3 className="mt-4 font-heading text-xl font-extrabold">Your work has been submitted</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {state.message} Your teacher will mark it and you will get a notification when your score is
          ready.
        </p>
      </Card>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="assignmentId" value={assignmentId} />

      {alreadySubmitted && !allowResubmission ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-semibold">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          You have already submitted this work. Your teacher has not allowed resubmission.
        </div>
      ) : null}

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
        <FieldLabel htmlFor="textAnswer" className="text-base">
          Type your answer
        </FieldLabel>
        <Textarea
          id="textAnswer"
          name="textAnswer"
          rows={6}
          maxLength={8000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="You can type your answer here, or upload a photo of your exercise book below."
          className="text-base"
        />
        <FieldDescription>{text.length} of 8000 characters</FieldDescription>
      </Field>

      <div>
        <p className="text-base font-bold">Or upload a photo of your work</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Take a clear photo of your exercise book. You can add up to five files, each under 5 MB.
        </p>

        <input
          ref={inputRef}
          id="files"
          name="files"
          type="file"
          accept={ACCEPT}
          multiple
          onChange={onFilesChosen}
          className="sr-only"
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-14 justify-center text-base font-bold"
            onClick={() => inputRef.current?.click()}
          >
            <CameraIcon />
            Choose photo or file
          </Button>
          <div className="flex items-center rounded-xl border border-dashed px-4 text-sm text-muted-foreground">
            {files.length === 0 ? "No files chosen yet" : `${files.length} file${files.length === 1 ? "" : "s"} ready`}
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}

        {files.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <FileIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{fileSize(file.size)}</p>
                  <Progress value={100} className="mt-1.5" />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => removeFile(index)}
                >
                  <TrashIcon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <SubmitButton disabled={!canSubmit || (alreadySubmitted && !allowResubmission)} />

      <p className="text-center text-xs text-muted-foreground">
        Check your work before you submit. You will see a confirmation as soon as it is safely received.
      </p>
    </form>
  );
}
