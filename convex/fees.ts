import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertStudentAccess, fail, requireAdmin, requireViewer } from "./lib/access";
import { accountsForStudent, audit, notify, nowISO, withId } from "./lib/util";

/**
 * Fees are recorded by the school office. Payments are entered once the bursar
 * has confirmed them (bank transfer, POS or cash); nothing is marked as paid from
 * the browser.
 */

export const forStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, { studentId }) => {
    const viewer = await requireViewer(ctx);
    await assertStudentAccess(ctx, viewer, studentId);
    const [invoices, payments] = await Promise.all([
      ctx.db.query("invoices").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect(),
      ctx.db.query("payments").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect(),
    ]);
    return {
      invoices: invoices.map(withId).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
      payments: payments.map(withId).sort((a, b) => b.paidAt.localeCompare(a.paidAt)),
    };
  },
});

export const listInvoices = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    classId: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const [invoices, students] = await Promise.all([ctx.db.query("invoices").collect(), ctx.db.query("students").collect()]);
    const studentMap = new Map(students.map((s) => [s._id, s]));
    const term = args.search?.trim().toLowerCase() ?? "";
    const filtered = invoices
      .filter((i) => {
        const s = studentMap.get(i.studentId);
        if (args.status && args.status !== "all" && i.status !== args.status) return false;
        if (args.classId && args.classId !== "all" && s?.classId !== args.classId) return false;
        if (!term) return true;
        return `${i.invoiceNo} ${s?.firstName ?? ""} ${s?.lastName ?? ""} ${s?.studentNo ?? ""}`.toLowerCase().includes(term);
      })
      .sort((a, b) => a.invoiceNo.localeCompare(b.invoiceNo));
    const pageSize = args.pageSize ?? 12;
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(Math.max(1, args.page ?? 1), pageCount);
    const billed = invoices.reduce((n, i) => n + i.total, 0);
    const collected = invoices.reduce((n, i) => n + i.amountPaid, 0);
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize).map((i) => {
        const s = studentMap.get(i.studentId);
        return { ...withId(i), studentName: s ? `${s.firstName} ${s.lastName}` : "—", studentNo: s?.studentNo ?? "", classId: s?.classId ?? null };
      }),
      total: filtered.length,
      page,
      pageSize,
      pageCount,
      totals: {
        billed,
        collected,
        outstanding: billed - collected,
        collectionRate: billed ? Math.round((collected / billed) * 100) : 0,
        overdue: invoices.filter((i) => i.status === "overdue").length,
        paid: invoices.filter((i) => i.status === "paid").length,
      },
    };
  },
});

export const listPayments = query({
  args: { search: v.optional(v.string()), provider: v.optional(v.string()), page: v.optional(v.number()), pageSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const [payments, students] = await Promise.all([ctx.db.query("payments").collect(), ctx.db.query("students").collect()]);
    const studentMap = new Map(students.map((s) => [s._id, s]));
    const term = args.search?.trim().toLowerCase() ?? "";
    const filtered = payments
      .filter((p) => {
        if (args.provider && args.provider !== "all" && p.provider !== args.provider) return false;
        if (!term) return true;
        const s = studentMap.get(p.studentId);
        return `${p.reference} ${p.receiptNo} ${s?.firstName ?? ""} ${s?.lastName ?? ""}`.toLowerCase().includes(term);
      })
      .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
    const pageSize = args.pageSize ?? 12;
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(Math.max(1, args.page ?? 1), pageCount);
    const ok = payments.filter((p) => p.status === "successful");
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize).map((p) => {
        const s = studentMap.get(p.studentId);
        return { ...withId(p), studentName: s ? `${s.firstName} ${s.lastName}` : "—" };
      }),
      total: filtered.length,
      page,
      pageSize,
      pageCount,
      totals: {
        count: payments.length,
        verified: payments.filter((p) => p.verifiedAt).length,
        amount: ok.reduce((n, p) => n + p.amount, 0),
        byProvider: ["paystack", "flutterwave", "bank_transfer", "cash"].map((provider) => ({
          provider,
          amount: ok.filter((p) => p.provider === provider).reduce((n, p) => n + p.amount, 0),
        })),
      },
    };
  },
});

/** The bursar records a payment that has been received and confirmed. */
export const recordPayment = mutation({
  args: {
    invoiceId: v.id("invoices"),
    amount: v.number(),
    provider: v.union(v.literal("paystack"), v.literal("flutterwave"), v.literal("bank_transfer"), v.literal("cash")),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireAdmin(ctx);
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) fail("NOT_FOUND", "Invoice not found.");
    const balance = invoice.total - invoice.amountPaid;
    if (balance <= 0) fail("INVALID", "This invoice is already paid in full.");
    if (!Number.isFinite(args.amount) || args.amount <= 0) fail("INVALID", "Enter an amount greater than zero.");
    if (args.amount > balance) fail("INVALID", `The balance is only ₦${balance.toLocaleString("en-NG")}.`);
    const count = (await ctx.db.query("payments").collect()).length + 1;
    const year = new Date().getUTCFullYear();
    const receiptNo = `RCP-${year}-${String(count).padStart(5, "0")}`;
    const now = nowISO();
    await ctx.db.insert("payments", {
      reference: args.reference?.trim() || `EIA-PAY-${Date.now().toString(36).toUpperCase()}`,
      invoiceId: invoice._id,
      studentId: invoice.studentId,
      amount: args.amount,
      provider: args.provider,
      status: "successful",
      paidAt: now,
      verifiedAt: now,
      receiptNo,
    });
    const amountPaid = invoice.amountPaid + args.amount;
    await ctx.db.patch(invoice._id, { amountPaid, status: amountPaid >= invoice.total ? "paid" : "part_paid" });
    await audit(ctx, viewer, { action: "Recorded fee payment", entity: "Payment", entityId: invoice._id, previousValue: String(invoice.amountPaid), newValue: String(amountPaid) });
    for (const userId of await accountsForStudent(ctx, invoice.studentId)) {
      const u = await ctx.db.get(userId);
      if (!u?.parentId) continue;
      await notify(ctx, userId, {
        type: "payment_confirmation",
        title: "Fee payment received",
        body: `₦${args.amount.toLocaleString("en-NG")} received against ${invoice.invoiceNo}. Receipt ${receiptNo}.`,
        href: "/portal/parent/payments",
      });
    }
    return { receiptNo };
  },
});
