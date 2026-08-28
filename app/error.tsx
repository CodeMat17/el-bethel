"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";

import { Brand } from "@/components/site/brand";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // In production this is where the error would be forwarded to monitoring.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <Brand className="mb-10" />
      <span className="grid size-16 place-items-center rounded-3xl bg-destructive/10 text-destructive ring-1 ring-destructive/25">
        <TriangleAlertIcon className="size-7" />
      </span>
      <h1 className="mt-6 max-w-xl text-balance font-heading text-2xl sm:text-3xl">
        Something went wrong on our side
      </h1>
      <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
        We couldn&apos;t load this page right now. Please try again — if it keeps happening, contact
        the school office and we will look into it.
      </p>
      {error.digest ? (
        <p className="mt-4 rounded-lg bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="h-11 font-bold" onClick={reset}>
          <RefreshCwIcon />
          Try again
        </Button>
        <Button size="lg" variant="outline" className="h-11 font-bold" render={<Link href="/" />}>
          Back to homepage
        </Button>
      </div>
    </div>
  );
}
