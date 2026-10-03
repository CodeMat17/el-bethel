"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2Icon, ClockIcon, CloudCheckIcon, CloudIcon, PlayIcon, SendIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import type { PupilQuizQuestion } from "@/convex/quizzes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { saveQuizProgress, startQuiz, submitQuiz, type QuizActionResult } from "@/lib/school/actions/quizzes";
import { cn } from "@/lib/utils";

const parseList = (raw: string | undefined): string[] => {
  try {
    const v: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : "")) : [];
  } catch {
    return [];
  }
};

function isAnswered(q: PupilQuizQuestion, value: string | undefined): boolean {
  if (!value) return false;
  if (q.type === "matching") return parseList(value).filter(Boolean).length === q.left.length;
  return value.trim().length > 0;
}

export function StartQuizButton({ quizId, label }: { quizId: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      size="lg"
      className="h-12 w-full text-base font-bold"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await startQuiz(quizId);
          if (!res.ok) {
            toast.error(res.message ?? "The quiz could not be started.");
            return;
          }
          router.refresh();
        })
      }
    >
      {pending ? <Spinner /> : <PlayIcon />}
      {pending ? "Getting your quiz ready…" : label}
    </Button>
  );
}

/**
 * A quiz in progress. Answers auto-save to the server a moment after each
 * change; the countdown follows the server's deadline, and the quiz hands
 * itself in when time runs out.
 */
