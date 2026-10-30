"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { EyeOffIcon, SendIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import { StatusPill } from "@/components/common";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { publishMidtermResults, unpublishMidtermResults } from "@/lib/school/actions/teaching";

export interface MidtermSummaryRow {
  studentId: string;
  name: string;
  studentNo: string;
  subjects: number;
  average: number;
  position: number;
}

/** Class teacher's view of a class's mid-term results, with the publish button. */
export function PublishMidterm({
  classId,
  termId,
  className,
  termName,
  totalSubjects,
  rows,
  published,
  canPublish,
  canUnpublish,
}: {
  classId: string;
  termId: string;
  className: string;
  termName: string;
  totalSubjects: number;
  rows: MidtermSummaryRow[];
  published: boolean;
  canPublish: boolean;
  canUnpublish: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<null | "publish" | "unpublish">(null);
  const [open, setOpen] = React.useState(false);

  const incomplete = rows.filter((r) => r.subjects < totalSubjects).length;
  const withScores = rows.filter((r) => r.subjects > 0).length;

  async function publish() {
    setPending("publish");
    try {
      const res = await publishMidtermResults({ classId, termId });
      if (!res.ok) {
        toast.error("Not published", { description: res.message });
        return;
      }
      toast.success("Mid-term results published", { description: res.message });
      setOpen(false);
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  async function unpublish() {
    setPending("unpublish");
    try {
      const res = await unpublishMidtermResults({ classId, termId });
      if (!res.ok) toast.error("Couldn't withdraw", { description: res.message });
      else {
        toast.success(res.message ?? "Withdrawn");
        router.refresh();
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-5">
      {incomplete > 0 ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-semibold">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {incomplete} {incomplete === 1 ? "pupil has" : "pupils have"} fewer than {totalSubjects} mid-term scores. Check with
          subject teachers before publishing.
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-lg text-sm">
          <caption className="sr-only">Mid-term summary for {className}</caption>
          <thead className="bg-muted/70">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-extrabold uppercase">Pos.</th>
              <th className="px-3 py-3 text-left text-xs font-extrabold uppercase">Pupil</th>
              <th className="px-3 py-3 text-center text-xs font-extrabold uppercase">Subjects</th>
              <th className="px-3 py-3 text-center text-xs font-extrabold uppercase">Average</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.studentId} className="border-t">
                <td className="px-3 py-2 font-extrabold tabular-nums">{r.subjects ? r.position : "—"}</td>
                <td className="px-3 py-2">
                  <span className="block font-bold">{r.name}</span>
                  <span className="block text-xs text-muted-foreground">{r.studentNo}</span>
                </td>
                <td className="px-3 py-2 text-center tabular-nums">
                  {r.subjects}/{totalSubjects}
                </td>
                <td className="px-3 py-2 text-center font-bold tabular-nums">{r.subjects ? `${r.average}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusPill tone={published ? "success" : "neutral"}>{published ? "Published" : "Not published"}</StatusPill>
        {canPublish ? (
          <AlertDialog open={open} onOpenChange={(next) => pending === null && setOpen(next)}>
            <AlertDialogTrigger render={<Button size="lg" className="font-bold" disabled={pending !== null || withScores === 0} />}>
              <SendIcon />
              {published ? "Re-publish with changes" : "Publish mid-term results"}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Publish {termName} mid-term results for {className}?</AlertDialogTitle>
                <AlertDialogDescription>
                  {withScores} pupils and their parents will be able to see their mid-term scores straight away
                  {published ? "" : ", and they will be notified"}. Subject teachers can no longer change mid-term scores
                  after publishing.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending !== null}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={publish} disabled={pending !== null} className="font-bold">
                  {pending === "publish" ? <Spinner /> : <SendIcon />}
                  {pending === "publish" ? "Publishing…" : "Publish"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <p className="text-sm text-muted-foreground">Only the class teacher or an administrator can publish these results.</p>
        )}
        {published && canUnpublish ? (
          <Button variant="outline" size="lg" className="font-bold" disabled={pending !== null} onClick={unpublish}>
            {pending === "unpublish" ? <Spinner /> : <EyeOffIcon />}
            {pending === "unpublish" ? "Withdrawing…" : "Withdraw"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
