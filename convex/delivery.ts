import { v } from "convex/values";

import { SITE_URL } from "../lib/school/config";
import type { SchoolIdentity } from "../lib/school/cms/schema";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { fail, requireAdmin } from "./lib/access";
import { publishedContent } from "./lib/cms";
import { emailConfigured, emailFor, enqueueEmail } from "./lib/delivery";
import { nowISO, withId } from "./lib/util";

/**
 * Notification emails through Resend (https://resend.com).
 *
 * Configure in the Convex dashboard (Settings → Environment Variables):
 *   RESEND_API_KEY  — an API key from Resend
 *   RESEND_FROM     — a sender on a domain verified in Resend,
 *                     e.g. "El-Bethel International Academy <notifications@ebia.com.ng>"
 *   SITE_URL        — optional; the address links in emails point to (defaults to the live site)
 */

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function renderEmail(
  school: Pick<SchoolIdentity, "name" | "address" | "phone">,
  title: string,
  body: string,
  link: string | null,
  cta = "Open in the portal",
) {
  const SCHOOL = school;
  const button = link
    ? `<p style="margin:28px 0 0"><a href="${escapeHtml(link)}" style="display:inline-block;background:#232a3a;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">${escapeHtml(cta)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#faf8f4;font-family:Arial,Helvetica,sans-serif;color:#1f2430">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #ebe6da">
<tr><td style="padding:24px 28px;border-bottom:3px solid #c79a38"><strong style="color:#232a3a;font-size:16px">${escapeHtml(SCHOOL.name)}</strong></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-size:20px;color:#232a3a">${escapeHtml(title)}</h1>
<p style="margin:0;font-size:15px;line-height:1.6">${escapeHtml(body)}</p>
${button}
</td></tr>
<tr><td style="padding:18px 28px;font-size:12px;color:#6b7280;border-top:1px solid #ebe6da">
${escapeHtml(SCHOOL.address)} · ${escapeHtml(SCHOOL.phone)}<br>You receive this because you have an account on the school portal. Every notice is also in the portal.
</td></tr></table></td></tr></table></body></html>`;
  const text = `${title}\n\n${body}${link ? `\n\n${cta}: ${link}` : ""}\n\n${SCHOOL.name}`;
  return { html, text };
}

/* -------------------------------- internal -------------------------------- */

export const job = internalQuery({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => await ctx.db.get(deliveryId),
});

/** The school name and contact line for email headers and footers, as published in the Site portal. */
export const identity = internalQuery({
  args: {},
  handler: async (ctx) => {
    const s = await publishedContent(ctx, "identity");
    return { name: s.name, address: s.address, phone: s.phone };
  },
});

export const record = internalMutation({
  args: {
    deliveryId: v.id("deliveries"),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("skipped")),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, { deliveryId, status, detail }) => {
    await ctx.db.patch(deliveryId, { status, detail: detail?.slice(0, 300), sentAt: nowISO() });
  },
});

export const send = internalAction({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => {
    const d = await ctx.runQuery(internal.delivery.job, { deliveryId });
    if (!d || d.status !== "queued") return;
    if (!emailConfigured()) {
      await ctx.runMutation(internal.delivery.record, { deliveryId, status: "skipped", detail: "Email is not configured" });
      return;
    }
    const site = (process.env.SITE_URL ?? SITE_URL).replace(/\/$/, "");
    const school = await ctx.runQuery(internal.delivery.identity, {});
    const { html, text } = renderEmail(school, d.title, d.body, d.href ? `${site}${d.href}` : null, d.cta);
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
          "Content-Type": "application/json",
          // A retry of the same outbox row is never sent twice.
          "Idempotency-Key": `delivery-${deliveryId}`,
        },
        body: JSON.stringify({ from: process.env.RESEND_FROM!.trim(), to: [d.to], subject: d.title, html, text }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      await ctx.runMutation(internal.delivery.record, {
        deliveryId,
        status: res.ok ? "sent" : "failed",
        detail: res.ok ? `Resend ${body.id ?? ""}`.trim() : body.message ?? `Resend returned ${res.status}`,
      });
    } catch (error) {
      await ctx.runMutation(internal.delivery.record, { deliveryId, status: "failed", detail: String(error) });
    }
  },
});

/* ---------------------------------- admin --------------------------------- */

export const adminLog = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("deliveries").withIndex("by_created").order("desc").take(500);
    const recent = rows.slice(0, 60);
    const names = new Map<string, string>();
    for (const r of recent) if (!names.has(r.userId)) names.set(r.userId, (await ctx.db.get(r.userId))?.name ?? "—");
    const count = (status: string) => rows.filter((r) => r.status === status).length;
    return {
      configured: emailConfigured(),
      totals: { sent: count("sent"), failed: count("failed"), queued: count("queued") },
      recent: recent.map((r) => ({ ...withId(r), userName: names.get(r.userId) ?? "—" })),
    };
  },
});

/** Email the signed-in administrator, to check the Resend set-up. */
export const sendTest = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireAdmin(ctx);
    if (!emailConfigured()) fail("INVALID", "Email isn't configured yet. Set RESEND_API_KEY and RESEND_FROM in Convex.");
    const to = await emailFor(ctx, viewer);
    if (!to) fail("INVALID", "Your account has no email address.");
    await enqueueEmail(ctx, viewer, to, {
      title: "Test email from the school portal",
      body: "Email notifications are working.",
      href: "/portal/admin/notifications",
    });
    return to;
  },
});
