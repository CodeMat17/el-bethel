"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckSquareIcon,
  CircleDotIcon,
  PlusIcon,
  SaveIcon,
  SendIcon,
  TextIcon,
  TrashIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { createAssignment, updateAssignment, type AssignmentInput } from "@/lib/school/actions/assignments";
import type { Question, QuestionType } from "@/lib/school/types";
import { cn } from "@/lib/utils";

export interface TeachingOption {
  classId: string;
  className: string;
  subjects: { id: string; name: string }[];
}

export interface AssignmentDraft {
  id?: string;
  classId: string;
  subjectId: string;
  title: string;
  topic: string;
  description: string;
  instructions: string;
  startDate: string;
  dueDate: string;
  questions: Question[];
  status?: "draft" | "published" | "closed" | "archived";
}

const TYPES: { value: QuestionType; label: string; hint: string; icon: React.ReactNode }[] = [
  { value: "text", label: "Written answer", hint: "Pupils type an answer. You mark it.", icon: <TextIcon /> },
  { value: "single", label: "One answer", hint: "Radio buttons — pupils choose one option.", icon: <CircleDotIcon /> },
  { value: "multiple", label: "Several answers", hint: "Checkboxes — pupils tick every correct option.", icon: <CheckSquareIcon /> },
];

let counter = 0;
const newId = () => `q${Date.now().toString(36)}${(counter++).toString(36)}`;

function blankQuestion(type: QuestionType = "single"): Question {
  return {
    id: newId(),
    type,
    prompt: "",
    options: type === "text" ? [] : ["", ""],
    correct: [],
    points: type === "text" ? 5 : 2,
  };
}

/** `datetime-local` value (local time) ⇄ ISO string. */
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(value: string): string {
  return value ? new Date(value).toISOString() : "";
}

function defaultDates() {
  const start = new Date();
  start.setSeconds(0, 0);
  const due = new Date(start);
  due.setDate(due.getDate() + 7);
  due.setHours(18, 0, 0, 0);
  return { startDate: start.toISOString(), dueDate: due.toISOString() };
}

