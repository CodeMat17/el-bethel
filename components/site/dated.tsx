"use client";

import * as React from "react";

/**
 * Website pages are static and only rebuilt when the dashboard changes their
 * data, so the server can't know what day it is when a visitor arrives. These
 * helpers render as of `asOf` (the day the page was built), then the browser
 * moves events that have since ended out of "upcoming" lists after hydration.
 */

/** Today as YYYY-MM-DD in UTC, the form event dates are stored in. */
const todayISO = () => new Date().toISOString().slice(0, 10);

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(timer);
}

/** Today's date in the visitor's browser; `asOf` on the server and first paint. */
export function useToday(asOf: string): string {
  return React.useSyncExternalStore(subscribe, todayISO, () => asOf);
}

const GroupContext = React.createContext<{ visible: ReadonlySet<number>; count: number }>({ visible: new Set(), count: 0 });

/**
 * A list of dated items, each shown by `<DatedItem index>` only while it is
 * upcoming (its end date is today or later) or, in "past" mode, once it has
 * ended. `limit` caps how many show, counting only the ones that qualify.
 */
export function DatedGroup({
  asOf,
  ends,
  mode = "upcoming",
  limit,
  children,
}: {
  asOf: string;
  /** Each item's last day (YYYY-MM-DD), in display order. */
  ends: string[];
  mode?: "upcoming" | "past";
  limit?: number;
  children: React.ReactNode;
}) {
  const today = useToday(asOf);
  const value = React.useMemo(() => {
    const matching = ends.flatMap((end, i) => ((end < today) === (mode === "past") ? [i] : []));
    return { visible: new Set(matching.slice(0, limit)), count: matching.length };
  }, [ends, today, mode, limit]);
  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

export function DatedItem({ index, children }: { index: number; children: React.ReactNode }) {
  return React.useContext(GroupContext).visible.has(index) ? children : null;
}

/** How many items in the group qualify (ignoring `limit`). */
export function DatedCount() {
  return React.useContext(GroupContext).count;
}

/** Children shown only when at least one item in the group qualifies. */
export function WhenDated({ children }: { children: React.ReactNode }) {
  return React.useContext(GroupContext).count > 0 ? children : null;
}

/** Children shown only when no item in the group qualifies. */
export function WhenNotDated({ children }: { children: React.ReactNode }) {
  return React.useContext(GroupContext).count === 0 ? children : null;
}

interface Span {
  asOf: string;
  start: string;
  end: string;
}

function useWithin({ asOf, start, end }: Span): boolean {
  const today = useToday(asOf);
  return start.slice(0, 10) <= today && today <= end.slice(0, 10);
}

/** Children shown only while today falls between `start` and `end` (inclusive). */
export function WhenToday({ children, ...span }: Span & { children: React.ReactNode }) {
  return useWithin(span) ? children : null;
}

/** A wrapper marked `data-today` while today falls between `start` and `end`, for `group-data-today/…` styles. */
export function TodayMark({ className, children, ...span }: Span & { className?: string; children: React.ReactNode }) {
  return (
    <div className={className} data-today={useWithin(span) ? "" : undefined}>
      {children}
    </div>
  );
}
