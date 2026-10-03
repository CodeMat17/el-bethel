import type { Metadata } from "next";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { BarChart } from "@/components/portal/charts";
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
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";
import { pageParam, param } from "@/lib/school/data";
import { compactMoney, formatDateTime, money } from "@/lib/school/format";

export const metadata: Metadata = { title: "Payments" };

const PROVIDER_LABEL: Record<string, string> = {
  bank_transfer: "Bank transfer",
  cash: "Cash / POS",
};

export default async function AdminPaymentsPage({ searchParams }: PageProps<"/portal/admin/payments">) {
  await requireAdmin();
  const params = await searchParams;

  const q = param(params.q).trim();
  const provider = param(params.provider, "all");
  const page = pageParam(params.page);

  const result = await query(api.fees.listPayments, { search: q, provider, page, pageSize: 12 });
  const total = result.totals.amount;
  const byProvider = result.totals.byProvider.filter((row) => row.provider in PROVIDER_LABEL || row.amount > 0).map((row) => ({
    label: PROVIDER_LABEL[row.provider] ?? row.provider,
    value: Math.round(row.amount / 1000),
    hint: money(row.amount),
  }));

  return (
    <>
      <PortalPageHeader
        title="Payments"
        description="Every fee payment recorded by the bursary, with its method, reference and receipt number."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total received" value={compactMoney(total)} icon="Banknote" tone="success" />
        <StatCard label="Payments recorded" value={result.totals.count} icon="CreditCard" tone="info" />
        <StatCard
          label="Verified"
          value={result.totals.verified}
          icon="ShieldCheck"
          tone="success"
        />
        <StatCard label="Matching filter" value={result.total} icon="Search" tone="neutral" />
      </div>

      <Card className="mb-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Received by payment method</h2>
        <p className="mt-1 text-sm text-muted-foreground">Thousands of naira.</p>
        <Separator className="my-5" />
        <BarChart data={byProvider} unit="k" />
      </Card>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by reference, receipt number or pupil"
          filters={[
            {
              key: "provider",
              label: "Methods",
              options: Object.entries(PROVIDER_LABEL).map(([value, label]) => ({ value, label })),
            },
          ]}
        />
      </Card>

      {result.items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="CreditCard"
          title="No payments match your filters"
          description="Try a different reference, receipt number or method."
        />
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Pupil</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((payment) => {
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs font-bold">{payment.receiptNo}</TableCell>
                      <TableCell className="font-bold">{payment.studentName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {PROVIDER_LABEL[payment.provider] ?? payment.provider}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{payment.reference}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(payment.paidAt)}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">{money(payment.amount)}</TableCell>
                      <TableCell className="text-right">
                        <StatusPill tone={payment.status === "successful" ? "success" : "warning"}>
                          {payment.status}
                        </StatusPill>
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
            basePath="/portal/admin/payments"
            params={{ q, provider }}
          />
        </>
      )}

      <Card className="mt-6 gap-0 border-info/30 bg-info/10 p-5">
        <p className="text-sm leading-relaxed">
          <span className="font-extrabold">Offline payments · </span>
          The school does not take payments online. Families pay at the bursary or by bank transfer, and a
          payment only appears here once a member of the finance team records it against an invoice.
        </p>
      </Card>
    </>
  );
}
