"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * A submit button that shows a spinner and disables itself while its form's
 * server action is running. Drop it inside any <form action={…}>.
 */
export function PendingButton({
  children,
  pendingText,
  icon,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "type"> & { pendingText?: string; icon?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} aria-busy={pending || undefined} {...props}>
      {pending ? <Spinner /> : icon}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}

/** Text-link styled variant for small inline actions. */
export function PendingLinkButton({ children, pendingText, className }: { children: React.ReactNode; pendingText?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending || undefined}>
      {pending ? (
        <span className="inline-flex items-center gap-1">
          <Spinner className="size-3" />
          {pendingText ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
