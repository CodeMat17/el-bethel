"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CircleDotIcon,
  ImageIcon,
  LinkIcon,
  PlusIcon,
  SaveIcon,
  SendIcon,
  ToggleLeftIcon,
  TrashIcon,
  TriangleAlertIcon,
  TypeIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { MediaUpload } from "@/components/media-upload";
import type { TeachingOption } from "@/components/portal/assignment-form";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveQuiz, type QuizInput } from "@/lib/school/actions/quizzes";
import type { QuizQuestion } from "@/lib/school/types";
import { cn } from "@/lib/utils";

type QType = QuizQuestion["type"];

const TYPES: { value: QType; label: string; hint: string; icon: React.ReactNode }[] = [
  { value: "multiple_choice", label: "Multiple choice", hint: "Pupils choose one option. Marked automatically.", icon: <CircleDotIcon /> },
  { value: "true_false", label: "True / False", hint: "Pupils choose True or False. Marked automatically.", icon: <ToggleLeftIcon /> },
  { value: "short_answer", label: "Short answer", hint: "Pupils type a word or phrase. List accepted answers to mark it automatically, or leave them blank to mark by hand.", icon: <TypeIcon /> },
  { value: "picture", label: "Picture", hint: "A picture with options to choose from. Marked automatically.", icon: <ImageIcon /> },
  { value: "matching", label: "Matching", hint: "Pupils match each item on the left with one on the right. Part marks for each correct pair.", icon: <LinkIcon /> },
];

export interface QuizDraft {
  id?: string;
  classId: string;
  subjectId: string;
  title: string;
  description: string;
  durationMinutes: number;
  attemptsAllowed: number;
  randomize: boolean;
  showResultsImmediately: boolean;
  opensAt: string;
  closesAt: string;
  questions: QuizQuestion[];
  status?: "draft" | "published" | "closed";
}

let counter = 0;
const newId = () => `qq${Date.now().toString(36)}${(counter++).toString(36)}`;

function blank(type: QType): QuizQuestion {
  return {
    id: newId(),
    type,
    prompt: "",
    options: type === "true_false" ? ["True", "False"] : type === "multiple_choice" || type === "picture" ? ["", "", ""] : [],
    answer: type === "true_false" ? "True" : "",
    points: type === "matching" ? 4 : 1,
    pairs: type === "matching" ? [{ left: "", right: "" }, { left: "", right: "" }, { left: "", right: "" }] : undefined,
  };
}

function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : "");

