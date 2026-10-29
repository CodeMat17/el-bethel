import "server-only";

import { unstable_cache, updateTag } from "next/cache";

import type { CmsKey } from "./cms/schema";

/**
 * Cache tags for the public website. Pages are rendered once and served from
 * the cache; each read below is tagged, so a dashboard change rebuilds only the
 * pages that show that data (see `refreshSite`).
 */
export const SITE_TAGS = {
  news: "site:news",
  events: "site:events",
  gallery: "site:gallery",
  /** Clubs, achievements, testimonials, FAQs and public documents. */
  lists: "site:lists",
  documents: "site:documents",
  notices: "site:notices",
  /** Classes, subjects, teachers, terms and sessions. */
  directory: "site:directory",
  /** Classes per level and how many pupils are in them. */
  levels: "site:levels",
  alumni: "site:alumni",
  /** Every editable website section, for changes that touch several at once. */
  cms: "site:cms",
  cmsKey: (key: CmsKey) => `site:cms:${key}`,
} as const;

/**
 * Cache a public read under `tags`. There is no time-based expiry: it is kept
 * until the dashboard refreshes one of its tags. Date-dependent views (upcoming
 * events, the live notice) are worked out in the browser instead.
 */
export function siteCache<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
  key: string,
  tags: string[],
): (...args: Args) => Promise<T> {
  return unstable_cache(fn, ["site", key], { tags, revalidate: false });
}

/**
 * Rebuild the public pages that show these tags. Server Actions only, and only
 * after Convex has accepted the change, so a refused (unauthorised) edit never
 * touches the cache. The next visitor gets fresh data, never the stale copy.
 */
export function refreshSite(...tags: string[]): void {
  for (const tag of new Set(tags)) updateTag(tag);
}
