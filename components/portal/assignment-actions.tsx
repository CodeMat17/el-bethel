"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArchiveIcon, LockIcon, PencilIcon, SendIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

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
import { deleteAssignment, setAssignmentStatus } from "@/lib/school/actions/assignments";

type Status = "draft" | "published" | "closed" | "archived";

export function AssignmentActions({
  assignmentId,
  status,
  hasSubmissions,
  dueInFuture,
}: {
  assignmentId: string;
  status: Status;
  hasSubmissions: boolean;
  dueInFuture: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function run(key: string, fn: () => Promise<{ ok: boolean; message?: string }>, after?: () => void) {
    setPending(key);
    try {
      const res = await fn();
      if (!res.ok) {
        toast.error("Couldn't update the assignment", { description: res.message });
        return;
      }
      toast.success(res.message ?? "Done");
      if (after) after();
      else router.refresh();
    } finally {
      setPending(null);
    }
  }

  const busy = pending !== null;

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" className="font-bold" disabled={busy} render={<Link href={`/portal/teacher/assignments/${assignmentId}/edit`} />}>
        <PencilIcon />
        Edit
      </Button>

      {status === "draft" || (status === "closed" && dueInFuture) ? (
        <Button className="font-bold" disabled={busy || !dueInFuture} onClick={() => run("publish", () => setAssignmentStatus(assignmentId, "published"))}>
          {pending === "publish" ? <Spinner /> : <SendIcon />}
          {pending === "publish" ? "Publishing…" : status === "draft" ? "Publish" : "Reopen"}
        </Button>
      ) : null}

      {status === "published" ? (
        <Button variant="outline" className="font-bold" disabled={busy} onClick={() => run("close", () => setAssignmentStatus(assignmentId, "closed"))}>
          {pending === "close" ? <Spinner /> : <LockIcon />}
          {pending === "close" ? "Closing…" : "Close now"}
        </Button>
      ) : null}

      {status !== "archived" && hasSubmissions ? (
        <Button variant="ghost" className="font-bold" disabled={busy} onClick={() => run("archive", () => setAssignmentStatus(assignmentId, "archived"))}>
          {pending === "archive" ? <Spinner /> : <ArchiveIcon />}
          {pending === "archive" ? "Archiving…" : "Archive"}
        </Button>
      ) : null}

      {!hasSubmissions ? (
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="ghost" className="font-bold text-destructive" disabled={busy} />}>
            {pending === "delete" ? <Spinner /> : <TrashIcon />}
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this assignment?</AlertDialogTitle>
              <AlertDialogDescription>This can&apos;t be undone. No pupil has submitted it yet.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={busy}
                onClick={() => run("delete", () => deleteAssignment(assignmentId), () => router.push("/portal/teacher/assignments"))}
              >
                {pending === "delete" ? <Spinner /> : <TrashIcon />}
                {pending === "delete" ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
