import type { Metadata } from "next";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { PortalPageHeader } from "@/components/portal/page-header";
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
import { requireParent } from "@/lib/school/auth";
import { api } from "@/convex/_generated/api";
import { studentName } from "@/lib/school/data";
import { getMyChildren, resolveActiveChild } from "@/lib/school/parent";
import { getDirectory } from "@/lib/school/directory";
import { query } from "@/lib/school/convex";
import { formatDateTime, money } from "@/lib/school/format";

export const metadata: Metadata = { title: "Payments" };

export default async function ParentPaymentsPage({ searchParams }: PageProps<"/portal/parent/payments">) {
  const user = await requireParent();
  const dir = await getDirectory();
  const params = await searchParams;
  const child = await resolveActiveChild(typeof params.child === "string" ? params.child : undefined);
  const myChildren = await getMyChildren();

  if (!child) {
    return <EmptyState icon="Users" title="No children linked" description="Contact the school office." />;
  }

  const { payments, invoices } = await query(api.fees.forStudent, { studentId: child.id });
  const openInvoices = invoices.filter((i) => i.total - i.amountPaid > 0);
  const totalPaid = payments.reduce((s, p) => s + (p.status === "successful" ? p.amount : 0), 0);

  return (
    <>
      <PortalPageHeader
        eyebrow={`${studentName(child)} · ${dir.className(child.classId)}`}
        title="Payments & receipts"
        description="Every payment recorded against your child's account by the school bursary."
        action={
          <ChildSwitcher
            activeId={child.id}
            options={myChildren.map((c) => ({
              id: c.id,
              name: studentName(c),
              className: dir.className(c.classId),
              avatarSeed: c.avatarSeed,
            }))}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total paid" value={money(totalPaid)} icon="CircleCheck" tone="success" />
        <StatCard label="Payments made" value={payments.length} icon="CreditCard" tone="info" />
        <StatCard
          label="Open invoices"
          value={openInvoices.length}
          icon="Receipt"
          tone={openInvoices.length > 0 ? "warning" : "success"}
        />
      </div>

      {openInvoices.length > 0 ? (
        <Card className="mt-6 gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Outstanding invoices</h2>
          <Separator className="my-4" />
          <div className="grid gap-3 sm:grid-cols-2">
            {openInvoices.map((invoice) => (
              <div key={invoice.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold">{invoice.invoiceNo}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Balance {money(invoice.total - invoice.amountPaid)} of {money(invoice.total)}
                    </p>
                  </div>
                  <StatusPill tone={invoice.amountPaid > 0 ? "warning" : "danger"}>
                    {invoice.amountPaid > 0 ? "Part paid" : "Unpaid"}
                  </StatusPill>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Pay at the school bursary or by bank transfer quoting {invoice.invoiceNo}. Payments appear here once the
                  bursar confirms them.
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="mt-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Payment history</h2>
        <Separator className="my-4" />
        {payments.length === 0 ? (
          <EmptyState
            icon="CreditCard"
            title="No payments yet"
            description="No payment records are available for this account."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs font-bold">{payment.receiptNo}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateTime(payment.paidAt)}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {payment.provider.replace("_", " ")}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{payment.reference}</TableCell>
                    <TableCell className="text-right font-bold tabular-nums">{money(payment.amount)}</TableCell>
                    <TableCell className="text-right">
                      <StatusPill tone={payment.status === "successful" ? "success" : "warning"}>
                        {payment.status}
                      </StatusPill>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Printed receipts are available from the school bursary.
        </p>
      </Card>
    </>
  );
}
