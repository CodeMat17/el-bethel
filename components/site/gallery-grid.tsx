"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import { ToneImage } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/school/format";
import type { GalleryItem } from "@/lib/school/types";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [category, setCategory] = React.useState("All");
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const categories = React.useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category)))],
    [items],
  );

  const filtered = category === "All" ? items : items.filter((i) => i.category === category);
  const active = openIndex === null ? null : filtered[openIndex] ?? null;

  const move = React.useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null) return current;
        const next = (current + delta + filtered.length) % filtered.length;
        return next;
      });
    },
    [filtered.length],
  );

  React.useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, move]);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter gallery by category">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCategory(c);
              setOpenIndex(null);
            }}
            aria-pressed={category === c}
            className={cn(
              "min-h-9 rounded-full border px-4 text-xs font-bold transition-colors",
              category === c
                ? "border-gold bg-gold text-gold-foreground"
                : "bg-card hover:border-gold/50 hover:bg-accent",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon="Images"
          title="Nothing here yet"
          description="There are no photographs in this category at the moment. Try another one."
        />
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                className="group block w-full overflow-hidden rounded-2xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label={`Open ${item.title}`}
              >
                <div className="relative">
                  <ToneImage
                    tone={item.tone}
                    seed={item.id}
                    media={item.media}
                    label={item.title}
                    className="aspect-square transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-navy/90 to-transparent p-3 pt-10">
                    <p className="line-clamp-2 text-xs font-bold text-navy-foreground">{item.title}</p>
                    <p className="mt-0.5 text-[0.65rem] text-navy-foreground/70">{item.category}</p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={active !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="max-w-3xl overflow-hidden p-0" showCloseButton={false}>
          {active ? (
            <>
              <DialogTitle className="sr-only">{active.title}</DialogTitle>
              <div className="relative">
                <ToneImage tone={active.tone} seed={active.id} media={active.media} label={active.title} className="aspect-4/3 w-full" />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close"
                  className="absolute top-3 right-3 bg-background/80 backdrop-blur"
                  onClick={() => setOpenIndex(null)}
                >
                  <XIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Previous image"
                  className="absolute top-1/2 left-3 -translate-y-1/2 bg-background/80 backdrop-blur"
                  onClick={() => move(-1)}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Next image"
                  className="absolute top-1/2 right-3 -translate-y-1/2 bg-background/80 backdrop-blur"
                  onClick={() => move(1)}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
              <div className="p-5">
                <p className="font-heading text-base font-extrabold">{active.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {active.category} · {formatDate(active.takenAt)}
                </p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
