"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { SaveIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { StatusPill } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { saveResults, type TeachingState } from "@/lib/school/actions/teaching";
import { GRADE_BANDS } from "@/lib/school/config";
import { gradeTone } from "@/lib/school/format";

const INITIAL: TeachingState = { ok: false };

export interface ResultRow {
  id: string;
  name: string;
  studentNo: string;
  classwork: number;
  assignment: number;
  test: number;
  exam: number;
}

const COLUMNS = [
  { key: "classwork", label: "Classwork", max: 10 },
  { key: "assignment", label: "Assignments", max: 10 },
  { key: "test", label: "Tests", max: 20 },
  { key: "exam", label: "Exam", max: 60 },
] as const;

function gradeFor(total: number) {
  return GRADE_BANDS.find((b) => total >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1];
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11 w-full font-bold sm:w-auto" disabled={pending}>
      {pending ? <Spinner /> : <SaveIcon />}
      {pending ? "Saving…" : "Save all scores"}
    </Button>
  );
}

export function ResultsEntry({
  classId,
  subjectId,
  termId,
  className,
  subjectName,
  termName,
  rows,
}: {
  classId: string;
  subjectId: string;
  termId: string;
  className: string;
  subjectName: string;
  termName: string;
  rows: ResultRow[];
}) {
  const [state, action] = useActionState<TeachingState, FormData>(saveResults, INITIAL);
  // Seeded from props; the page remounts this component (via key) when the selection changes.
  const [values, setValues] = React.useState(rows);

  React.useEffect(() => {
    if (state.ok && state.message) toast.success("Scores saved", { description: state.message });
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  function update(id: string, key: (typeof COLUMNS)[number]["key"], value: number) {
    setValues((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  const classAverage = values.length
    ? Math.round(
        (values.reduce((sum, r) => sum + Math.min(100, r.classwork + r.assignment + r.test + r.exam), 0) /
          values.length) *
          10,
      ) / 10
    : 0;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="termId" value={termId} />

      {state.message && !state.ok ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
        >
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </div>
      ) : null}

      <Card className="sticky top-20 z-10 gap-0 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold">
              {className} · {subjectName}
            </p>
            <p className="text-xs text-muted-foreground">
              {termName} · {values.length} pupils
            </p>
          </div>
          <p className="text-sm font-bold">
            Class average <span className="text-gold-foreground dark:text-gold">{classAverage}%</span>
          </p>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-3xl text-sm">
          <caption className="sr-only">Score entry for {subjectName}</caption>
          <thead className="bg-muted/70">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-extrabold uppercase">Pupil</th>
              {COLUMNS.map((column) => (
                <th key={column.key} scope="col" className="px-3 py-3 text-center text-xs font-extrabold uppercase">
                  {column.label}
                  <span className="mt-0.5 block font-normal normal-case text-muted-foreground">
                    out of {column.max}
                  </span>
                </th>
              ))}
              <th scope="col" className="px-3 py-3 text-center text-xs font-extrabold uppercase">Total</th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-extrabold uppercase">Grade</th>
            </tr>
          </thead>
          <tbody>
            {values.map((row) => {
              const total = Math.min(100, row.classwork + row.assignment + row.test + row.exam);
              const band = gradeFor(total);
              return (
                <tr key={row.id} className="border-t">
                  <th scope="row" className="px-4 py-2.5 text-left">
                    <span className="block truncate text-sm font-bold">{row.name}</span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {row.studentNo}
                    </span>
                  </th>
                  {COLUMNS.map((column) => (
                    <td key={column.key} className="px-2 py-2">
                      <label htmlFor={`${column.key}-${row.id}`} className="sr-only">
                        {column.label} for {row.name}
                      </label>
                      <Input
                        id={`${column.key}-${row.id}`}
                        name={`${column.key}-${row.id}`}
                        type="number"
                        min={0}
                        max={column.max}
                        value={row[column.key]}
                        onChange={(e) => update(row.id, column.key, Number(e.target.value))}
                        className="h-10 w-20 text-center tabular-nums"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-extrabold tabular-nums">{total}</td>
                  <td className="px-3 py-2 text-center">
                    <StatusPill tone={gradeTone(band.grade)} dot={false}>{band.grade}</StatusPill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Separator />
      <SaveButton />

      <p className="text-xs text-muted-foreground">
        Totals and grades are recalculated on the server when you save. Continuous assessment carries 40
        percent and the examination 60 percent.
      </p>
    </form>
  );
}
