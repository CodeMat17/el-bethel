import type { ApplicationStatus, AssignmentProgress, InvoiceStatus } from "./types";

const NAIRA = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export const money = (amount: number): string => NAIRA.format(amount);

export const compactMoney = (amount: number): string =>
  amount >= 1_000_000
    ? `₦${(amount / 1_000_000).toFixed(1)}M`
    : amount >= 1_000
      ? `₦${Math.round(amount / 1_000)}k`
      : `₦${amount}`;

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const LONG_DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

export const formatDate = (value: string | Date): string => DATE_FMT.format(new Date(value));
export const formatLongDate = (value: string | Date): string => LONG_DATE_FMT.format(new Date(value));
/** Today as YYYY-MM-DD (UTC): the day a static page is rendered, for `components/site/dated`. */
export const todayISO = (): string => new Date().toISOString().slice(0, 10);
/** An event's last day as YYYY-MM-DD. */
export const eventEnd = (event: { date: string; endDate?: string }): string => (event.endDate ?? event.date).slice(0, 10);
export const formatTime =(value: string | Date): string => TIME_FMT.format(new Date(value));
export const formatDateTime = (value: string | Date): string =>
  `${DATE_FMT.format(new Date(value))} · ${TIME_FMT.format(new Date(value))}`;

/** Human relative time, e.g. "2 days ago". */
export function relativeTime(value: string | Date, reference: Date = new Date()): string {
  const diffMs = new Date(value).getTime() - reference.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const abs = Math.abs(diffMin);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return rtf.format(diffMin, "minute");
  if (abs < 60 * 24) return rtf.format(Math.round(diffMin / 60), "hour");
  if (abs < 60 * 24 * 30) return rtf.format(Math.round(diffMin / (60 * 24)), "day");
  return rtf.format(Math.round(diffMin / (60 * 24 * 30)), "month");
}

export const initials = (...parts: string[]): string =>
  parts
    .filter(Boolean)
    .map((p) => p.trim()[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

export const fileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const percent = (value: number, total: number): number =>
  total === 0 ? 0 : Math.round((value / total) * 100);

/* ------------------------------- status maps ------------------------------ */

export type ToneName = "neutral" | "success" | "warning" | "danger" | "info" | "gold";

export const SUBMISSION_STATUS: Record<AssignmentProgress, { label: string; tone: ToneName }> = {
  not_started: { label: "To do", tone: "neutral" },
  missed: { label: "Missed", tone: "danger" },
  submitted: { label: "Awaiting marking", tone: "info" },
  graded: { label: "Marked", tone: "success" },
};

export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; tone: ToneName }> = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "info" },
  under_review: { label: "Under review", tone: "info" },
  documents_required: { label: "Documents required", tone: "warning" },
  assessment_scheduled: { label: "Assessment scheduled", tone: "gold" },
  assessment_completed: { label: "Assessment completed", tone: "info" },
  interview_scheduled: { label: "Interview scheduled", tone: "gold" },
  accepted: { label: "Accepted", tone: "success" },
  conditionally_accepted: { label: "Conditionally accepted", tone: "success" },
  waitlisted: { label: "Waitlisted", tone: "warning" },
  not_accepted: { label: "Not accepted", tone: "danger" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
  enrolled: { label: "Enrolled", tone: "success" },
};

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: ToneName }> = {
  draft: { label: "Draft", tone: "neutral" },
  issued: { label: "Issued", tone: "info" },
  part_paid: { label: "Part paid", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  overdue: { label: "Overdue", tone: "danger" },
  void: { label: "Void", tone: "neutral" },
};

/** Deterministic avatar background derived from a seed — no external requests. */
export function avatarTone(seed: string): string {
  const tones = [
    "bg-navy text-navy-foreground",
    "bg-gold text-gold-foreground",
    "bg-info text-info-foreground",
    "bg-success text-success-foreground",
    "bg-primary text-primary-foreground",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return tones[hash % tones.length];
}

/** Colour tone for a letter grade. Shared by server and client components. */
export function gradeTone(grade: string): ToneName {
  if (grade === "A") return "success";
  if (grade === "B") return "info";
  if (grade === "C") return "gold";
  if (grade === "D") return "warning";
  return "danger";
}
