"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckIcon, SaveIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { saveAttendance, type TeachingState } from "@/lib/school/actions/teaching";
import { avatarTone, initials } from "@/lib/school/format";
import type { AttendanceStatus } from "@/lib/school/types";
import { cn } from "@/lib/utils";

const INITIAL: TeachingState = { ok: false };

const OPTIONS: { value: AttendanceStatus; label: string; active: string }[] = [
  { value: "present", label: "Present", active: "bg-success text-success-foreground border-success" },
  { value: "late", label: "Late", active: "bg-warning text-warning-foreground border-warning" },
  { value: "absent", label: "Absent", active: "bg-destructive text-[oklch(0.985_0.01_84)] border-destructive" },
  { value: "excused", label: "Excused", active: "bg-info text-info-foreground border-info" },
];

export interface RegisterPupil {
  id: string;
  name: string;
  studentNo: string;
  avatarSeed: string;
  status: AttendanceStatus;
  note: string;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-11 w-full font-bold sm:w-auto" disabled={pending}>
      {pending ? <Spinner /> : <SaveIcon />}
      {pending ? "Saving…" : "Save register"}
    </Button>
  );
}

export function AttendanceRegister({
  classId,
  className,
  date,
  pupils,
}: {
  classId: string;
  className: string;
  date: string;
  pupils: RegisterPupil[];
}) {
  const [state, action] = useActionState<TeachingState, FormData>(saveAttendance, INITIAL);
  // Seeded from props; the page remounts this component (via key) when the class or date changes.
  const [rows, setRows] = React.useState(pupils);

  React.useEffect(() => {
    if (state.ok && state.message) toast.success("Register saved", { description: state.message });
    else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);

  function setStatus(id: string, status: AttendanceStatus) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
  }

  function markAll(status: AttendanceStatus) {
    setRows((current) => current.map((row) => ({ ...row, status })));
  }

  const counts = OPTIONS.map((option) => ({
    ...option,
    count: rows.filter((r) => r.status === option.value).length,
  }));

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="date" value={date} />

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
            <p className="text-sm font-extrabold">{className}</p>
            <p className="text-xs text-muted-foreground">{rows.length} pupils · {date}</p>
          </div>
          <Button type="button" variant="outline" size="sm" className="font-bold" onClick={() => markAll("present")}>
            <CheckIcon />
            Mark all present
          </Button>
        </div>
        <Separator className="my-3" />
        <ul className="flex flex-wrap gap-3 text-xs font-bold">
          {counts.map((c) => (
            <li key={c.value} className="text-muted-foreground">
              {c.label}: <span className="text-foreground">{c.count}</span>
            </li>
          ))}
        </ul>
      </Card>

      <ul className="space-y-2.5">
        {rows.map((pupil) => (
          <li key={pupil.id}>
            <Card className="gap-0 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className={cn("text-xs font-bold", avatarTone(pupil.avatarSeed))}>
                      {initials(...pupil.name.split(" "))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{pupil.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{pupil.studentNo}</p>
                  </div>
                </div>

                <input type="hidden" name={`status-${pupil.id}`} value={pupil.status} />

                <div
                  role="radiogroup"
                  aria-label={`Attendance for ${pupil.name}`}
                  className="grid shrink-0 grid-cols-4 gap-1.5 sm:w-auto"
                >
                  {OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={pupil.status === option.value}
                      onClick={() => setStatus(pupil.id, option.value)}
                      className={cn(
                        "min-h-10 rounded-lg border px-2 text-xs font-bold transition-colors sm:px-3",
                        pupil.status === option.value ? option.active : "bg-card hover:bg-accent",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {pupil.status !== "present" ? (
                <div className="mt-3">
                  <label htmlFor={`note-${pupil.id}`} className="sr-only">
                    Note for {pupil.name}
                  </label>
                  <Input
                    id={`note-${pupil.id}`}
                    name={`note-${pupil.id}`}
                    defaultValue={pupil.note}
                    placeholder="Add a note (optional) — for example, medical appointment"
                    className="h-10"
                  />
                </div>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>

      <SaveButton />

      <p className="text-xs text-muted-foreground">
        Marking a pupil absent sends an attendance notice to their parents immediately.
      </p>
    </form>
  );
}
