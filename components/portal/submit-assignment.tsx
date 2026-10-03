"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2Icon, SendIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { submitAnswers, type AnswerInput } from "@/lib/school/actions/assignments";
import type { Question } from "@/lib/school/types";
import { cn } from "@/lib/utils";

type Answers = Record<string, { text?: string; selected?: number[] }>;

const TYPE_HINT: Record<Question["type"], string> = {
  text: "Type your answer",
  single: "Choose one answer",
  multiple: "Tick every answer that is correct",
};

function isAnswered(q: Question, a: Answers[string] | undefined) {
  if (!a) return false;
  return q.type === "text" ? Boolean(a.text?.trim()) : (a.selected?.length ?? 0) > 0;
}

/** Remember unfinished answers on this device, so a refresh doesn't lose work. */
function useDraft(key: string) {
  const [answers, setAnswers] = React.useState<Answers>({});
  const loaded = React.useRef(false);
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate once from browser storage
      if (raw) setAnswers(JSON.parse(raw) as Answers);
    } catch {
      /* storage unavailable */
    }
    loaded.current = true;
  }, [key]);
  React.useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(answers));
    } catch {
      /* storage unavailable */
    }
  }, [key, answers]);
  const clear = React.useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  }, [key]);
  return [answers, setAnswers, clear] as const;
}

export function AnswerAssignmentForm({
  assignmentId,
  questions,
  dueDate,
}: {
  assignmentId: string;
  questions: Question[];
  dueDate: string;
}) {
  const router = useRouter();
  const [answers, setAnswers, clearDraft] = useDraft(`eia-assignment-${assignmentId}`);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<{ message: string; graded?: boolean } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const answered = questions.filter((q) => isAnswered(q, answers[q.id])).length;
  const unanswered = questions.length - answered;
  const pastDue = Date.parse(dueDate) < Date.now();

  function setText(id: string, text: string) {
    setAnswers((cur) => ({ ...cur, [id]: { text } }));
  }
  function setSingle(id: string, index: number) {
    setAnswers((cur) => ({ ...cur, [id]: { selected: [index] } }));
  }
  function toggle(id: string, index: number, checked: boolean) {
    setAnswers((cur) => {
      const selected = new Set(cur[id]?.selected ?? []);
      if (checked) selected.add(index);
      else selected.delete(index);
      return { ...cur, [id]: { selected: [...selected].sort((a, b) => a - b) } };
    });
  }

  function submit() {
    setError(null);
    const payload: AnswerInput[] = questions.map((q) => {
      const a = answers[q.id];
      return q.type === "text"
        ? { questionId: q.id, text: a?.text?.trim() ?? "" }
        : { questionId: q.id, selected: a?.selected ?? [] };
    });
    startTransition(async () => {
      const res = await submitAnswers(assignmentId, payload);
      setConfirmOpen(false);
      if (!res.ok) {
        setError(res.message ?? "Your work was not submitted. Please try again.");
        toast.error("Not submitted", { description: res.message });
        return;
      }
      clearDraft();
      setResult({ message: res.message ?? "Submitted.", graded: res.graded });
      toast.success("Work submitted", { description: res.message });
      router.refresh();
    });
  }

  if (result) {
    return (
      <Card className="gap-0 border-success/40 bg-success/10 p-8 text-center">
        <CheckCircle2Icon className="mx-auto size-12 text-success" />
        <h3 className="mt-4 font-heading text-xl font-extrabold">Your work has been submitted</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{result.message}</p>
      </Card>
    );
  }

  if (pastDue) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
        The due date has passed, so this assignment can no longer be submitted.
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setConfirmOpen(true);
      }}
    >
      {error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <ol className="space-y-5">
        {questions.map((q, i) => {
          const a = answers[q.id];
          const done = isAnswered(q, a);
          return (
            <li key={q.id}>
              <fieldset className={cn("rounded-2xl border bg-card p-4 sm:p-5", done && "border-success/40")}>
                <legend className="sr-only">Question {i + 1}</legend>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base leading-relaxed font-bold">
                    <span className="mr-2 text-gold-foreground dark:text-gold">{i + 1}.</span>
                    {q.prompt}
                  </p>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                    {q.points} {q.points === 1 ? "mark" : "marks"}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{TYPE_HINT[q.type]}</p>

                <div className="mt-4">
                  {q.type === "text" ? (
                    <Textarea
                      aria-label={`Answer to question ${i + 1}`}
                      rows={4}
                      maxLength={5000}
                      value={a?.text ?? ""}
                      onChange={(e) => setText(q.id, e.target.value)}
                      placeholder="Write your answer here…"
                      className="text-base"
                      disabled={pending}
                    />
                  ) : q.type === "single" ? (
                    <RadioGroup
                      value={a?.selected?.[0] !== undefined ? String(a.selected[0]) : ""}
                      onValueChange={(value) => setSingle(q.id, Number(value))}
                      disabled={pending}
                      className="gap-2"
                    >
                      {q.options.map((option, oi) => (
                        <label
                          key={oi}
                          className={cn(
                            "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 text-base",
                            a?.selected?.[0] === oi && "border-primary bg-primary/5",
                          )}
                        >
                          <RadioGroupItem value={String(oi)} />
                          <span>{option}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="grid gap-2">
                      {q.options.map((option, oi) => {
                        const checked = a?.selected?.includes(oi) ?? false;
                        return (
                          <label
                            key={oi}
                            className={cn(
                              "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 text-base",
                              checked && "border-primary bg-primary/5",
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => toggle(q.id, oi, Boolean(value))}
                              disabled={pending}
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </fieldset>
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border bg-muted/40 p-4 text-sm">
        <p className="font-bold">
          {answered} of {questions.length} questions answered
        </p>
        <p className="mt-1 text-muted-foreground">
          Your answers are saved on this device until you submit. You can only submit once.
        </p>
      </div>

      <Button type="submit" size="lg" className="h-12 w-full text-base font-bold" disabled={pending}>
        {pending ? <Spinner /> : <SendIcon />}
        {pending ? "Sending your work…" : "Submit my work"}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !pending && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your work now?</AlertDialogTitle>
            <AlertDialogDescription>
              {unanswered > 0
                ? `You have not answered ${unanswered} ${unanswered === 1 ? "question" : "questions"}. `
                : "You have answered every question. "}
              Once you submit, you can&apos;t change your answers or submit again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Go back and check</AlertDialogCancel>
            <AlertDialogAction onClick={submit} disabled={pending} className="font-bold">
              {pending ? <Spinner /> : <SendIcon />}
              {pending ? "Submitting…" : "Yes, submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
