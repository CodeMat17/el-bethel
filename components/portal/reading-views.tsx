"use client";

import * as React from "react";
import type { FunctionReturnType } from "convex/server";
import { BookmarkPlusIcon, BookOpenIcon, FlameIcon, HeadphonesIcon, NotebookPenIcon, PlayCircleIcon, TrashIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { CheckField, Hidden, SelectField, TextField, TextareaField } from "@/components/admin/fields";
import { FormDialog } from "@/components/admin/form-dialog";
import { StatusPill } from "@/components/common";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import type { api } from "@/convex/_generated/api";
import { cancelReservation, logReading, openResource, removeReadingLog, reserveBook } from "@/lib/school/actions/premium";
import { formatDate } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export type Shelf = FunctionReturnType<typeof api.reading.shelf>;
type Resource = Shelf["resources"][number];

const KIND = {
  ebook: { label: "E-book", Icon: BookOpenIcon },
  audiobook: { label: "Audiobook", Icon: HeadphonesIcon },
  video: { label: "Read-along", Icon: PlayCircleIcon },
  article: { label: "Article", Icon: BookOpenIcon },
} as const;

/** Reading goal, minutes this week and streak. */
export function ReadingStats({ stats, pupil }: { stats: Shelf["stats"]; pupil?: boolean }) {
  const pct = Math.min(100, Math.round((stats.termMinutes / stats.termGoal) * 100));
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase">{pupil ? "My reading goal this term" : "Reading goal this term"}</p>
          <p className="mt-1 font-heading text-2xl font-extrabold tabular-nums">
            {stats.termMinutes} <span className="text-base text-muted-foreground">/ {stats.termGoal} minutes</span>
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <span>
            <span className="font-heading text-lg font-extrabold tabular-nums">{stats.weekMinutes}</span> min this week
          </span>
          <span>
            <span className="font-heading text-lg font-extrabold tabular-nums">{stats.booksFinished}</span> finished
          </span>
          <span className="inline-flex items-center gap-1">
            <FlameIcon className={cn("size-4", stats.streak > 0 ? "text-gold" : "text-muted-foreground")} />
            <span className="font-heading text-lg font-extrabold tabular-nums">{stats.streak}</span>-day streak
          </span>
        </div>
      </div>
      <Progress value={pct} className="mt-4 h-2.5" aria-label={`Reading goal ${pct}% done`} />
    </div>
  );
}

function OpenButton({ resource }: { resource: Resource }) {
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      size="sm"
      className="font-bold"
      disabled={pending}
      onClick={() => {
        // Open the tab synchronously so pop-up blockers allow it, then point it at the title.
        const tab = window.open("about:blank", "_blank");
        startTransition(async () => {
          const res = await openResource(resource.id);
          if (!res.ok || !res.url) {
            tab?.close();
            toast.error(res.message ?? "That title couldn't be opened.");
            return;
          }
          if (tab) {
            tab.opener = null;
            tab.location.href = res.url;
          } else window.location.href = res.url;
        });
      }}
    >
      {pending ? <Spinner /> : null}
      {resource.kind === "video" ? "Watch" : resource.kind === "audiobook" ? "Listen" : "Read"}
    </Button>
  );
}

