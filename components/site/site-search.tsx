"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarDaysIcon, FileTextIcon, HelpCircleIcon, NewspaperIcon, UserRoundIcon } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";

interface SearchResult {
  group: string;
  label: string;
  sub: string;
  href: string;
}

export function SiteSearch({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((data: { results: SearchResult[] }) => setResults(data.results ?? []))
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  // Derived: a query shorter than two characters shows nothing, without clearing state.
  const visible = query.trim().length < 2 ? [] : results;
  const grouped = visible.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.group] ??= []).push(r);
    return acc;
  }, {});

  const groupIcon: Record<string, React.ReactNode> = {
    News: <NewspaperIcon className="size-4" />,
    Events: <CalendarDaysIcon className="size-4" />,
    Staff: <UserRoundIcon className="size-4" />,
    "Questions & Answers": <HelpCircleIcon className="size-4" />,
    Documents: <FileTextIcon className="size-4" />,
  };

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search El-Bethel International Academy"
        description="Search news, events, staff, documents and answers."
      >
        <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search news, events, staff, documents…"
        />
        <CommandList>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Spinner className="size-4" /> Searching…
            </div>
          ) : null}
          {!loading && query.trim().length < 2 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Type at least two characters to search the website.
            </div>
          ) : null}
          {!loading && query.trim().length >= 2 && visible.length === 0 ? (
            <CommandEmpty>We couldn&apos;t find anything matching your search.</CommandEmpty>
          ) : null}
          {Object.entries(grouped).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => (
                <CommandItem key={item.href + item.label} value={item.href} onSelect={() => go(item.href)}>
                  {groupIcon[group] ?? null}
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">{item.label}</span>
                    <span className="truncate text-xs text-muted-foreground">{item.sub}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
