"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PenSquareIcon, SaveIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { markQuizAttempt } from "@/lib/school/actions/quizzes";
import type { QuizQuestion } from "@/lib/school/types";
import { cn } from "@/lib/utils";

function display(q: QuizQuestion, value: string | undefined): string {
  if (!value) return "No answer";
  if (q.type !== "matching") return value;
  try {
    const list: unknown = JSON.parse(value);
    if (!Array.isArray(list)) return value;
    return (q.pairs ?? []).map((p, i) => `${p.left} → ${String(list[i] || "—")}`).join("; ");
  } catch {
    return value;
  }
}

function key(q: QuizQuestion): string {
  if (q.type === "matching") return (q.pairs ?? []).map((p) => `${p.left} → ${p.right}`).join("; ");
  if (q.type === "short_answer") return q.answer ? q.answer.split("|").join(" / ") : "Marked by the teacher";
  return q.answer;
}

/** Mark typed answers, or override any automatic mark, for one attempt. */
export function QuizMarkDialog({
  attemptId,
  studentName,
  attemptNo,
  questions,
  answers,
  marks,
  feedback,
  needsMarking,
}: {
  attemptId: string;
  studentName: string;
  attemptNo: number;
  questions: QuizQuestion[];
  answers: Record<string, string>;
  marks: Record<string, number>;
  feedback?: string;
  needsMarking: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [comment, setComment] = React.useState(feedback ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function reset() {
    setValues(Object.fromEntries(questions.map((q) => [q.id, marks[q.id] === undefined ? "" : String(marks[q.id])])));
    setComment(feedback ?? "");
    setError(null);
  }

  function save() {
    const out: Record<string, number> = {};
    for (const q of questions) {
      const raw = values[q.id]?.trim();
      if (!raw) continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || n > q.points) return setError(`Marks for question ${questions.indexOf(q) + 1} must be 0–${q.points}.`);
      out[q.id] = n;
    }
    startTransition(async () => {
      const res = await markQuizAttempt(attemptId, out, comment);
      if (!res.ok) return setError(res.message ?? "Not saved.");
      toast.success(res.message ?? "Marked");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (next) reset();
        setOpen(next);
      }}
    >
      <DialogTrigger render={<Button size="sm" variant={needsMarking ? "default" : "outline"} className="font-bold" />}>
        <PenSquareIcon />
        {needsMarking ? "Mark" : "Review"}
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {studentName} · attempt {attemptNo}
          </DialogTitle>
          <DialogDescription>Enter marks for typed answers. You can also change an automatic mark.</DialogDescription>
        </DialogHeader>
        {error ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        ) : null}
        <ol className="space-y-3">
          {questions.map((q, i) => {
            const unmarked = marks[q.id] === undefined;
            return (
              <li key={q.id} className={cn("rounded-xl border p-3.5", unmarked && "border-warning/50 bg-warning/8")}>
                <p className="text-sm font-bold">
                  {i + 1}. {q.prompt}
                </p>
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">Answer: </span>
                  {display(q, answers[q.id])}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Key: {key(q)}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <Input
                    aria-label={`Marks for question ${i + 1}`}
                    type="number"
                    min={0}
                    max={q.points}
                    step={0.5}
                    value={values[q.id] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [q.id]: e.target.value }))}
                    className="h-10 w-24"
                    disabled={pending}
                  />
                  <span className="text-sm text-muted-foreground">out of {q.points}</span>
                </div>
              </li>
            );
          })}
        </ol>
        <Field>
          <FieldLabel htmlFor={`fb-${attemptId}`}>Comment for the pupil (optional)</FieldLabel>
          <Textarea id={`fb-${attemptId}`} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} disabled={pending} />
        </Field>
        <Button size="lg" className="h-11 w-full font-bold" onClick={save} disabled={pending}>
          {pending ? <Spinner /> : <SaveIcon />}
          {pending ? "Saving…" : "Save marks"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