/** Digital titles matched to the pupil's class, with suggestions first. */
export function DigitalShelf({ shelf }: { shelf: Shelf }) {
  const suggested = new Set<string>(shelf.suggestions);
  const ordered = [...shelf.resources].sort((a, b) => Number(suggested.has(b.id)) - Number(suggested.has(a.id)));
  if (ordered.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">No digital titles for this class yet.</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {ordered.map((r) => {
        const { label, Icon } = KIND[r.kind];
        return (
          <li key={r.id} className="flex flex-col rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-foreground dark:text-gold">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  {r.author} · {label}
                  {r.minutes ? ` · ${r.minutes} min` : ""}
                </p>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 flex-1 text-xs text-muted-foreground">{r.description}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              {suggested.has(r.id) ? <StatusPill tone="gold">Suggested</StatusPill> : <span className="text-xs text-muted-foreground">{r.category}</span>}
              <OpenButton resource={r} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** "Log reading" dialog. Titles from the digital shelf and library catalogue, or anything else read at home. */
export function LogReadingDialog({
  studentId,
  resources,
  books,
  label = "Log reading",
}: {
  studentId: string;
  resources: { id: string; title: string }[];
  books: { id: string; title: string }[];
  label?: string;
}) {
  const [pick, setPick] = React.useState("other");
  const [today] = React.useState(() => new Date().toISOString().slice(0, 10));
  return (
    <FormDialog
      trigger={
        <Button size="lg" className="font-bold">
          <NotebookPenIcon />
          {label}
        </Button>
      }
      title="Add to the reading diary"
      action={logReading}
      submitLabel="Add entry"
    >
      <Hidden name="studentId" value={studentId} />
      <SelectField
        name="pick"
        label="What was read?"
        defaultValue="other"
        onValueChange={setPick}
        options={[
          { value: "other", label: "Something else (type the title)" },
          ...resources.map((r) => ({ value: `r:${r.id}`, label: `Digital: ${r.title}` })),
          ...books.map((b) => ({ value: `b:${b.id}`, label: `Library: ${b.title}` })),
        ]}
      />
      {pick === "other" ? <TextField name="title" label="Title" required maxLength={160} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="minutes" type="number" min={1} max={300} label="Minutes" defaultValue={20} required />
        <TextField name="date" type="date" label="Day" defaultValue={today} max={today} required />
      </div>
      <CheckField name="finished" label="Finished the book" />
      <TextareaField name="note" label="Note (optional)" rows={2} maxLength={300} placeholder="Favourite part, new words…" />
    </FormDialog>
  );
}

/** The diary. Entries can be removed by whoever added them. */
export function ReadingDiary({ logs, viewerId }: { logs: Shelf["logs"]; viewerId: string }) {
  if (logs.length === 0) return <p className="py-4 text-center text-sm text-muted-foreground">No reading logged yet.</p>;
  return (
    <ul className="space-y-2">
      {logs.map((l) => (
        <li key={l.id} className="flex items-start justify-between gap-3 rounded-xl border bg-card p-3 text-sm">
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {l.title}
              {l.finished ? <StatusPill tone="success" className="ml-2">Finished</StatusPill> : null}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(l.date)} · {l.minutes} min{l.note ? ` · ${l.note}` : ""}
            </p>
          </div>
          {l.loggedBy === viewerId ? (
            <ConfirmAction action={removeReadingLog.bind(null, l.id)} variant="ghost" size="icon-sm" className="text-muted-foreground" icon={<TrashIcon />} pendingText="">
              <span className="sr-only">Remove entry</span>
            </ConfirmAction>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function Holds({ holds }: { holds: Shelf["holds"] }) {
  if (holds.length === 0) return null;
  return (
    <ul className="space-y-2">
      {holds.map((h) => (
        <li key={h.id} className={cn("flex items-center justify-between gap-3 rounded-xl border p-3 text-sm", h.status === "ready" && "border-success/40 bg-success/8")}>
          <div className="min-w-0">
            <p className="truncate font-semibold">{h.title}</p>
            <p className="text-xs text-muted-foreground">
              {h.status === "ready" ? "Waiting for you at the library desk" : `Number ${h.position} in the queue`}
            </p>
          </div>
          <ConfirmAction action={cancelReservation.bind(null, h.id)} variant="ghost" icon={<XIcon />} pendingText="Cancelling…">
            Cancel
          </ConfirmAction>
        </li>
      ))}
    </ul>
  );
}

export function ReserveButton({ bookId, studentId }: { bookId: string; studentId: string }) {
  return (
    <ConfirmAction action={reserveBook.bind(null, bookId, studentId)} icon={<BookmarkPlusIcon />} pendingText="Reserving…" className="h-7 font-bold">
      Reserve
    </ConfirmAction>
  );
}