export function AssignmentForm({
  options,
  initial,
  locked = false,
}: {
  options: TeachingOption[];
  initial?: AssignmentDraft;
  /** Pupils have submitted: class, subject and questions can no longer change. */
  locked?: boolean;
}) {
  const router = useRouter();
  const dates = React.useMemo(defaultDates, []);
  const [form, setForm] = React.useState<AssignmentDraft>(
    () =>
      initial ?? {
        classId: options[0]?.classId ?? "",
        subjectId: options[0]?.subjects[0]?.id ?? "",
        title: "",
        topic: "",
        description: "",
        instructions: "",
        startDate: dates.startDate,
        dueDate: dates.dueDate,
        questions: [blankQuestion("single")],
      },
  );
  const [pending, setPending] = React.useState<null | "publish" | "draft">(null);
  const [error, setError] = React.useState<string | null>(null);

  const classOption = options.find((o) => o.classId === form.classId);
  const subjects = classOption?.subjects ?? [];
  const total = form.questions.reduce((n, q) => n + (Number.isFinite(q.points) ? q.points : 0), 0);
  const isPublished = initial?.status && initial.status !== "draft";

  const set = <K extends keyof AssignmentDraft>(key: K, value: AssignmentDraft[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateQuestion = (id: string, patch: Partial<Question>) =>
    setForm((f) => ({ ...f, questions: f.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) }));

  function changeType(q: Question, type: QuestionType) {
    if (type === q.type) return;
    updateQuestion(q.id, {
      type,
      options: type === "text" ? [] : q.options.length >= 2 ? q.options : ["", ""],
      correct: type === "text" ? [] : type === "single" ? q.correct.slice(0, 1) : q.correct,
    });
  }

  function move(index: number, delta: number) {
    setForm((f) => {
      const next = [...f.questions];
      const target = index + delta;
      if (target < 0 || target >= next.length) return f;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, questions: next };
    });
  }

  function validate(publish: boolean): string | null {
    if (!form.classId || !form.subjectId) return "Choose a class and a subject.";
    if (form.title.trim().length < 3) return "Give the assignment a title.";
    if (!form.topic.trim()) return "Enter the topic.";
    if (!form.dueDate) return "Choose a due date.";
    if (Date.parse(form.dueDate) <= Date.parse(form.startDate)) return "The due date must be after the start date.";
    if (publish && Date.parse(form.dueDate) < Date.now()) return "The due date is already in the past.";
    if (form.questions.length === 0) return "Add at least one question.";
    for (const [i, q] of form.questions.entries()) {
      const n = i + 1;
      if (!q.prompt.trim()) return `Question ${n} needs a question.`;
      if (!Number.isInteger(q.points) || q.points < 1 || q.points > 100) return `Question ${n} must be worth 1–100 marks.`;
      if (q.type !== "text") {
        if (q.options.length < 2) return `Question ${n} needs at least two options.`;
        if (q.options.some((o) => !o.trim())) return `Question ${n} has an empty option.`;
      }
    }
    return null;
  }

  async function save(publish: boolean) {
    setError(null);
    const problem = validate(publish);
    if (problem) {
      setError(problem);
      return;
    }
    setPending(publish ? "publish" : "draft");
    const input: AssignmentInput = {
      classId: form.classId,
      subjectId: form.subjectId,
      title: form.title,
      topic: form.topic,
      description: form.description,
      instructions: form.instructions,
      questions: form.questions,
      startDate: form.startDate,
      dueDate: form.dueDate,
      publish,
    };
    try {
      const res = initial?.id ? await updateAssignment(initial.id, input) : await createAssignment(input);
      if (!res.ok) {
        setError(res.message ?? "The assignment could not be saved.");
        toast.error("Not saved", { description: res.message });
        return;
      }
      toast.success(publish ? "Assignment published" : "Saved", { description: res.message });
      router.push(res.id ? `/portal/teacher/assignments/${res.id}` : "/portal/teacher/assignments");
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  const busy = pending !== null;
  const unkeyed = form.questions.filter((q) => q.type !== "text" && q.correct.length === 0).length;

  return (
    <form
      className="space-y-8"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void save(true);
      }}
    >
      {error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {locked ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-semibold">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          Pupils have already submitted. You can change the title, instructions and dates, but not the class,
          subject or questions.
        </div>
      ) : null}

      <section className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="classId">Class</FieldLabel>
            <Select
              value={form.classId}
              items={options.map((o) => ({ value: o.classId, label: o.className }))}
              onValueChange={(value) => {
                const next = options.find((o) => o.classId === value);
                setForm((f) => ({
                  ...f,
                  classId: String(value),
                  subjectId: next?.subjects.some((s) => s.id === f.subjectId) ? f.subjectId : next?.subjects[0]?.id ?? "",
                }));
              }}
              disabled={locked || busy}
            >
              <SelectTrigger id="classId" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.classId} value={o.classId}>
                    {o.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="subjectId">Subject</FieldLabel>
            <Select
              value={form.subjectId}
              items={subjects.map((s) => ({ value: s.id, label: s.name }))}
              onValueChange={(value) => set("subjectId", String(value))}
              disabled={locked || busy}
            >
              <SelectTrigger id="subjectId" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={140} className="h-11" placeholder="Fractions Around Us" disabled={busy} />
          </Field>
          <Field>
            <FieldLabel htmlFor="topic">Topic</FieldLabel>
            <Input id="topic" value={form.topic} onChange={(e) => set("topic", e.target.value)} maxLength={80} className="h-11" placeholder="Fractions" disabled={busy} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="instructions">Instructions for pupils (optional)</FieldLabel>
          <Textarea id="instructions" rows={3} value={form.instructions} onChange={(e) => set("instructions", e.target.value)} maxLength={2000} placeholder="Read each question carefully. Show your thinking in the written answers." disabled={busy} />
          <FieldDescription>Write these so a child can follow them without an adult.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Note for parents (optional)</FieldLabel>
          <Textarea id="description" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} disabled={busy} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="startDate">Opens</FieldLabel>
            <Input id="startDate" type="datetime-local" value={toLocalInput(form.startDate)} onChange={(e) => set("startDate", fromLocalInput(e.target.value))} className="h-11" disabled={busy} />
            <FieldDescription>Pupils can see it from this time.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="dueDate">Due</FieldLabel>
            <Input id="dueDate" type="datetime-local" value={toLocalInput(form.dueDate)} onChange={(e) => set("dueDate", fromLocalInput(e.target.value))} className="h-11" disabled={busy} />
            <FieldDescription>No submissions are accepted after this.</FieldDescription>
          </Field>
        </div>
      </section>

      <Separator />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-extrabold">Questions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose the answer format for each question. Choice questions with a correct answer marked are scored
              automatically.
            </p>
          </div>
          <p className="rounded-full bg-muted px-3 py-1 text-sm font-extrabold">
            {form.questions.length} {form.questions.length === 1 ? "question" : "questions"} · {total} marks
          </p>
        </div>

        <ol className="mt-5 space-y-4">
          {form.questions.map((q, index) => (
            <li key={q.id} className="rounded-2xl border bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-heading text-sm font-extrabold">Question {index + 1}</p>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={locked || busy || index === 0} onClick={() => move(index, -1)}>
                    <ArrowUpIcon />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Move down" disabled={locked || busy || index === form.questions.length - 1} onClick={() => move(index, 1)}>
                    <ArrowDownIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete question ${index + 1}`}
                    disabled={locked || busy || form.questions.length === 1}
                    onClick={() => setForm((f) => ({ ...f, questions: f.questions.filter((x) => x.id !== q.id) }))}
                  >
                    <TrashIcon />
                  </Button>
                </div>
              </div>

              <ToggleGroup
                value={[q.type]}
                onValueChange={(value) => {
                  const next = value[0] as QuestionType | undefined;
                  if (next) changeType(q, next);
                }}
                className="mt-3 flex w-full flex-wrap"
                variant="outline"
                disabled={locked || busy}
              >
                {TYPES.map((t) => (
                  <ToggleGroupItem key={t.value} value={t.value} className="flex-1 gap-1.5 font-bold" aria-label={t.label}>
                    {t.icon}
                    {t.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="mt-1.5 text-xs text-muted-foreground">{TYPES.find((t) => t.value === q.type)?.hint}</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_7rem]">
                <Field>
                  <FieldLabel htmlFor={`prompt-${q.id}`}>Question</FieldLabel>
                  <Textarea id={`prompt-${q.id}`} rows={2} value={q.prompt} onChange={(e) => updateQuestion(q.id, { prompt: e.target.value })} maxLength={2000} disabled={locked || busy} />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`points-${q.id}`}>Marks</FieldLabel>
                  <Input
                    id={`points-${q.id}`}
                    type="number"
                    min={1}
                    max={100}
                    inputMode="numeric"
                    value={Number.isFinite(q.points) ? q.points : ""}
                    onChange={(e) => updateQuestion(q.id, { points: Math.round(Number(e.target.value)) })}
                    className="h-11"
                    disabled={locked || busy}
                  />
                </Field>
              </div>

              {q.type !== "text" ? (
                <div className="mt-4">
                  <p className="text-sm font-bold">
                    Options <span className="font-normal text-muted-foreground">— tick the correct {q.type === "single" ? "answer" : "answers"}</span>
                  </p>
                  <ul className="mt-2 space-y-2">
                    {q.options.map((option, oi) => {
                      const isCorrect = q.correct.includes(oi);
                      return (
                        <li key={oi} className={cn("flex items-center gap-2 rounded-xl border p-2", isCorrect && "border-success/50 bg-success/8")}>
                          <Checkbox
                            aria-label={`Option ${oi + 1} is correct`}
                            checked={isCorrect}
                            disabled={locked || busy}
                            className={q.type === "single" ? "rounded-full" : undefined}
                            onCheckedChange={(checked) => {
                              const next = q.type === "single"
                                ? checked ? [oi] : []
                                : checked ? [...q.correct, oi] : q.correct.filter((c) => c !== oi);
                              updateQuestion(q.id, { correct: next });
                            }}
                          />
                          <Input
                            aria-label={`Option ${oi + 1}`}
                            value={option}
                            onChange={(e) => updateQuestion(q.id, { options: q.options.map((o, i) => (i === oi ? e.target.value : o)) })}
                            maxLength={300}
                            placeholder={`Option ${oi + 1}`}
                            className="h-10 flex-1"
                            disabled={locked || busy}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove option ${oi + 1}`}
                            disabled={locked || busy || q.options.length <= 2}
                            onClick={() =>
                              updateQuestion(q.id, {
                                options: q.options.filter((_, i) => i !== oi),
                                correct: q.correct.filter((c) => c !== oi).map((c) => (c > oi ? c - 1 : c)),
                              })
                            }
                          >
                            <XIcon />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 font-bold"
                    disabled={locked || busy || q.options.length >= 10}
                    onClick={() => updateQuestion(q.id, { options: [...q.options, ""] })}
                  >
                    <PlusIcon />
                    Add option
                  </Button>
                  {q.correct.length === 0 ? (
                    <p className="mt-2 text-xs font-semibold text-warning">
                      No correct answer ticked — you will mark this question yourself.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ol>

        {!locked ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <Button
                key={t.value}
                type="button"
                variant="outline"
                className="font-bold"
                disabled={busy || form.questions.length >= 100}
                onClick={() => setForm((f) => ({ ...f, questions: [...f.questions, blankQuestion(t.value)] }))}
              >
                <PlusIcon />
                {t.label}
              </Button>
            ))}
          </div>
        ) : null}
      </section>

      <Separator />

      {unkeyed > 0 ? (
        <p className="text-sm text-muted-foreground">
          {unkeyed} choice {unkeyed === 1 ? "question has" : "questions have"} no correct answer ticked and will need marking by hand.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" size="lg" className="h-11 flex-1 font-bold" disabled={busy}>
          {pending === "publish" ? <Spinner /> : <SendIcon />}
          {pending === "publish" ? "Saving…" : isPublished ? "Save changes" : "Publish to the class"}
        </Button>
        {!isPublished ? (
          <Button type="button" variant="outline" size="lg" className="h-11 font-bold" disabled={busy} onClick={() => void save(false)}>
            {pending === "draft" ? <Spinner /> : <SaveIcon />}
            {pending === "draft" ? "Saving…" : "Save as draft"}
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Publishing notifies every pupil in the class and their parents. Pupils can submit once, before the due date.
      </p>
    </form>
  );
}
