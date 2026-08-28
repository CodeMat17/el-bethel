"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2Icon, ClockIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { submitQuizAttempt, type QuizState } from "@/lib/school/actions/quizzes";
import type { QuizQuestion } from "@/lib/school/types";

const INITIAL: QuizState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-12 w-full text-base font-bold" disabled={pending}>
      {pending ? <Spinner /> : <SendIcon />}
      {pending ? "Checking your answers…" : "Finish and see my score"}
    </Button>
  );
}

export function QuizRunner({
  quizId,
  title,
  questions,
  durationMinutes,
}: {
  quizId: string;
  title: string;
  questions: QuizQuestion[];
  durationMinutes: number;
}) {
  const [state, action] = useActionState<QuizState, FormData>(submitQuizAttempt, INITIAL);
  const [answered, setAnswered] = React.useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = React.useState(durationMinutes * 60);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          formRef.current?.requestSubmit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state.ok]);

  React.useEffect(() => {
    if (state.ok && state.message) {
      toast.success("Quiz finished", { description: state.message });
    } else if (!state.ok && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const answeredCount = Object.values(answered).filter(Boolean).length;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  if (state.ok) {
    const pct = state.maxScore ? Math.round(((state.score ?? 0) / state.maxScore) * 100) : 0;
    return (
      <Card className="gap-0 border-success/40 bg-success/10 p-8 text-center">
        <CheckCircle2Icon className="mx-auto size-12 text-success" />
        <h2 className="mt-4 font-heading text-xl font-extrabold">All done!</h2>
        <p className="mt-3 font-heading text-4xl font-extrabold">
          {state.score}
          <span className="text-xl text-muted-foreground"> / {state.maxScore}</span>
        </p>
        <Progress value={pct} className="mx-auto mt-5 max-w-sm" />
        <p className="mt-4 text-sm text-muted-foreground">
          {pct >= 80
            ? "Excellent work. You really know this topic."
            : pct >= 50
              ? "Good effort. Go over the questions you missed with your teacher."
              : "Keep going — ask your teacher to look at this topic with you."}
        </p>
      </Card>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <input type="hidden" name="quizId" value={quizId} />

      <Card className="sticky top-20 z-10 gap-0 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">{title}</p>
            <p className="text-xs text-muted-foreground">
              {answeredCount} of {questions.length} answered
            </p>
          </div>
          <span
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold tabular-nums ${
              secondsLeft < 60 ? "bg-destructive/12 text-destructive" : "bg-muted text-muted-foreground"
            }`}
          >
            <ClockIcon className="size-4" />
            {minutes}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
        <Progress value={(answeredCount / questions.length) * 100} className="mt-3" />
      </Card>

      {questions.map((question, index) => (
        <Card key={question.id} className="gap-0 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gold/15 text-sm font-extrabold text-gold-foreground dark:text-gold">
              {index + 1}
            </span>
            <p className="text-base font-bold">{question.prompt}</p>
          </div>
          <Separator className="my-4" />
          <RadioGroup
            name={`q-${question.id}`}
            value={answered[question.id] ?? ""}
            onValueChange={(value) => setAnswered((a) => ({ ...a, [question.id]: String(value) }))}
            className="grid gap-2.5"
          >
            {question.options.map((option) => (
              <label
                key={option}
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 text-base font-semibold transition-colors has-data-checked:border-gold has-data-checked:bg-gold/10"
              >
                <RadioGroupItem value={option} />
                {option}
              </label>
            ))}
          </RadioGroup>
          <p className="mt-3 text-xs text-muted-foreground">{question.points} marks</p>
        </Card>
      ))}

      <SubmitButton />
      <p className="text-center text-xs text-muted-foreground">
        Your answers are checked by the school server, and your score is saved to your record.
      </p>
    </form>
  );
}
