"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const SiteSearchDialog = dynamic(() => import("@/components/site/site-search-dialog"), { ssr: false });

/** Opens the website search (also on Ctrl/⌘ K). The dialog's code loads on first open. */
export function SiteSearch({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [used, setUsed] = React.useState(false);

  const show = React.useCallback((next: boolean) => {
    if (next) setUsed(true);
    setOpen(next);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setUsed(true);
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <span onClick={() => show(true)}>{children}</span>
      {used ? <SiteSearchDialog open={open} setOpen={show} /> : null}
    </>
  );
}
