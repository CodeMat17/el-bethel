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
import { saveSubjectScores } from "@/lib/school/actions/teaching";
import { GRADE_BANDS, isValidCaMax } from "@/lib/school/config";
import { gradeTone } from "@/lib/school/format";

export interface ResultRow {
  id: string;
  name: string;
  studentNo: string;
  /** Empty string = not entered yet. */
  ca: string;
  exam: string;
}

function bandFor(total: number) {
  return GRADE_BANDS.find((b) => total >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1];
}

const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

export function ResultsEntry({
  classId,
  subjectId,
  termId,
  className,
  subjectName,
  termName,
  rows,
  caMax: initialCaMax,
  locked,
}: {
  classId: string;
  subjectId: string;
  termId: string;
  className: string;
  subjectName: string;
  termName: string;
  rows: ResultRow[];
  /** Marks the CA is out of; the exam takes the rest of 100. */
  caMax: number;
  locked: boolean;
}) {
  const router = useRouter();
  // Seeded from props; the page remounts this component (via key) when the selection changes.
  const [values, setValues] = React.useState(rows);
  const [caMaxInput, setCaMaxInput] = React.useState(String(initialCaMax));
  const parsedCaMax = Number(caMaxInput);
  const caMaxValid = caMaxInput.trim() !== "" && isValidCaMax(parsedCaMax);
  const caMax = caMaxValid ? parsedCaMax : initialCaMax;
  const examMax = 100 - caMax;
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function update(id: string, key: "ca" | "exam", value: string) {
    setValues((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  const entered = values.filter((r) => r.ca.trim() !== "" || r.exam.trim() !== "");
  const classAverage = entered.length
    ? Math.round((entered.reduce((sum, r) => sum + (num(r.ca) ?? 0) + (num(r.exam) ?? 0), 0) / entered.length) * 10) / 10
    : 0;

  function save() {
    setError(null);
    if (!caMaxValid) return setError("The CA weighting must be a whole number between 0 and 100.");
    for (const r of values) {
      const ca = num(r.ca);
      const exam = num(r.exam);
      if (ca !== undefined && (!Number.isFinite(ca) || ca < 0 || ca > caMax)) return setError(`${r.name}: CA must be between 0 and ${caMax}.`);
      if (exam !== undefined && (!Number.isFinite(exam) || exam < 0 || exam > examMax)) return setError(`${r.name}: exam must be between 0 and ${examMax}.`);
    }
    startTransition(async () => {
      const res = await saveSubjectScores({
        classId,
        subjectId,
        termId,
        caMax,
        rows: values.map((r) => ({ studentId: r.id, ca: num(r.ca), exam: num(r.exam) })),
      });
      if (!res.ok) {
        setError(res.message ?? "Scores were not saved.");
        toast.error("Not saved", { description: res.message });
        return;
      }
      toast.success("Scores saved", { description: res.message });
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
          These results have been published, so they are read-only. Ask an administrator if a score needs to change.
        </div>
      ) : null}

      <Card className="sticky top-20 z-10 gap-0 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold">
              {className} · {subjectName}
            </p>
            <p className="text-xs text-muted-foreground">
              {termName} · {entered.length} of {values.length} pupils entered
            </p>
          </div>
          <p className="text-sm font-bold">
            Class average <span className="text-gold-foreground dark:text-gold">{classAverage}%</span>
          </p>
        </div>
        <Separator className="my-3" />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <label htmlFor="ca-weighting" className="font-bold">
            CA weighting
          </label>
          <div className="flex items-center gap-1.5">
            <Input
              id="ca-weighting"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              value={caMaxInput}
              onChange={(e) => setCaMaxInput(e.target.value)}
              aria-invalid={!caMaxValid}
              aria-describedby="ca-weighting-help"
              className="h-9 w-20 text-center tabular-nums"
              disabled={locked || pending}
            />
            <span className="font-semibold text-muted-foreground">%</span>
          </div>
          <p id="ca-weighting-help" className="text-muted-foreground">
            {caMaxValid ? (
              <>
                CA out of <span className="font-bold text-foreground">{caMax}</span> · exam out of{" "}
                <span className="font-bold text-foreground">{examMax}</span>
              </>
            ) : (
              <span className="font-semibold text-destructive">Enter a whole number from 0 to 100.</span>
            )}
          </p>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-xl text-sm">
          <caption className="sr-only">Score entry for {subjectName}</caption>
          <thead className="bg-muted/70">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-extrabold uppercase">Pupil</th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-extrabold uppercase">
                CA
                <span className="mt-0.5 block font-normal normal-case text-muted-foreground">out of {caMax}</span>
              </th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-extrabold uppercase">
                Exam
                <span className="mt-0.5 block font-normal normal-case text-muted-foreground">out of {examMax}</span>
              </th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-extrabold uppercase">Total</th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-extrabold uppercase">Grade</th>
            </tr>
          </thead>
          <tbody>
            {values.map((row) => {
              const has = row.ca.trim() !== "" || row.exam.trim() !== "";
              const total = Math.round(((num(row.ca) ?? 0) + (num(row.exam) ?? 0)) * 10) / 10;
              const band = bandFor(total);
              return (
                <tr key={row.id} className="border-t">
                  <th scope="row" className="px-4 py-2.5 text-left">
                    <span className="block truncate text-sm font-bold">{row.name}</span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">{row.studentNo}</span>
                  </th>
                  {(["ca", "exam"] as const).map((key) => (
                    <td key={key} className="px-2 py-2 text-center">
                      <label htmlFor={`${key}-${row.id}`} className="sr-only">
                        {key === "ca" ? "Continuous assessment" : "Exam"} for {row.name}
                      </label>
                      <Input
                        id={`${key}-${row.id}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={key === "ca" ? caMax : examMax}
                        step={0.5}
                        value={row[key]}
                        onChange={(e) => update(row.id, key, e.target.value)}
                        className="mx-auto h-10 w-20 text-center tabular-nums"
                        disabled={locked || pending}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-extrabold tabular-nums">{has ? total : "—"}</td>
                  <td className="px-3 py-2 text-center">
                    {has ? <StatusPill tone={gradeTone(band.grade)} dot={false}>{band.grade}</StatusPill> : <span className="text-muted-foreground">—</span>}
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
        {pending ? "Saving…" : "Save all scores"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Leave both boxes empty for a pupil who did not take this subject. Totals, grades and subject positions are
        calculated when you save. Set the CA weighting above; the examination carries the rest of the 100 marks. The
        weighting applies to every pupil in this subject for this class and term.
      </p>
    </form>
  );
}
