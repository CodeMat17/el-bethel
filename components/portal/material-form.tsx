"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { PaperclipIcon, TriangleAlertIcon, UploadIcon } from "lucide-react";
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
import { uploadMaterial, type TeachingState } from "@/lib/school/actions/teaching";
import { fileSize } from "@/lib/school/format";

const INITIAL: TeachingState = { ok: false };

const KINDS = [
  { value: "note", label: "Lesson notes" },
  { value: "pdf", label: "PDF" },
  { value: "worksheet", label: "Worksheet" },
  { value: "slides", label: "Presentation slides" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "image", label: "Image" },
  { value: "link", label: "External link" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11 w-full font-bold" disabled={pending}>
      {pending ? <Spinner /> : <UploadIcon />}
      {pending ? "Publishing…" : "Publish to class"}
    </Button>
  );
}

export function MaterialForm({
  classes,
  subjects,
  defaultClassId,
}: {
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  defaultClassId?: string;
}) {
  const [state, action] = useActionState<TeachingState, FormData>(uploadMaterial, INITIAL);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (state.ok && state.message) {
      toast.success("Material published", { description: state.message });
      formRef.current?.reset();
    } else if (!state.ok && state.message) {
      toast.error(state.message);
    }
  }, [state]);

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
        <Field data-invalid={Boolean(state.fieldErrors?.classId) || undefined}>
          <FieldLabel htmlFor="mat-class">Class</FieldLabel>
          <Select name="classId" defaultValue={defaultClassId ?? classes[0]?.id}>
            <SelectTrigger id="mat-class" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.classId ? <FieldError>{state.fieldErrors.classId}</FieldError> : null}
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.subjectId) || undefined}>
          <FieldLabel htmlFor="mat-subject">Subject</FieldLabel>
          <Select name="subjectId" defaultValue={subjects[0]?.id}>
            <SelectTrigger id="mat-subject" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.subjectId ? <FieldError>{state.fieldErrors.subjectId}</FieldError> : null}
        </Field>
      </div>

      <Field data-invalid={Boolean(state.fieldErrors?.title) || undefined}>
        <FieldLabel htmlFor="mat-title">Title</FieldLabel>
        <Input id="mat-title" name="title" required className="h-11" placeholder="Fractions — revision worksheet" />
        {state.fieldErrors?.title ? <FieldError>{state.fieldErrors.title}</FieldError> : null}
      </Field>

      <Field data-invalid={Boolean(state.fieldErrors?.description) || undefined}>
        <FieldLabel htmlFor="mat-description">Description</FieldLabel>
        <Textarea id="mat-description" name="description" rows={3} required />
        {state.fieldErrors?.description ? <FieldError>{state.fieldErrors.description}</FieldError> : null}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="mat-kind">Type</FieldLabel>
          <Select name="kind" defaultValue="worksheet">
            <SelectTrigger id="mat-kind" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((kind) => (
                <SelectItem key={kind.value} value={kind.value}>{kind.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="mat-url">External link (optional)</FieldLabel>
          <Input id="mat-url" name="url" className="h-11" placeholder="https://…" />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="mat-file">Attach a file (optional)</FieldLabel>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 font-bold"
            onClick={() => inputRef.current?.click()}
          >
            <PaperclipIcon />
            Choose file
          </Button>
          <span className="min-w-0 truncate text-sm text-muted-foreground">
            {(state.ok ? null : fileName) ?? "No file chosen"}
          </span>
        </div>
        <input
          ref={inputRef}
          id="mat-file"
          name="file"
          type="file"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setFileName(file ? `${file.name} · ${fileSize(file.size)}` : null);
          }}
        />
        <FieldDescription>Up to 20 MB. Files are stored privately and shared only with this class.</FieldDescription>
      </Field>

      <SubmitButton />
    </form>
  );
}
