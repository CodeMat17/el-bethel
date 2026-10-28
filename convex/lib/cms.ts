import { CMS_DEFAULTS, withDefaults } from "../../lib/school/cms/defaults";
import { validateCms, type CmsData, type CmsKey } from "../../lib/school/cms/schema";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * The published value of a website document, for Convex functions that enforce
 * it (open classes, required documents). Drafts never apply here.
 */
export async function publishedContent<K extends CmsKey>(ctx: QueryCtx | MutationCtx, key: K): Promise<CmsData[K]> {
  const doc = await ctx.db.query("cmsDocuments").withIndex("by_key", (q) => q.eq("key", key)).unique();
  if (doc?.published === undefined) return CMS_DEFAULTS[key];
  const checked = validateCms(key, withDefaults(key, doc.published));
  return checked.ok ? checked.data : CMS_DEFAULTS[key];
}
