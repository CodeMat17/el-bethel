import Link from "next/link";
import type { Metadata } from "next";
import { CreditCardIcon, DownloadIcon, InfoIcon } from "lucide-react";

import { EmptyState, StatCard } from "@/components/common";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { PortalPageHeader } from "@/components/portal/page-header";
import { InvoiceCard } from "@/components/portal/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireParent } from "@/lib/school/auth";
import {
  childrenForSession,
  classDisplayName,
  getInvoicesForStudent,
  getPaymentsForStudent,
  getTerm,
  outstandingForStudents,
  resolveActiveChild,
  studentName,
} from "@/lib/school/data";
import { formatDate, money } from "@/lib/school/format";

export const metadata: Metadata = { title: "Fees" };

export default async function ParentFeesPage({ searchParams }: PageProps<"/portal/parent/fees">) {
  const user = await requireParent();
  const params = await searchParams;
  const child = resolveActiveChild(user, typeof params.child === "string" ? params.child : undefined);
  const myChildren = childrenForSession(user);

  if (!child) {
    return <EmptyState icon="Users" title="No children linked" description="Contact the school office." />;
  }

  const invoices = getInvoicesForStudent(child.id);
  const payments = getPaymentsForStudent(child.id);
  const billed = invoices.reduce((s, i) => s + i.total, 0);
  const paid = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const familyOutstanding = outstandingForStudents(myChildren.map((c) => c.id));

  return (
    <>
      <PortalPageHeader
        eyebrow={`${studentName(child)} · ${classDisplayName(child.classId)}`}
        title="Fees"
        description="Invoices, balances and payment history for your child."
        action={
          <ChildSwitcher
            activeId={child.id}
            options={myChildren.map((c) => ({
              id: c.id,
              name: studentName(c),
              className: classDisplayName(c.classId),
              avatarSeed: c.avatarSeed,
            }))}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Billed this session" value={money(billed)} icon="Receipt" tone="neutral" />
        <StatCard label="Paid to date" value={money(paid)} icon="CircleCheck" tone="success" />
        <StatCard
          label="Balance for this child"
          value={money(billed - paid)}
          icon="Wallet"
          tone={billed - paid > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Family balance"
          value={money(familyOutstanding)}
          hint={`Across ${myChildren.length} ${myChildren.length === 1 ? "child" : "children"}`}
          icon="HandCoins"
          tone={familyOutstanding > 0 ? "warning" : "success"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {invoices.length === 0 ? (
            <EmptyState
              icon="Receipt"
              title="No invoices yet"
              description="No payment records are available for this account."
            />
          ) : (
            invoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                termName={getTerm(invoice.termId)?.name ?? "Current term"}
                action={
                  invoice.total - invoice.amountPaid > 0 ? (
                    <Button size="lg" className="w-full font-bold" render={<Link href={`/portal/parent/payments?invoice=${invoice.id}`} />}>
                      <CreditCardIcon />
                      Pay {money(invoice.total - invoice.amountPaid)}
                    </Button>
                  ) : (
                    <Button variant="outline" size="lg" className="w-full font-bold" render={<Link href="/portal/parent/payments" />}>
                      <DownloadIcon />
                      View receipts
                    </Button>
                  )
                }
              />
            ))
          )}
        </div>

        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Recent payments</h2>
            <Separator className="my-4" />
            {payments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No payment records are available for this account.
              </p>
            ) : (
              <ul className="space-y-3">
                {payments.slice(0, 6).map((payment) => (
                  <li key={payment.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{money(payment.amount)}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {formatDate(payment.paidAt)} · {payment.provider.replace("_", " ")}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground">
                      {payment.receiptNo}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="outline" size="lg" className="mt-4 w-full font-bold" render={<Link href="/portal/parent/payments" />}>
              All payments and receipts
            </Button>
          </Card>

          <Card className="gap-0 border-info/30 bg-info/10 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-heading text-base font-extrabold">
              <InfoIcon className="size-4 text-info" />
              Need a payment plan?
            </h2>
            <p className="mt-2 text-sm leading-relaxed">
              Instalment plans are available on request. Contact the school accountant before the start of
              term and we will agree a schedule that works for your family.
            </p>
            <Button variant="outline" size="lg" className="mt-4 w-full font-bold" render={<Link href="/portal/parent/messages" />}>
              Message the accounts office
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
