import type { Metadata } from "next";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { BarChart, HeroFigure } from "@/components/portal/charts";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/school/auth";
import { CLASS_LEVELS, FEE_STRUCTURE } from "@/lib/school/config";
import { classDisplayName, getAdminMetrics, getStudent, paginate, studentName } from "@/lib/school/data";
import { INVOICE_STATUS, compactMoney, formatDate, money } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";

export const metadata: Metadata = { title: "Fees & invoices" };

export default async function AdminFeesPage({ searchParams }: PageProps<"/portal/admin/fees">) {
  await requireAdmin();
  const params = await searchParams;

  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const status = typeof params.status === "string" ? params.status : "all";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const db = getDb();
  const metrics = getAdminMetrics();

  const filtered = db.invoices
    .filter((invoice) => {
      if (status !== "all" && invoice.status !== status) return false;
      if (!q) return true;
      const student = getStudent(invoice.studentId);
      return (
        invoice.invoiceNo.toLowerCase().includes(q) ||
        (student ? studentName(student).toLowerCase().includes(q) : false)
      );
    })
    .sort((a, b) => b.total - b.amountPaid - (a.total - a.amountPaid));

  const result = paginate(filtered, page, 12);

  const byLevel = CLASS_LEVELS.map((level) => {
    const classIds = db.classes.filter((c) => c.levelId === level.id).map((c) => c.id);
    const outstanding = db.invoices
      .filter((i) => {
        const student = getStudent(i.studentId);
        return student ? classIds.includes(student.classId) : false;
      })
      .reduce((sum, i) => sum + (i.total - i.amountPaid), 0);
    return { label: level.name, value: Math.round(outstanding / 1000), hint: money(outstanding) };
  });

  return (
    <>
      <PortalPageHeader
        title="Fees & invoices"
        description="Termly billing, collection rate and outstanding balances across the school."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Billed this term" value={compactMoney(metrics.feesBilled)} icon="Receipt" tone="neutral" />
        <StatCard label="Collected" value={compactMoney(metrics.feesCollected)} icon="CircleCheck" tone="success" />
        <StatCard label="Outstanding" value={compactMoney(metrics.outstanding)} icon="Wallet" tone={metrics.outstanding > 0 ? "warning" : "success"} />
        <StatCard label="Collection rate" value={`${metrics.collectionRate}%`} icon="TrendingUp" tone={metrics.collectionRate >= 80 ? "success" : "warning"} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Collection</h2>
          <Separator className="my-5" />
          <HeroFigure
            value={`${metrics.collectionRate}%`}
            label="of billed fees collected this term"
            progress={metrics.collectionRate}
            detail={`${money(metrics.outstanding)} still outstanding across ${db.invoices.filter((i) => i.total > i.amountPaid).length} invoices`}
          />
        </Card>

        <Card className="gap-0 p-5 sm:p-6 lg:col-span-2">
          <h2 className="font-heading text-base font-extrabold">Outstanding balance by class level</h2>
          <p className="mt-1 text-sm text-muted-foreground">Thousands of naira.</p>
          <Separator className="my-5" />
          <BarChart data={byLevel} unit="k" />
        </Card>
      </div>

      <Card className="mb-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Fee structure</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configurable per session, term, class band and fee category.
        </p>
        <Separator className="my-5" />
        <div className="grid gap-4 lg:grid-cols-3">
          {FEE_STRUCTURE.map((band) => {
            const total = band.lines.reduce((sum, l) => sum + l.amount, 0);
            return (
              <div key={band.band} className="rounded-xl border bg-card p-4">
                <p className="text-sm font-extrabold">{band.band}</p>
                <p className="mt-2 font-heading text-xl font-extrabold">{money(total)}</p>
                <ul className="mt-3 space-y-1.5 text-xs">
                  {band.lines.map((line) => (
                    <li key={line.category} className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{line.label}</span>
                      <span className="font-bold tabular-nums">{money(line.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by invoice number or pupil name"
          filters={[
            {
              key: "status",
              label: "Statuses",
              options: Object.entries(INVOICE_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
            },
          ]}
        />
      </Card>

      {result.items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="Receipt"
          title="No invoices match your filters"
          description="Try a different invoice number, pupil name or status."
        />
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Pupil</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((invoice) => {
                  const student = getStudent(invoice.studentId);
                  const balance = invoice.total - invoice.amountPaid;
                  const meta = INVOICE_STATUS[invoice.status];
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-xs font-bold">{invoice.invoiceNo}</TableCell>
                      <TableCell className="font-bold">{student ? studentName(student) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {student ? classDisplayName(student.classId) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{money(invoice.total)}</TableCell>
                      <TableCell className="text-right tabular-nums text-success">{money(invoice.amountPaid)}</TableCell>
                      <TableCell className={`text-right font-bold tabular-nums ${balance > 0 ? "text-destructive" : ""}`}>
                        {money(balance)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <Pager
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={result.pageSize}
            basePath="/portal/admin/fees"
            params={{ q, status }}
          />
        </>
      )}
    </>
  );
}
