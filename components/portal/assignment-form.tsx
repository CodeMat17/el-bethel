"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { SaveIcon, SendIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createAssignment, type TeachingState } from "@/lib/school/actions/teaching";

const INITIAL: TeachingState = { ok: false };

const SUBMISSION_TYPES = [
  { value: "text", label: "Typed answer" },
  { value: "image", label: "Photo (JPG, PNG, WEBP)" },
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "Word document" },
];

function Actions() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button
        type="submit"
        name="status"
        value="published"
        size="lg"
        className="h-11 flex-1 font-bold"
        disabled={pending}
      >
        {pending ? <Spinner /> : <SendIcon />}
        {pending ? "Publishing…" : "Publish to the class"}
      </Button>
      <Button
        type="submit"
        name="status"
        value="draft"
        variant="outline"
        size="lg"
        className="h-11 font-bold"
        disabled={pending}
      >
        <SaveIcon />
        Save as draft
      </Button>
    </div>
  );
}

export function AssignmentForm({
  classes,
  subjects,
  defaultClassId,
}: {
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string; levelIds: string[] }[];
  defaultClassId?: string;
}) {
  const [state, action] = useActionState<TeachingState, FormData>(createAssignment, INITIAL);

  return (
    <form action={action} className="space-y-6" noValidate>
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
          <FieldLabel htmlFor="classId">Class</FieldLabel>
          <Select name="classId" defaultValue={defaultClassId ?? classes[0]?.id}>
            <SelectTrigger id="classId" className="h-11 w-full">
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
          <FieldLabel htmlFor="subjectId">Subject</FieldLabel>
          <Select name="subjectId" defaultValue={subjects[0]?.id}>
            <SelectTrigger id="subjectId" className="h-11 w-full">
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(state.fieldErrors?.title) || undefined}>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input id="title" name="title" required className="h-11" placeholder="Fractions Around Us" />
          {state.fieldErrors?.title ? <FieldError>{state.fieldErrors.title}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.topic) || undefined}>
          <FieldLabel htmlFor="topic">Topic</FieldLabel>
          <Input id="topic" name="topic" required className="h-11" placeholder="Fractions" />
          {state.fieldErrors?.topic ? <FieldError>{state.fieldErrors.topic}</FieldError> : null}
        </Field>
      </div>

      <Field data-invalid={Boolean(state.fieldErrors?.instructions) || undefined}>
        <FieldLabel htmlFor="instructions">Instructions for pupils</FieldLabel>
        <Textarea
          id="instructions"
          name="instructions"
          rows={4}
          required
          placeholder="Solve questions 1–10 in your exercise book. Take a clear photograph of your completed work and upload it."
        />
        <FieldDescription>Write these so a child can follow them without an adult.</FieldDescription>
        {state.fieldErrors?.instructions ? <FieldError>{state.fieldErrors.instructions}</FieldError> : null}
      </Field>

      <Field>
        <FieldLabel htmlFor="description">Description for parents (optional)</FieldLabel>
        <Textarea id="description" name="description" rows={2} maxLength={2000} />
      </Field>

      <Separator />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(state.fieldErrors?.dueDate) || undefined}>
          <FieldLabel htmlFor="dueDate">Due date</FieldLabel>
          <Input id="dueDate" name="dueDate" type="date" required className="h-11" />
          <FieldDescription>Work is due at 6:00 PM on this date.</FieldDescription>
          {state.fieldErrors?.dueDate ? <FieldError>{state.fieldErrors.dueDate}</FieldError> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.maxScore) || undefined}>
          <FieldLabel htmlFor="maxScore">Maximum score</FieldLabel>
          <Input id="maxScore" name="maxScore" type="number" min={1} max={100} defaultValue={20} required className="h-11" />
          {state.fieldErrors?.maxScore ? <FieldError>{state.fieldErrors.maxScore}</FieldError> : null}
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-extrabold">How may pupils submit?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {SUBMISSION_TYPES.map((type) => (
            <label
              key={type.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3.5 text-sm font-semibold transition-colors has-data-checked:border-gold has-data-checked:bg-gold/8"
            >
              <Checkbox
                name="submissionTypes"
                value={type.value}
                defaultChecked={["text", "image", "pdf"].includes(type.value)}
              />
              {type.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-start justify-between gap-4 rounded-xl border bg-card p-4">
        <label htmlFor="allowResubmission" className="cursor-pointer">
          <span className="block text-sm font-bold">Allow resubmission</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Pupils can replace their work until you grade it.
          </span>
        </label>
        <Switch id="allowResubmission" name="allowResubmission" defaultChecked />
      </div>

      <Actions />

      <p className="text-xs text-muted-foreground">
        Publishing notifies every pupil in the class and their parents immediately.
      </p>
    </form>
  );
}
