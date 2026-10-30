"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LockIcon, SaveIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { StatusPill } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { saveMidtermScores } from "@/lib/school/actions/teaching";
import { gradeFor, isValidMidtermMax } from "@/lib/school/config";
import { gradeTone } from "@/lib/school/format";

export interface MidtermRow {
  id: string;
  name: string;
  studentNo: string;
  /** Empty string = not entered yet. */
  score: string;
}

const num = (v: string) => (v.trim() === "" ? undefined : Number(v));
const percentOf = (score: number, max: number) => Math.round((score / max) * 1000) / 10;

/** Mid-term test score entry for one subject: one score per pupil, out of a mark the teacher sets. */
export function MidtermEntry({
  classId,
  subjectId,
  termId,
  className,
  subjectName,
  termName,
  rows,
  maxScore: initialMax,
  locked,
}: {
  classId: string;
  subjectId: string;
  termId: string;
  className: string;
  subjectName: string;
  termName: string;
  rows: MidtermRow[];
  maxScore: number;
  locked: boolean;
}) {
  const router = useRouter();
  // Seeded from props; the page remounts this component (via key) when the selection changes.
  const [values, setValues] = React.useState(rows);
  const [maxInput, setMaxInput] = React.useState(String(initialMax));
  const parsedMax = Number(maxInput);
  const maxValid = maxInput.trim() !== "" && isValidMidtermMax(parsedMax);
  const maxScore = maxValid ? parsedMax : initialMax;
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const entered = values.filter((r) => r.score.trim() !== "");
  const classAverage = entered.length
    ? Math.round((entered.reduce((sum, r) => sum + percentOf(num(r.score) ?? 0, maxScore), 0) / entered.length) * 10) / 10
    : 0;

  function save() {
    setError(null);
    if (!maxValid) return setError("The test must be marked out of a whole number between 1 and 100.");
    for (const r of values) {
      const score = num(r.score);
      if (score !== undefined && (!Number.isFinite(score) || score < 0 || score > maxScore)) {
        return setError(`${r.name}: score must be between 0 and ${maxScore}.`);
      }
    }
    startTransition(async () => {
      const res = await saveMidtermScores({
        classId,
        subjectId,
        termId,
        maxScore,
        rows: values.map((r) => ({ studentId: r.id, score: num(r.score) })),
      });
      if (!res.ok) {
        setError(res.message ?? "Scores were not saved.");
        toast.error("Not saved", { description: res.message });
        return;
      }
      toast.success("Mid-term scores saved", { description: res.message });
      router.refresh();
    });
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {locked ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-info/40 bg-info/10 px-4 py-3 text-sm font-semibold">
          <LockIcon className="mt-0.5 size-4 shrink-0" />
          These mid-term results have been published, so they are read-only. Ask an administrator if a score needs to change.
        </div>
      ) : null}

      <Card className="sticky top-20 z-10 gap-0 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold">
              {className} · {subjectName}
            </p>
            <p className="text-xs text-muted-foreground">
              {termName} mid-term · {entered.length} of {values.length} pupils entered
            </p>
          </div>
          <p className="text-sm font-bold">
            Class average <span className="text-gold-foreground dark:text-gold">{classAverage}%</span>
          </p>
        </div>
        <Separator className="my-3" />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <label htmlFor="midterm-max" className="font-bold">
            Test marked out of
          </label>
          <Input
            id="midterm-max"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            step={1}
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            aria-invalid={!maxValid}
            className="h-9 w-20 text-center tabular-nums"
            disabled={locked || pending}
          />
          {maxValid ? null : <span className="font-semibold text-destructive">Enter a whole number from 1 to 100.</span>}
        </div>
      </Card>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-lg text-sm">
          <caption className="sr-only">Mid-term score entry for {subjectName}</caption>
          <thead className="bg-muted/70">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-extrabold uppercase">Pupil</th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-extrabold uppercase">
                Score
                <span className="mt-0.5 block font-normal normal-case text-muted-foreground">out of {maxScore}</span>
              </th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-extrabold uppercase">%</th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-extrabold uppercase">Grade</th>
            </tr>
          </thead>
          <tbody>
            {values.map((row) => {
              const score = num(row.score);
              const percent = score === undefined ? null : percentOf(score, maxScore);
              return (
                <tr key={row.id} className="border-t">
                  <th scope="row" className="px-4 py-2.5 text-left">
                    <span className="block truncate text-sm font-bold">{row.name}</span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">{row.studentNo}</span>
                  </th>
                  <td className="px-2 py-2 text-center">
                    <label htmlFor={`midterm-${row.id}`} className="sr-only">
                      Mid-term score for {row.name}
                    </label>
                    <Input
                      id={`midterm-${row.id}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={maxScore}
                      step={0.5}
                      value={row.score}
                      onChange={(e) => setValues((current) => current.map((r) => (r.id === row.id ? { ...r, score: e.target.value } : r)))}
                      className="mx-auto h-10 w-20 text-center tabular-nums"
                      disabled={locked || pending}
                    />
                  </td>
                  <td className="px-3 py-2 text-center font-extrabold tabular-nums">{percent ?? "—"}</td>
                  <td className="px-3 py-2 text-center">
                    {percent !== null ? (
                      <StatusPill tone={gradeTone(gradeFor(percent).grade)} dot={false}>{gradeFor(percent).grade}</StatusPill>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Separator />
      <Button type="submit" size="lg" className="h-11 w-full font-bold sm:w-auto" disabled={pending || locked}>
        {pending ? <Spinner /> : <SaveIcon />}
        {pending ? "Saving…" : "Save mid-term scores"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Leave the box empty for a pupil who did not sit this test. Grades use the same bands as the end-of-term results,
        worked out from the percentage. Mid-term scores are reported to families on their own and do not change the
        end-of-term CA or exam.
      </p>
    </form>
  );
}
