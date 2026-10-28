import * as React from "react";
import Link from "next/link";
import { CheckIcon } from "lucide-react";

import { StatusPill } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DAY_NAMES, DEFAULT_CA_MAX, GRADE_BANDS } from "@/lib/school/config";
import type { Directory } from "@/lib/school/directory";
import { formatDate, gradeTone, money } from "@/lib/school/format";
import type {
  Invoice,
  ResultEntry,
  TimetableSlot,
} from "@/lib/school/types";
import { cn } from "@/lib/utils";

/* -------------------------------- timetable ------------------------------- */

export function TimetableGrid({ slots, dir }: { slots: TimetableSlot[]; dir: Directory }) {
  const periods = Array.from(new Set(slots.map((s) => s.period))).sort((a, b) => a - b);
  const byKey = new Map(slots.map((s) => [`${s.day}-${s.period}`, s]));

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full min-w-3xl text-sm">
        <caption className="sr-only">Weekly class timetable</caption>
        <thead className="bg-muted/70">
          <tr>
            <th scope="col" className="w-28 px-3 py-3 text-left text-xs font-extrabold uppercase">Time</th>
            {[1, 2, 3, 4, 5].map((day) => (
              <th key={day} scope="col" className="px-3 py-3 text-left text-xs font-extrabold uppercase">
                {DAY_NAMES[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => {
            const sample = slots.find((s) => s.period === period);
            const isBreak = Boolean(sample?.label);
            return (
              <tr key={period} className={cn("border-t", isBreak && "bg-gold/8")}>
                <th scope="row" className="px-3 py-3 text-left text-xs font-bold tabular-nums text-muted-foreground">
                  {sample?.startTime}
                  <span className="block font-normal">{sample?.endTime}</span>
                </th>
                {[1, 2, 3, 4, 5].map((day) => {
                  const slot = byKey.get(`${day}-${period}`);
                  if (!slot) return <td key={day} className="px-3 py-3" />;
                  if (slot.label) {
                    return (
                      <td key={day} className="px-3 py-3 text-center text-xs font-extrabold tracking-wide text-gold-foreground uppercase dark:text-gold">
                        {slot.label}
                      </td>
                    );
                  }
                  return (
                    <td key={day} className="px-2 py-2">
                      <div className="rounded-lg border bg-background p-2.5">
                        <p className="truncate text-xs font-bold">{dir.subjectName(slot.subjectId)}</p>
                        <p className="mt-0.5 truncate text-[0.68rem] text-muted-foreground">
                          {dir.teacherName(slot.teacherId)}
                        </p>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* --------------------------------- results -------------------------------- */

export function ResultsTable({ results, dir }: { results: ResultEntry[]; dir: Directory }) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead className="text-right">CA</TableHead>
            <TableHead className="text-right">Exam</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Grade</TableHead>
            <TableHead>Remark</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => {
            const caMax = result.caMax ?? DEFAULT_CA_MAX;
            return (
            <TableRow key={result.id}>
              <TableCell className="font-bold">{dir.subjectName(result.subjectId)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {result.ca}
                <span className="text-xs text-muted-foreground"> / {caMax}</span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {result.exam}
                <span className="text-xs text-muted-foreground"> / {100 - caMax}</span>
              </TableCell>
              <TableCell className="text-right font-extrabold tabular-nums">{result.total}</TableCell>
              <TableCell className="text-right">
                <StatusPill tone={gradeTone(result.grade)} dot={false}>{result.grade}</StatusPill>
              </TableCell>
              <TableCell className="text-muted-foreground">{result.remark}</TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}


export function GradeKey() {
  return (
    <div className="flex flex-wrap gap-2">
      {GRADE_BANDS.map((band, i) => (
        <span key={band.grade} className="rounded-lg border bg-card px-3 py-1.5 text-xs font-bold">
          {band.grade} · {band.min}
          {i === 0 ? "–100" : `–${GRADE_BANDS[i - 1].min - 1}`}
          <span className="ml-1.5 font-normal text-muted-foreground">{band.remark}</span>
        </span>
      ))}
    </div>
  );
}

/* --------------------------------- finance -------------------------------- */

export function InvoiceCard({
  invoice,
  termName,
  action,
}: {
  invoice: Invoice;
  termName: string;
  action?: React.ReactNode;
}) {
  const balance = invoice.total - invoice.amountPaid;
  const paidPct = invoice.total === 0 ? 0 : Math.round((invoice.amountPaid / invoice.total) * 100);

  return (
    <Card className="gap-0 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-heading text-base font-extrabold">{invoice.invoiceNo}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {termName} · issued {formatDate(invoice.issuedAt)} · due {formatDate(invoice.dueDate)}
          </p>
        </div>
        <StatusPill tone={balance === 0 ? "success" : invoice.amountPaid > 0 ? "warning" : "danger"}>
          {balance === 0 ? "Paid" : invoice.amountPaid > 0 ? "Part paid" : "Outstanding"}
        </StatusPill>
      </div>

      <Separator className="my-5" />

      <ul className="space-y-2.5 text-sm">
        {invoice.lines.map((line) => (
          <li key={line.category} className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{line.label}</span>
            <span className="font-bold tabular-nums">{money(line.amount)}</span>
          </li>
        ))}
      </ul>

      <Separator className="my-5" />

      <dl className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="font-bold">Total</dt>
          <dd className="font-heading text-base font-extrabold tabular-nums">{money(invoice.total)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Paid to date</dt>
          <dd className="font-bold tabular-nums text-success">{money(invoice.amountPaid)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Balance</dt>
          <dd className={cn("font-bold tabular-nums", balance > 0 ? "text-destructive" : "text-success")}>
            {money(balance)}
          </dd>
        </div>
      </dl>

      <Progress value={paidPct} className="mt-5" />
      <p className="mt-2 text-xs text-muted-foreground">{paidPct}% of this invoice has been paid.</p>

      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}

/* -------------------------------- checklist ------------------------------- */

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
            <CheckIcon className="size-3" strokeWidth={3} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ simple linkrow ---------------------------- */

export function LinkRow({
  href,
  title,
  subtitle,
  right,
}: {
  href: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <Link href={href} className="block">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5 transition-colors hover:border-gold/40">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{title}</p>
          {subtitle ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </Link>
  );
}
