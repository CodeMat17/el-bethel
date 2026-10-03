import { CheckIcon, CircleIcon, SquareIcon, XIcon } from "lucide-react";

import type { Question, QuestionAnswer } from "@/lib/school/types";
import { cn } from "@/lib/utils";

/**
 * Read-only view of a submission: each question with the pupil's answer and,
 * when available, marks and the correct options.
 */
export function AnswerReview({
  questions,
  answers,
  showMarks,
}: {
  questions: Question[];
  answers: QuestionAnswer[];
  showMarks: boolean;
}) {
  const byId = new Map(answers.map((a) => [a.questionId, a]));
  return (
    <ol className="space-y-4">
      {questions.map((q, i) => {
        const a = byId.get(q.id);
        const hasKey = q.correct.length > 0;
        const full = a?.awarded !== undefined && a.awarded >= q.points;
        return (
          <li key={q.id} className="rounded-2xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed font-bold">
                <span className="mr-1.5 text-gold-foreground dark:text-gold">{i + 1}.</span>
                {q.prompt}
              </p>
              {showMarks && a?.awarded !== undefined ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold",
                    full ? "bg-success/15 text-success" : a.awarded > 0 ? "bg-gold/15 text-gold-foreground dark:text-gold" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {a.awarded}/{q.points}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                  {q.points} {q.points === 1 ? "mark" : "marks"}
                </span>
              )}
            </div>

            {q.type === "text" ? (
              <p className={cn("mt-3 rounded-xl bg-muted/60 p-3 text-sm leading-relaxed whitespace-pre-wrap", !a?.text && "italic text-muted-foreground")}>
                {a?.text || "No answer given."}
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {q.options.map((option, oi) => {
                  const chosen = a?.selected?.includes(oi) ?? false;
                  const correct = q.correct.includes(oi);
                  const Mark = q.type === "single" ? CircleIcon : SquareIcon;
                  return (
                    <li
                      key={oi}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm",
                        chosen && "border-primary/50 bg-primary/5 font-semibold",
                        hasKey && correct && "border-success/50 bg-success/10",
                        hasKey && chosen && !correct && "border-destructive/40 bg-destructive/8",
                      )}
                    >
                      {hasKey && correct ? (
                        <CheckIcon className="size-4 shrink-0 text-success" />
                      ) : hasKey && chosen ? (
                        <XIcon className="size-4 shrink-0 text-destructive" />
                      ) : (
                        <Mark className={cn("size-3.5 shrink-0", chosen ? "fill-current text-primary" : "text-muted-foreground")} />
                      )}
                      <span className="min-w-0 flex-1">{option}</span>
                      {chosen ? <span className="text-xs font-bold text-muted-foreground">Chosen</span> : null}
                    </li>
                  );
                })}
                {(a?.selected?.length ?? 0) === 0 ? (
                  <li className="text-xs italic text-muted-foreground">No option chosen.</li>
                ) : null}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
