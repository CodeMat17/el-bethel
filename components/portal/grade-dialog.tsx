"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, PenSquareIcon, TriangleAlertIcon, XIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { gradeSubmission } from "@/lib/school/actions/assignments";
import type { Question, QuestionAnswer } from "@/lib/school/types";
import { cn } from "@/lib/utils";

const QUICK_FEEDBACK = [
  "Excellent work. Your answers are clear and well explained.",
  "Good effort. Read each question twice before you answer.",
  "Well done — remember to explain your thinking in the written answers.",
  "Please see me so we can go over the questions you found difficult.",
];

/** Mark one submission question by question. Choice questions arrive pre-marked. */
export function GradeDialog({
  submissionId,
  studentName,
  assignmentTitle,
  questions,
  answers,
  currentFeedback,
  graded,
}: {
  submissionId: string;
  studentName: string;
  assignmentTitle: string;
  questions: Question[];
  answers: QuestionAnswer[];
  currentFeedback?: string;
  graded: boolean;
}) {
  const router = useRouter();
  const byId = React.useMemo(() => new Map(answers.map((a) => [a.questionId, a])), [answers]);
  const [open, setOpen] = React.useState(false);
  const [marks, setMarks] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, byId.get(q.id)?.awarded !== undefined ? String(byId.get(q.id)!.awarded) : ""])),
  );
  const [feedback, setFeedback] = React.useState(currentFeedback ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const maxScore = questions.reduce((n, q) => n + q.points, 0);
  const total = questions.reduce((n, q) => n + (Number(marks[q.id]) || 0), 0);
  const unmarked = questions.filter((q) => marks[q.id] === "").length;

  function save() {
    setError(null);
    for (const [i, q] of questions.entries()) {
      const raw = marks[q.id];
      const value = Number(raw);
      if (raw === "" || !Number.isFinite(value)) return setError(`Enter a mark for question ${i + 1}.`);
      if (value < 0 || value > q.points) return setError(`Question ${i + 1} is out of ${q.points}.`);
    }
    startTransition(async () => {
      const res = await gradeSubmission(
        submissionId,
        questions.map((q) => ({ questionId: q.id, awarded: Number(marks[q.id]) })),
        feedback,
      );
      if (!res.ok) {
        setError(res.message ?? "Marks were not saved.");
        toast.error("Not saved", { description: res.message });
        return;
      }
      toast.success(`${studentName} marked`, { description: res.message });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button size="sm" variant={graded ? "outline" : "default"} className="font-bold" />}>
        <PenSquareIcon />
        {graded ? "Review marks" : "Mark"}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{studentName}</DialogTitle>
          <DialogDescription>{assignmentTitle}</DialogDescription>
        </DialogHeader>

        {error ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <ol className="space-y-3">
          {questions.map((q, i) => {
            const a = byId.get(q.id);
            return (
              <li key={q.id} className="rounded-xl border bg-card p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-relaxed font-bold">
                    <span className="mr-1.5 text-gold-foreground dark:text-gold">{i + 1}.</span>
                    {q.prompt}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Input
                      aria-label={`Marks for question ${i + 1}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={q.points}
                      step={0.5}
                      value={marks[q.id]}
                      onChange={(e) => setMarks((m) => ({ ...m, [q.id]: e.target.value }))}
                      className={cn("h-9 w-16 text-center font-bold", marks[q.id] === "" && "border-gold")}
                      disabled={pending}
                    />
                    <span className="text-xs font-bold text-muted-foreground">/ {q.points}</span>
                  </div>
                </div>
                {q.type === "text" ? (
                  <p className={cn("mt-2 rounded-lg bg-muted/60 p-2.5 text-sm whitespace-pre-wrap", !a?.text && "italic text-muted-foreground")}>
                    {a?.text || "No answer given."}
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {q.options.map((option, oi) => {
                      const chosen = a?.selected?.includes(oi) ?? false;
                      const correct = q.correct.includes(oi);
                      return (
                        <li
                          key={oi}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm",
                            chosen && "bg-primary/8 font-semibold",
                            correct && "text-success",
                          )}
                        >
                          {correct ? <CheckIcon className="size-3.5" /> : chosen ? <XIcon className="size-3.5 text-destructive" /> : <span className="size-3.5" />}
                          {option}
                          {chosen ? <span className="ml-auto text-xs text-muted-foreground">pupil&apos;s choice</span> : null}
                        </li>
                      );
                    })}
                    {a?.autoMarked ? <li className="text-xs text-muted-foreground">Marked automatically — you can change it.</li> : null}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>

        <Separator />

        <Field>
          <FieldLabel htmlFor={`feedback-${submissionId}`}>Feedback for the pupil (optional)</FieldLabel>
          <Textarea id={`feedback-${submissionId}`} rows={3} maxLength={2000} value={feedback} onChange={(e) => setFeedback(e.target.value)} disabled={pending} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_FEEDBACK.map((text) => (
              <button
                key={text}
                type="button"
                disabled={pending}
                onClick={() => setFeedback(text)}
                className="rounded-full border px-2.5 py-1 text-left text-xs font-semibold transition-colors hover:border-gold/50 hover:bg-gold/8"
              >
                {text}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold">
            Total: <span className="font-heading text-lg">{total}</span> / {maxScore}
            {unmarked > 0 ? <span className="ml-2 text-xs font-semibold text-muted-foreground">({unmarked} still to mark)</span> : null}
          </p>
          <Button type="button" size="lg" className="h-11 font-bold" onClick={save} disabled={pending}>
            {pending ? <Spinner /> : <PenSquareIcon />}
            {pending ? "Saving…" : graded ? "Update marks" : "Save marks"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
