import type { AcademicSession, Term, TermKey } from "./types";

/** A teaching term or the break after it, as shown on the school calendar. */
export interface CalendarBlock {
  name: string;
  start: string;
  end: string;
  type: "term" | "break";
}

const BREAK_AFTER: Record<TermKey, string> = {
  first: "Christmas Break",
  second: "Easter Break",
  third: "Long Vacation",
};

function shiftDay(date: string, days: number): string {
  const d = new Date(`${date.slice(0, 10)}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The current session's terms and the breaks between them, built from the
 * sessions and terms administrators manage. Falls back to the latest session
 * when none is marked current. A break runs from the day after a term ends to
 * the day before the next term (or next session) starts.
 */
export function academicCalendar(
  sessions: AcademicSession[],
  terms: Term[],
): { session: AcademicSession | null; blocks: CalendarBlock[] } {
  const ordered = [...sessions].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const session = ordered.find((s) => s.active) ?? ordered[ordered.length - 1] ?? null;
  if (!session) return { session: null, blocks: [] };

  const nextSession = ordered.find((s) => s.startDate > session.startDate);
  const own = terms.filter((t) => t.sessionId === session.id).sort((a, b) => a.startDate.localeCompare(b.startDate));

  const blocks: CalendarBlock[] = [];
  own.forEach((term, i) => {
    blocks.push({ name: term.name, start: term.startDate, end: term.endDate, type: "term" });
    const resume = own[i + 1]?.startDate ?? nextSession?.startDate;
    const start = shiftDay(term.endDate, 1);
    const end = resume ? shiftDay(resume, -1) : session.endDate.slice(0, 10);
    if (start <= end) blocks.push({ name: BREAK_AFTER[term.key], start, end, type: "break" });
  });
  return { session, blocks };
}
