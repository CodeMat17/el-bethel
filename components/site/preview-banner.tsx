"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { exitCmsPreview } from "@/lib/school/actions/cms";

/** Shown across the website while an editor is previewing unpublished changes. */
export function PreviewBanner() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="bg-gold text-gold-foreground">
      <div className="eb-container flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1 py-1.5 text-sm">
        <p className="flex items-center gap-2 font-bold">
          <EyeIcon className="size-4 shrink-0" />
          Preview: you are seeing unpublished drafts. Visitors still see the live site.
        </p>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" className="font-bold hover:bg-gold-foreground/10" render={<Link href="/portal/site" />}>
            Back to editor
          </Button>
          <Button
            size="sm"
            className="bg-gold-foreground font-bold text-gold hover:bg-gold-foreground/85"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await exitCmsPreview();
                router.refresh();
              })
            }
          >
            {pending ? <Spinner /> : <XIcon />}
            Exit preview
          </Button>
        </div>
      </div>
    </div>
  );
}
