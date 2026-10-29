import { v } from "convex/values";

import { SITE_URL } from "../lib/school/config";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalAction, internalMutation, type MutationCtx } from "./_generated/server";
import { nowISO } from "./lib/util";

/**
 * Posts dated in the future go live on their own. The website caches its news
 * pages until told otherwise, so at a post's publish time Convex marks it
 * published (if it was "scheduled") and asks the website to rebuild the news pages.
 *
 * Configure in the Convex dashboard (Settings → Environment Variables):
 *   REVALIDATE_SECRET  the same value as the website's REVALIDATE_SECRET
 *   SITE_URL           the website's address (defaults to the live site)
 */

/** Book the release for a post saved with a future publish time. Called whenever a post is saved. */
export async function scheduleNewsRelease(ctx: MutationCtx, id: Id<"news">, post: Pick<Doc<"news">, "status" | "publishedAt">) {
  if (post.status !== "published" && post.status !== "scheduled") return;
  if (post.publishedAt <= nowISO()) return;
  await ctx.scheduler.runAt(new Date(post.publishedAt), internal.newsRelease.release, { id, publishedAt: post.publishedAt });
}

export const release = internalMutation({
  args: { id: v.id("news"), publishedAt: v.string() },
  handler: async (ctx, { id, publishedAt }) => {
    const post = await ctx.db.get(id);
    // Deleted, unpublished or rescheduled since this was booked: nothing to release
    // (a reschedule booked its own job).
    if (!post || post.publishedAt !== publishedAt) return;
    if (post.status === "scheduled") await ctx.db.patch(id, { status: "published" });
    else if (post.status !== "published") return;
    await ctx.scheduler.runAfter(0, internal.newsRelease.refreshWebsite, {});
  },
});

export const refreshWebsite = internalAction({
  args: {},
  handler: async () => {
    const secret = process.env.REVALIDATE_SECRET?.trim();
    if (!secret) {
      console.warn("REVALIDATE_SECRET is not set; the website's news pages will update on the next news save.");
      return;
    }
    const site = (process.env.SITE_URL ?? SITE_URL).replace(/\/$/, "");
    const res = await fetch(`${site}/api/revalidate/news`, { method: "POST", headers: { Authorization: `Bearer ${secret}` } });
    if (!res.ok) throw new Error(`The website refused the news refresh (status ${res.status}).`);
  },
});
