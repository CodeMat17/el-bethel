"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterDefinition {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

/**
 * Search and filter toolbar for admin lists. State lives in the URL so a filtered
 * view is shareable, bookmarkable and survives a refresh — and so filtering stays
 * a server concern.
 */
export function AdminFilters({
  searchPlaceholder = "Search…",
  filters = [],
}: {
  searchPlaceholder?: string;
  filters?: FilterDefinition[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [term, setTerm] = React.useState(searchParams.get("q") ?? "");

  const push = React.useCallback(
    (next: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (!value || value === "all") params.delete(key);
        else params.set(key, value);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  React.useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (term === current) return;
    const timer = window.setTimeout(() => push({ q: term }), 300);
    return () => window.clearTimeout(timer);
  }, [term, push, searchParams]);

  const hasFilters =
    Boolean(searchParams.get("q")) || filters.some((f) => searchParams.get(f.key));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-11 pl-9"
        />
      </div>

      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={searchParams.get(filter.key) ?? "all"}
          onValueChange={(value) => push({ [filter.key]: String(value) })}
        >
          <SelectTrigger className="h-11 w-full sm:w-48" aria-label={filter.label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {filter.label.toLowerCase()}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {hasFilters ? (
        <Button
          variant="ghost"
          size="lg"
          className="h-11 font-bold"
          onClick={() => {
            setTerm("");
            router.push(pathname);
          }}
        >
          <XIcon />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
