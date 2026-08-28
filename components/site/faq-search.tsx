"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FaqItem } from "@/lib/school/types";

export function FaqSearch({ faqs }: { faqs: FaqItem[] }) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");

  const categories = React.useMemo(
    () => ["all", ...Array.from(new Set(faqs.map((f) => f.category)))],
    [faqs],
  );

  const filtered = faqs.filter((faq) => {
    if (category !== "all" && faq.category !== category) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${faq.question} ${faq.answer}`.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions and answers"
            aria-label="Search frequently asked questions"
            className="h-11 pl-9"
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(String(v))}>
          <SelectTrigger className="h-11 w-full sm:w-56" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        Showing <span className="font-bold text-foreground">{filtered.length}</span> of {faqs.length} questions
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon="Search"
          title="We couldn't find anything matching your search"
          description="Try a different word, or clear the category filter. You can also contact the school office directly."
        />
      ) : (
        <Accordion className="mt-6 w-full rounded-2xl border bg-card px-4">
          {filtered.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="py-5 text-left font-heading text-base font-extrabold">
                <span>
                  {faq.question}
                  <span className="mt-1 block text-[0.65rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                    {faq.category}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