export function QuizForm({ options, initial, locked = false }: { options: TeachingOption[]; initial?: QuizDraft; locked?: boolean }) {
  const router = useRouter();
  const [form, setForm] = React.useState<QuizDraft>(() => {
    if (initial) return initial;
    const opens = new Date();
    opens.setSeconds(0, 0);
    const closes = new Date(opens);
    closes.setDate(closes.getDate() + 7);
    closes.setHours(18, 0, 0, 0);
    return {
      classId: options[0]?.classId ?? "",
      subjectId: options[0]?.subjects[0]?.id ?? "",
      title: "",
      description: "",
      durationMinutes: 15,
      attemptsAllowed: 1,
      randomize: true,
      showResultsImmediately: true,
      opensAt: opens.toISOString(),
      closesAt: closes.toISOString(),
      questions: [blank("multiple_choice")],
    };
  });
  const [pending, setPending] = React.useState<null | "publish" | "draft">(null);
  const [uploading, setUploading] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const subjects = options.find((o) => o.classId === form.classId)?.subjects ?? [];
  const total = form.questions.reduce((n, q) => n + (Number.isFinite(q.points) ? q.points : 0), 0);
  const isLive = initial?.status && initial.status !== "draft";
  const busy = pending !== null;
  const qLocked = locked || busy;

  const set = <K extends keyof QuizDraft>(key: K, value: QuizDraft[K]) => setForm((f) => ({ ...f, [key]: value }));
  const update = (id: string, patch: Partial<QuizQuestion>) =>
    setForm((f) => ({ ...f, questions: f.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) }));

  function move(index: number, delta: number) {
    setForm((f) => {
      const next = [...f.questions];
      const target = index + delta;
      if (target < 0 || target >= next.length) return f;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, questions: next };
    });
  }

  function validate(): string | null {
    if (!form.classId || !form.subjectId) return "Choose a class and a subject.";
    if (form.title.trim().length < 3) return "Give the quiz a title.";
    if (!form.opensAt || !form.closesAt) return "Choose when the quiz opens and closes.";
    if (Date.parse(form.closesAt) <= Date.parse(form.opensAt)) return "The quiz must close after it opens.";
    for (const [i, q] of form.questions.entries()) {
      const n = i + 1;
      if (!q.prompt.trim()) return `Question ${n} needs a question.`;
      if (!Number.isInteger(q.points) || q.points < 1 || q.points > 20) return `Question ${n} must be worth 1–20 marks.`;
      if (q.type === "multiple_choice" || q.type === "picture") {
        if (q.options.some((o) => !o.trim())) return `Question ${n} has an empty option.`;
        if (!q.answer || !q.options.includes(q.answer)) return `Choose the correct answer for question ${n}.`;
      }
      if (q.type === "picture" && !q.imageUrl) return `Upload the picture for question ${n}.`;
      if (q.type === "matching" && (q.pairs ?? []).some((p) => !p.left.trim() || !p.right.trim())) return `Question ${n} has an empty pair.`;
    }
    return null;
  }

  async function save(publish: boolean) {
    setError(null);
    const problem = validate();
    if (problem) return setError(problem);
    setPending(publish ? "publish" : "draft");
    const input: QuizInput = { ...form, publish };
    try {
      const res = await saveQuiz(input);
      if (!res.ok) {
        setError(res.message ?? "The quiz could not be saved.");
        toast.error("Not saved", { description: res.message });
        return;
      }
      toast.success(res.message ?? "Saved");
      router.push(res.id ? `/portal/teacher/quizzes/${res.id}` : "/portal/teacher/quizzes");
      router.refresh();
    } finally {
      setPending(null);
    }
  }

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
          Pupils have already sat this quiz. You can change the title, timing and settings, but not the class, subject or questions.
        </div>
      ) : null}

      <section className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="quiz-class">Class</FieldLabel>
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
              disabled={qLocked}
            >
              <SelectTrigger id="quiz-class" className="h-11 w-full">
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
            <FieldLabel htmlFor="quiz-subject">Subject</FieldLabel>
            <Select value={form.subjectId} items={subjects.map((s) => ({ value: s.id, label: s.name }))} onValueChange={(value) => set("subjectId", String(value))} disabled={qLocked}>
              <SelectTrigger id="quiz-subject" className="h-11 w-full">
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

        <Field>
          <FieldLabel htmlFor="quiz-title">Title</FieldLabel>
          <Input id="quiz-title" value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={140} className="h-11" placeholder="Fractions quick check" disabled={busy} />
        </Field>
        <Field>
          <FieldLabel htmlFor="quiz-description">Instructions for pupils</FieldLabel>
          <Textarea id="quiz-description" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={1000} placeholder="Answer every question. You have 15 minutes." disabled={busy} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="quiz-opens">Opens</FieldLabel>
            <Input id="quiz-opens" type="datetime-local" value={toLocalInput(form.opensAt)} onChange={(e) => set("opensAt", fromLocalInput(e.target.value))} className="h-11" disabled={busy} />
          </Field>
          <Field>
            <FieldLabel htmlFor="quiz-closes">Closes</FieldLabel>
            <Input id="quiz-closes" type="datetime-local" value={toLocalInput(form.closesAt)} onChange={(e) => set("closesAt", fromLocalInput(e.target.value))} className="h-11" disabled={busy} />
          </Field>
          <Field>
            <FieldLabel htmlFor="quiz-duration">Time limit (minutes)</FieldLabel>
            <Input id="quiz-duration" type="number" min={1} max={180} value={form.durationMinutes} onChange={(e) => set("durationMinutes", Math.round(Number(e.target.value)))} className="h-11" disabled={busy} />
            <FieldDescription>The clock starts when the pupil presses Start, and is kept by the school server.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="quiz-attempts">Attempts allowed</FieldLabel>
            <Input id="quiz-attempts" type="number" min={1} max={5} value={form.attemptsAllowed} onChange={(e) => set("attemptsAllowed", Math.round(Number(e.target.value)))} className="h-11" disabled={busy} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border bg-card p-3.5 text-sm">
            <span>
              <span className="block font-bold">Shuffle question order</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Each pupil sees the questions in a different order.</span>
            </span>
            <Switch checked={form.randomize} onCheckedChange={(v) => set("randomize", v)} disabled={busy} />
          </label>
          <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border bg-card p-3.5 text-sm">
            <span>
              <span className="block font-bold">Show the score straight away</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Otherwise pupils see their score once the quiz closes.</span>
            </span>
            <Switch checked={form.showResultsImmediately} onCheckedChange={(v) => set("showResultsImmediately", v)} disabled={busy} />
          </label>
        </div>
      </section>

      <Separator />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-extrabold">Questions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Answers are checked on the school server — pupils never see the answer key.</p>
          </div>
          <p className="rounded-full bg-muted px-3 py-1 text-sm font-extrabold">
            {form.questions.length} {form.questions.length === 1 ? "question" : "questions"} · {total} marks
          </p>
        </div>

        <ol className="mt-5 space-y-4">
          {form.questions.map((q, index) => {
            const type = TYPES.find((t) => t.value === q.type)!;
            return (
              <li key={q.id} className="rounded-2xl border bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-heading text-sm font-extrabold">
                    <span className="[&_svg]:size-4">{type.icon}</span>
                    Question {index + 1} · {type.label}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={qLocked || index === 0} onClick={() => move(index, -1)}>
                      <ArrowUpIcon />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Move down" disabled={qLocked || index === form.questions.length - 1} onClick={() => move(index, 1)}>
                      <ArrowDownIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete question ${index + 1}`}
                      disabled={qLocked || form.questions.length === 1}
                      onClick={() => setForm((f) => ({ ...f, questions: f.questions.filter((x) => x.id !== q.id) }))}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{type.hint}</p>

                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_7rem]">
                  <Field>
                    <FieldLabel htmlFor={`qp-${q.id}`}>Question</FieldLabel>
                    <Textarea id={`qp-${q.id}`} rows={2} value={q.prompt} onChange={(e) => update(q.id, { prompt: e.target.value })} maxLength={1000} disabled={qLocked} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`qm-${q.id}`}>Marks</FieldLabel>
                    <Input id={`qm-${q.id}`} type="number" min={1} max={20} value={Number.isFinite(q.points) ? q.points : ""} onChange={(e) => update(q.id, { points: Math.round(Number(e.target.value)) })} className="h-11" disabled={qLocked} />
                  </Field>
                </div>

                {q.type === "picture" ? (
                  <Field className="mt-4">
                    <FieldLabel>Picture</FieldLabel>
                    <MediaUpload
                      purpose="materials"
                      accept="image"
                      value={q.imageUrl ? { publicId: "", url: q.imageUrl, resourceType: "image" } : undefined}
                      onChange={(media) => update(q.id, { imageUrl: media?.url })}
                      onBusyChange={(b) => setUploading((n) => n + (b ? 1 : -1))}
                      disabled={qLocked}
                    />
                  </Field>
                ) : null}

                {q.type === "multiple_choice" || q.type === "picture" ? (
                  <div className="mt-4">
                    <p className="text-sm font-bold">
                      Options <span className="font-normal text-muted-foreground">— choose the correct one</span>
                    </p>
                    <RadioGroup value={q.answer} onValueChange={(v) => update(q.id, { answer: String(v) })} className="mt-2 grid gap-2" disabled={qLocked}>
                      {q.options.map((option, oi) => (
                        <div key={oi} className={cn("flex items-center gap-2 rounded-xl border p-2", option && q.answer === option && "border-success/50 bg-success/8")}>
                          <RadioGroupItem value={option || `__empty-${oi}`} aria-label={`Option ${oi + 1} is correct`} disabled={qLocked || !option.trim()} />
                          <Input
                            aria-label={`Option ${oi + 1}`}
                            value={option}
                            onChange={(e) => {
                              const next = q.options.map((o, i) => (i === oi ? e.target.value : o));
                              update(q.id, { options: next, answer: q.answer === option ? e.target.value : q.answer });
                            }}
                            maxLength={200}
                            placeholder={`Option ${oi + 1}`}
                            className="h-10 flex-1"
                            disabled={qLocked}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove option ${oi + 1}`}
                            disabled={qLocked || q.options.length <= 2}
                            onClick={() => update(q.id, { options: q.options.filter((_, i) => i !== oi), answer: q.answer === option ? "" : q.answer })}
                          >
                            <XIcon />
                          </Button>
                        </div>
                      ))}
                    </RadioGroup>
                    <Button type="button" variant="outline" size="sm" className="mt-2 font-bold" disabled={qLocked || q.options.length >= 6} onClick={() => update(q.id, { options: [...q.options, ""] })}>
                      <PlusIcon />
                      Add option
                    </Button>
                  </div>
                ) : null}

                {q.type === "true_false" ? (
                  <RadioGroup value={q.answer} onValueChange={(v) => update(q.id, { answer: String(v) })} className="mt-4 grid grid-cols-2 gap-2" disabled={qLocked}>
                    {["True", "False"].map((value) => (
                      <label key={value} className="flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-sm font-bold has-data-checked:border-success/50 has-data-checked:bg-success/8">
                        <RadioGroupItem value={value} />
                        {value} is correct
                      </label>
                    ))}
                  </RadioGroup>
                ) : null}

                {q.type === "short_answer" ? (
                  <Field className="mt-4">
                    <FieldLabel htmlFor={`qa-${q.id}`}>Accepted answers (optional)</FieldLabel>
                    <Input
                      id={`qa-${q.id}`}
                      value={q.answer.split("|").join(", ")}
                      onChange={(e) => update(q.id, { answer: e.target.value.split(",").map((x) => x.trim()).join("|") })}
                      placeholder="Abuja, FCT Abuja"
                      className="h-11"
                      disabled={qLocked}
                    />
                    <FieldDescription>Separate answers with commas. Capital letters and extra spaces are ignored. Leave empty to mark it yourself.</FieldDescription>
                  </Field>
                ) : null}

                {q.type === "matching" ? (
                  <div className="mt-4">
                    <p className="text-sm font-bold">
                      Pairs <span className="font-normal text-muted-foreground">— pupils see the right-hand column shuffled</span>
                    </p>
                    <ul className="mt-2 space-y-2">
                      {(q.pairs ?? []).map((pair, pi) => (
                        <li key={pi} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                          <Input
                            aria-label={`Left item ${pi + 1}`}
                            value={pair.left}
                            placeholder="Lion"
                            maxLength={200}
                            className="h-10"
                            disabled={qLocked}
                            onChange={(e) => update(q.id, { pairs: (q.pairs ?? []).map((p, i) => (i === pi ? { ...p, left: e.target.value } : p)) })}
                          />
                          <Input
                            aria-label={`Matches ${pi + 1}`}
                            value={pair.right}
                            placeholder="Cub"
                            maxLength={200}
                            className="h-10"
                            disabled={qLocked}
                            onChange={(e) => update(q.id, { pairs: (q.pairs ?? []).map((p, i) => (i === pi ? { ...p, right: e.target.value } : p)) })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove pair ${pi + 1}`}
                            disabled={qLocked || (q.pairs ?? []).length <= 2}
                            onClick={() => update(q.id, { pairs: (q.pairs ?? []).filter((_, i) => i !== pi) })}
                          >
                            <XIcon />
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 font-bold"
                      disabled={qLocked || (q.pairs ?? []).length >= 8}
                      onClick={() => update(q.id, { pairs: [...(q.pairs ?? []), { left: "", right: "" }] })}
                    >
                      <PlusIcon />
                      Add pair
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>

        {!locked ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <Button
                key={t.value}
                type="button"
                variant="outline"
                className="font-bold"
                disabled={busy || form.questions.length >= 60}
                onClick={() => setForm((f) => ({ ...f, questions: [...f.questions, blank(t.value)] }))}
              >
                <PlusIcon />
                {t.label}
              </Button>
            ))}
          </div>
        ) : null}
      </section>

      <Separator />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" size="lg" className="h-11 flex-1 font-bold" disabled={busy || uploading > 0}>
          {pending === "publish" ? <Spinner /> : <SendIcon />}
          {pending === "publish" ? "Saving…" : isLive ? "Save changes" : "Publish to the class"}
        </Button>
        {!isLive ? (
          <Button type="button" variant="outline" size="lg" className="h-11 font-bold" disabled={busy || uploading > 0} onClick={() => void save(false)}>
            {pending === "draft" ? <Spinner /> : <SaveIcon />}
            {pending === "draft" ? "Saving…" : "Save as draft"}
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">Publishing notifies every pupil in the class and their parents.</p>
    </form>
  );
}
