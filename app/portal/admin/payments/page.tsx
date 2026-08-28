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
import { classDisplayName, getStudent, paginate, studentName } from "@/lib/school/data";
import { compactMoney, formatDateTime, money } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";

export const metadata: Metadata = { title: "Payments" };

const PROVIDER_LABEL: Record<string, string> = {
  paystack: "Paystack",
  flutterwave: "Flutterwave",
  bank_transfer: "Bank transfer",
  cash: "Cash",
};

export default async function AdminPaymentsPage({ searchParams }: PageProps<"/portal/admin/payments">) {
  await requireAdmin();
  const params = await searchParams;

  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const provider = typeof params.provider === "string" ? params.provider : "all";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const db = getDb();
  const filtered = db.payments
    .filter((payment) => {
      if (provider !== "all" && payment.provider !== provider) return false;
      if (!q) return true;
      const student = getStudent(payment.studentId);
      return (
        payment.reference.toLowerCase().includes(q) ||
        payment.receiptNo.toLowerCase().includes(q) ||
        (student ? studentName(student).toLowerCase().includes(q) : false)
      );
    })
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  const result = paginate(filtered, page, 12);
  const total = db.payments.reduce((sum, p) => sum + (p.status === "successful" ? p.amount : 0), 0);

  const byProvider = Object.keys(PROVIDER_LABEL).map((key) => ({
    label: PROVIDER_LABEL[key],
    value: Math.round(
      db.payments.filter((p) => p.provider === key).reduce((sum, p) => sum + p.amount, 0) / 1000,
    ),
    hint: money(db.payments.filter((p) => p.provider === key).reduce((sum, p) => sum + p.amount, 0)),
  }));

  return (
    <>
      <PortalPageHeader
        title="Payments"
        description="Every verified fee payment, its provider, reference and receipt number."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total received" value={compactMoney(total)} icon="Banknote" tone="success" />
        <StatCard label="Payments recorded" value={db.payments.length} icon="CreditCard" tone="info" />
        <StatCard
          label="Verified"
          value={db.payments.filter((p) => p.verifiedAt).length}
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
                  <TableHead>Class</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((payment) => {
                  const student = getStudent(payment.studentId);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs font-bold">{payment.receiptNo}</TableCell>
                      <TableCell className="font-bold">{student ? studentName(student) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {student ? classDisplayName(student.classId) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {PROVIDER_LABEL[payment.provider]}
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
          <span className="font-extrabold">Verification · </span>
          A payment is only marked successful after a server-side verification call to the provider. A
          client-side callback is never trusted on its own, and every payment carries a verification
          timestamp.
        </p>
      </Card>
    </>
  );
}
