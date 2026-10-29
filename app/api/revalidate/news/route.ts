import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { SITE_TAGS } from "@/lib/school/site-cache";

/**
 * Called by Convex at a scheduled post's publish time (convex/newsRelease.ts) to
 * rebuild the cached news pages and homepage. It can only refresh news, and only
 * with the shared REVALIDATE_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET?.trim();
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  // The post is live now; the next visitor should get it, not the cached copy.
  revalidateTag(SITE_TAGS.news, { expire: 0 });
  return NextResponse.json({ ok: true });
}
