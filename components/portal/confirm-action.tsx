"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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

export interface ActionOutcome {
  ok: boolean;
  message?: string;
}

/**
 * A button that runs a bound server action, optionally after a confirmation
 * dialog, with a spinner while it runs and a toast with the result.
 */
export function ConfirmAction({
  action,
  children,
  icon,
  pendingText = "Working…",
  confirm,
  variant = "outline",
  size = "sm",
  className = "font-bold",
  destructive,
}: {
  action: () => Promise<ActionOutcome>;
  children: React.ReactNode;
  icon?: React.ReactNode;
  pendingText?: string;
  /** When set, ask before running. */
  confirm?: { title: string; description: string; confirmLabel?: string };
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  destructive?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);

  function run() {
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        toast.error("That didn't work", { description: res.message });
        return;
      }
      if (res.message) toast.success(res.message);
      setOpen(false);
      router.refresh();
    });
  }

  if (!confirm) {
    return (
      <Button type="button" variant={variant} size={size} className={className} disabled={pending} onClick={run}>
        {pending ? <Spinner /> : icon}
        {pending ? pendingText : children}
      </Button>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger render={<Button type="button" variant={variant} size={size} className={className} disabled={pending} />}>
        {pending ? <Spinner /> : icon}
        {pending ? pendingText : children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
          <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? "destructive" : "default"} onClick={run} disabled={pending} className="font-bold">
            {pending ? <Spinner /> : icon}
            {pending ? pendingText : confirm.confirmLabel ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