export function QuizRunner({
  attemptId,
  title,
  questions,
  deadline,
  serverNow,
  savedAnswers,
}: {
  attemptId: string;
  title: string;
  questions: PupilQuizQuestion[];
  deadline: string;
  serverNow: string;
  savedAnswers: Record<string, string>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<Record<string, string>>(savedAnswers);
  const [saveState, setSaveState] = React.useState<"saved" | "dirty" | "saving" | "error">("saved");
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<QuizActionResult | null>(null);
  // Difference between the server clock and this device's clock, measured once.
  const [offset] = React.useState(() => Date.parse(serverNow) - Date.now());
  const remaining = () => Math.max(0, Math.round((Date.parse(deadline) - (Date.now() + offset)) / 1000));
  const [secondsLeft, setSecondsLeft] = React.useState(remaining);
  const latest = React.useRef(answers);
  React.useEffect(() => {
    latest.current = answers;
  }, [answers]);
  const submitted = React.useRef(false);

  const submit = React.useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    const res = await submitQuiz(attemptId, latest.current);
    setSubmitting(false);
    if (!res.ok) {
      submitted.current = false;
      toast.error(res.message ?? "Your quiz could not be handed in. Please try again.");
      return;
    }
    setResult(res);
    toast.success("Quiz handed in", { description: res.message });
    router.refresh();
  }, [attemptId, router]);

  // Countdown, and hand in automatically at zero.
  React.useEffect(() => {
    if (result) return;
    const timer = window.setInterval(() => {
      const left = remaining();
      setSecondsLeft(left);
      if (left <= 0) {
        window.clearInterval(timer);
        void submit();
      }
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remaining() reads stable props
  }, [result, submit]);

  // Auto-save a moment after the last change.
  React.useEffect(() => {
    if (saveState !== "dirty") return;
    const t = window.setTimeout(async () => {
      setSaveState("saving");
      const res = await saveQuizProgress(attemptId, latest.current);
      setSaveState((s) => (s === "saving" ? (res.ok ? "saved" : "error") : s));
    }, 1200);
    return () => window.clearTimeout(t);
  }, [answers, saveState, attemptId]);

  const setAnswer = (id: string, value: string) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    setSaveState("dirty");
  };

  const answeredCount = questions.filter((q) => isAnswered(q, answers[q.id])).length;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  if (result) {
    const pct = result.score !== null && result.score !== undefined && result.maxScore ? Math.round((result.score / result.maxScore) * 100) : null;
    return (
      <Card className="gap-0 border-success/40 bg-success/10 p-8 text-center">
        <CheckCircle2Icon className="mx-auto size-12 text-success" />
        <h2 className="mt-4 font-heading text-xl font-extrabold">All done!</h2>
        {pct !== null ? (
          <>
            <p className="mt-3 font-heading text-4xl font-extrabold">
              {result.score}
              <span className="text-xl text-muted-foreground"> / {result.maxScore}</span>
            </p>
            <Progress value={pct} className="mx-auto mt-5 max-w-sm" />
          </>
        ) : null}
        <p className="mt-4 text-sm text-muted-foreground">{result.message}</p>
      </Card>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <Card className="sticky top-20 z-10 gap-0 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">{title}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {answeredCount} of {questions.length} answered ·
              {saveState === "saved" ? (
                <span className="inline-flex items-center gap-1"><CloudCheckIcon className="size-3.5" /> saved</span>
              ) : saveState === "error" ? (
                <span className="inline-flex items-center gap-1 text-destructive"><TriangleAlertIcon className="size-3.5" /> not saved</span>
              ) : (
                <span className="inline-flex items-center gap-1"><CloudIcon className="size-3.5" /> saving…</span>
              )}
            </p>
          </div>
          <span
            role="timer"
            aria-label={`${minutes} minutes ${seconds} seconds left`}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold tabular-nums",
              secondsLeft < 60 ? "bg-destructive/12 text-destructive" : "bg-muted text-muted-foreground",
            )}
          >
            <ClockIcon className="size-4" />
            {minutes}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
        <Progress value={questions.length ? (answeredCount / questions.length) * 100 : 0} className="mt-3" />
      </Card>

      {questions.map((q, index) => (
        <Card key={q.id} className="gap-0 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gold/15 text-sm font-extrabold text-gold-foreground dark:text-gold">
              {index + 1}
            </span>
            <p className="text-base font-bold">{q.prompt}</p>
          </div>
          {q.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- teacher-uploaded Cloudinary image of arbitrary size
            <img src={q.imageUrl} alt="Picture for this question" className="mt-4 max-h-72 w-full rounded-xl border object-contain" />
          ) : null}
          <Separator className="my-4" />

          {q.type === "short_answer" ? (
            <Input
              aria-label={`Answer to question ${index + 1}`}
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              maxLength={500}
              className="h-12 text-base"
              placeholder="Type your answer"
              autoComplete="off"
            />
          ) : q.type === "matching" ? (
            <ul className="space-y-2.5">
              {q.left.map((left, li) => {
                const chosen = parseList(answers[q.id]);
                return (
                  <li key={li} className="grid items-center gap-2 rounded-xl border bg-card p-3 sm:grid-cols-2">
                    <span className="text-base font-semibold">{left}</span>
                    <Select
                      value={chosen[li] ?? ""}
                      items={q.right.map((r) => ({ value: r, label: r }))}
                      onValueChange={(value) => {
                        const next = q.left.map((_, i) => chosen[i] ?? "");
                        next[li] = String(value ?? "");
                        setAnswer(q.id, JSON.stringify(next));
                      }}
                    >
                      <SelectTrigger className="h-11 w-full" aria-label={`Match for ${left}`}>
                        <SelectValue placeholder="Choose a match" />
                      </SelectTrigger>
                      <SelectContent>
                        {q.right.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </li>
                );
              })}
            </ul>
          ) : (
            <RadioGroup value={answers[q.id] ?? ""} onValueChange={(value) => setAnswer(q.id, String(value))} className="grid gap-2.5">
              {q.options.map((option) => (
                <label
                  key={option}
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 text-base font-semibold transition-colors has-data-checked:border-gold has-data-checked:bg-gold/10"
                >
                  <RadioGroupItem value={option} />
                  {option}
                </label>
              ))}
            </RadioGroup>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            {q.points} {q.points === 1 ? "mark" : "marks"}
          </p>
        </Card>
      ))}

      <Button type="submit" size="lg" className="h-12 w-full text-base font-bold" disabled={submitting}>
        {submitting ? <Spinner /> : <SendIcon />}
        {submitting ? "Handing in…" : "Hand in my quiz"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Your answers save as you go, so you can carry on if the page reloads. They are marked by the school server.
      </p>
    </form>
  );
}
