"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertStudentAccess, requireParent } from "@/lib/school/auth";
import { DEMO_TODAY } from "@/lib/school/seed";
import { getDb } from "@/lib/school/store";
import type { PaymentProvider } from "@/lib/school/types";

export interface PaymentState {
  ok: boolean;
  message?: string;
  receiptNo?: string;
}

const schema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  provider: z.enum(["paystack", "flutterwave", "bank_transfer"]),
});

/**
 * Records a fee payment.
 *
 * The demo settles immediately, but the shape mirrors production: the caller is
 * authorised server-side, the amount is re-derived from the invoice rather than
 * trusted from the client, and the payment is only marked successful after a
 * server-side verification step (`verifyWithProvider`).
 */
export async function payInvoice(_prev: PaymentState, formData: FormData): Promise<PaymentState> {
  const user = await requireParent();

  const parsed = schema.safeParse({
    invoiceId: formData.get("invoiceId"),
    amount: formData.get("amount"),
    provider: formData.get("provider"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the payment details." };
  }

  const db = getDb();
  const invoice = db.invoices.find((i) => i.id === parsed.data.invoiceId);
  if (!invoice) return { ok: false, message: "We couldn't find that invoice." };

  // Authorisation: a parent may only pay for their own children.
  assertStudentAccess(user, invoice.studentId);

  const balance = invoice.total - invoice.amountPaid;
  if (balance <= 0) return { ok: false, message: "This invoice has already been paid in full." };

  const amount = Math.min(parsed.data.amount, balance);
  if (amount < 1000) {
    return { ok: false, message: "The minimum part payment is ₦1,000." };
  }

  const verified = await verifyWithProvider(parsed.data.provider, amount);
  if (!verified) {
    return { ok: false, message: "We could not verify that payment with the provider. Nothing has been charged." };
  }

  const sequence = db.payments.length + 1;
  const receiptNo = `RCP-2026-${String(sequence).padStart(5, "0")}`;
  db.payments.unshift({
    id: `pay-${sequence}-${Date.now().toString(36)}`,
    reference: `CHA-PAY-${Date.now().toString(36).toUpperCase()}`,
    invoiceId: invoice.id,
    studentId: invoice.studentId,
    amount,
    provider: parsed.data.provider as PaymentProvider,
    status: "successful",
    paidAt: DEMO_TODAY.toISOString(),
    verifiedAt: DEMO_TODAY.toISOString(),
    receiptNo,
  });

  invoice.amountPaid += amount;
  invoice.status = invoice.amountPaid >= invoice.total ? "paid" : "part_paid";

  db.notifications.unshift({
    id: `ntf-${db.notifications.length + 1}`,
    userId: user.id,
    type: "payment_confirmation",
    title: "Your fee payment was successful",
    body: `We have received ${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount)} against ${invoice.invoiceNo}. Receipt ${receiptNo} is available to download.`,
    href: "/portal/parent/payments",
    createdAt: DEMO_TODAY.toISOString(),
    read: false,
  });

  db.auditLogs.unshift({
    id: `aud-${db.auditLogs.length + 1}`,
    actorId: user.id,
    actorName: user.name,
    action: "Recorded fee payment",
    entity: "Payment",
    entityId: invoice.id,
    previousValue: String(invoice.amountPaid - amount),
    newValue: String(invoice.amountPaid),
    at: DEMO_TODAY.toISOString(),
    ip: "—",
    device: "Web",
  });

  revalidatePath("/portal/parent/fees");
  revalidatePath("/portal/parent/payments");
  return { ok: true, message: "Payment received. Your receipt is ready to download.", receiptNo };
}

/**
 * Stand-in for a server-to-server verification call to Paystack or Flutterwave.
 * A client-side callback must never be trusted on its own.
 */
async function verifyWithProvider(provider: string, amount: number): Promise<boolean> {
  return Boolean(provider) && amount > 0;
}
