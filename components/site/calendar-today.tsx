"use client";

import { useToday } from "@/components/site/dated";
import type { CalendarBlock } from "@/lib/school/calendar";
import { formatLongDate } from "@/lib/school/format";

/** "Today — First Term is in progress." Worked out in the browser, since the calendar page is static. */
export function CalendarToday({ asOf, blocks }: { asOf: string; blocks: CalendarBlock[] }) {
  const today = useToday(asOf);
  const current = blocks.find((b) => b.start.slice(0, 10) <= today && today <= b.end.slice(0, 10));
  return (
    <>
      {formatLongDate(today)}
      {current
        ? current.type === "term"
          ? ` — ${current.name} is in progress.`
          : ` — the school is closed for the ${current.name}.`
        : "."}
    </>
  );
}
