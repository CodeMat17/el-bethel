import Link from "next/link";
import type { Metadata } from "next";
import { PencilIcon } from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { BarChart, HeroFigure } from "@/components/portal/charts";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Button } from "@/components/ui/button";
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
import { getContent } from "@/lib/school/site-content";
import { RecordPaymentDialog } from "@/components/admin/office-dialogs";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";
import { pageParam, param } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { INVOICE_STATUS, compactMoney, formatDate, money } from "@/lib/school/format";

export const metadata: Metadata = { title: "Fees & invoices" };

export default async function AdminFeesPage({ searchParams }: PageProps<"/portal/admin/fees">) {
  await requireAdmin();
  const fees = await getContent("fees");
  const params = await searchParams;

  const q = param(params.q).trim();
  const status = param(params.status, "all");
  const page = pageParam(params.page);

  const [result, metricsAll, dir] = await Promise.all([
    query(api.fees.listInvoices, { search: q, status, page, pageSize: 12 }),
    query(api.dashboard.metrics, {}),
    getDirectory(),
  ]);
  const metrics = result.totals;
  const byLevel = metricsAll.outstandingByLevel.map((row) => ({
    label: row.label,
    value: Math.round(row.amount / 1000),
    hint: money(row.amount),
  }));

  return (
    <>
      <PortalPageHeader
        title="Fees & invoices"
        description="Billing, collection and balances. Record payments here once the bursary has confirmed them — parents then see them in their portal."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Billed this term" value={compactMoney(metrics.billed)} icon="Receipt" tone="neutral" />
        <StatCard label="Collected" value={compactMoney(metrics.collected)} icon="CircleCheck" tone="success" />
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
            detail={`${money(metrics.outstanding)} still outstanding · ${metrics.overdue} invoices overdue`}
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-extrabold">Fee structure</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The published fee table, as shown on the website and the application form.
            </p>
          </div>
          <Button variant="outline" size="sm" className="font-bold" render={<Link href="/portal/admin/fees/structure" />}>
            <PencilIcon />
            Edit fees
          </Button>
        </div>
        <Separator className="my-5" />
        <div className="grid gap-4 lg:grid-cols-3">
          {fees.bands.map((band) => {
            const total = band.lines.reduce((sum, l) => sum + l.amount, 0);
            return (
              <div key={band.band} className="rounded-xl border bg-card p-4">
                <p className="text-sm font-extrabold">{band.band}</p>
                <p className="mt-2 font-heading text-xl font-extrabold">{money(total)}</p>
                <ul className="mt-3 space-y-1.5 text-xs">
                  {band.lines.map((line, i) => (
                    <li key={`${line.label}-${i}`} className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{line.label}</span>
                      <span className="font-bold tabular-nums">{money(line.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {[
            { title: "Admission fees (one-off)", lines: fees.admissionFees },
            { title: "Optional services", lines: fees.optionalFees },
          ].map((group) => (
            <div key={group.title} className="rounded-xl border bg-card p-4">
              <p className="text-sm font-extrabold">{group.title}</p>
              {group.lines.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">None.</p>
              ) : (
                <ul className="mt-3 space-y-1.5 text-xs">
                  {group.lines.map((line, i) => (
                    <li key={`${line.label}-${i}`} className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{line.label}</span>
                      <span className="font-bold tabular-nums">{money(line.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
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
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((invoice) => {
                  const balance = invoice.total - invoice.amountPaid;
                  const meta = INVOICE_STATUS[invoice.status];
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-xs font-bold">{invoice.invoiceNo}</TableCell>
                      <TableCell className="font-bold">{invoice.studentName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {dir.className(invoice.classId)}
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
                      <TableCell className="text-right">
                        {balance > 0 ? (
                          <RecordPaymentDialog invoiceId={invoice.id} invoiceNo={invoice.invoiceNo} balance={balance} studentName={invoice.studentName} />
                        ) : null}
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
