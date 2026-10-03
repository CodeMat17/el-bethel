"use client";

import * as React from "react";
import { CheckIcon, SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { findStudents } from "@/lib/school/actions/admin";

type Found = { id: string; name: string; studentNo: string; classId: string };

/**
 * Search-and-pick a current pupil inside an uncontrolled form. The chosen id is
 * submitted as a hidden input named `name` (default "studentId").
 */
export function StudentPicker({
  name = "studentId",
  label = "Pupil",
  classNames,
  initial,
}: {
  name?: string;
  label?: string;
  classNames: Record<string, string>;
  initial?: { id: string; name: string };
}) {
  const [chosen, setChosen] = React.useState<{ id: string; name: string } | null>(initial ?? null);
  const [term, setTerm] = React.useState("");
  const [results, setResults] = React.useState<Found[]>([]);
  const [searching, startSearch] = React.useTransition();
  const id = React.useId();

  React.useEffect(() => {
    if (chosen || term.trim().length < 2) return;
    const handle = window.setTimeout(() => startSearch(async () => setResults(await findStudents(term))), 250);
    return () => window.clearTimeout(handle);
  }, [term, chosen]);

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {chosen ? (
        <div className="flex items-center gap-2 rounded-xl border bg-muted/50 p-2.5 pl-3.5">
          <CheckIcon className="size-4 text-success" />
          <span className="flex-1 truncate text-sm font-bold">{chosen.name}</span>
          <input type="hidden" name={name} value={chosen.id} />
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Choose someone else" onClick={() => setChosen(null)}>
            <XIcon />
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id={id} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Type a name or student number" className="h-11 pl-9" autoComplete="off" />
            {searching ? <Spinner className="absolute top-1/2 right-3 -translate-y-1/2" /> : null}
          </div>
          {term.trim().length >= 2 ? (
            <ul className="max-h-52 space-y-1.5 overflow-y-auto">
              {results.length === 0 && !searching ? <li className="py-3 text-center text-sm text-muted-foreground">No pupils match.</li> : null}
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => setChosen({ id: r.id, name: r.name })}
                  >
                    <span className="truncate font-bold">{r.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {classNames[r.classId] ?? ""} · {r.studentNo}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </Field>
  );
}
