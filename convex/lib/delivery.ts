import { isEmailed } from "../../lib/school/email-notifications";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

/**
 * Email delivery through Resend. `notify()` calls `queueEmail` after writing
 * the in-app notification; for the kinds listed in
 * lib/school/email-notifications.ts it writes an outbox row and schedules the
 * action that sends it.
 */

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim());

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email goes to adults only: parents and staff. A pupil-only account never gets one. */
export async function emailFor(ctx: Ctx, user: Doc<"users">): Promise<string | null> {
  if (!user.roles.some((r) => r !== "pupil")) return null;
  const candidates = [
    user.email,
    user.parentId ? (await ctx.db.get(user.parentId))?.email : undefined,
    user.teacherId ? (await ctx.db.get(user.teacherId))?.email : undefined,
  ];
  const found = candidates.find((e) => e && EMAIL.test(e.trim()));
  return found ? found.trim().toLowerCase() : null;
}

export async function enqueueEmail(
  ctx: MutationCtx,
  user: Doc<"users">,
  to: string,
  n: { title: string; body: string; href?: string; cta?: string },
  notificationId?: Id<"notifications">,
) {
  const deliveryId = await ctx.db.insert("deliveries", {
    notificationId,
    userId: user._id,
    to,
    title: n.title,
    body: n.body,
    href: n.href,
    cta: n.cta,
    status: "queued",
    createdAt: new Date().toISOString(),
  });
  await ctx.scheduler.runAfter(0, internal.delivery.send, { deliveryId });
}

export async function queueEmail(
  ctx: MutationCtx,
  userId: Id<"users">,
  notificationId: Id<"notifications">,
  n: { type: string; title: string; body: string; href?: string },
) {
  if (!isEmailed(n.type) || !emailConfigured()) return;
  const user = await ctx.db.get(userId);
  if (!user?.active) return;
  const to = await emailFor(ctx, user);
  if (to) await enqueueEmail(ctx, user, to, n, notificationId);
}
