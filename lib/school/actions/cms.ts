"use server";

import { revalidatePath } from "next/cache";
import { cookies, draftMode } from "next/headers";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isCmsKey, type CmsKey } from "@/lib/school/cms/schema";
import { publicMutation, tryMutation } from "@/lib/school/convex";
import { SITE_TAGS, refreshSite } from "@/lib/school/site-cache";
import { PREVIEW_COOKIE } from "@/lib/school/site-content";

/**
 * Website content actions. Convex checks the caller may edit that document (site
 * editors any, administrators the fee table) and validates every value; these only refresh the affected website pages.
 */

export type CmsResult = { ok: true; message: string } | { ok: false; message: string };

/** Rebuild every public page that reads this section (the homepage shows values, stages and facilities too). */
function refresh(key: CmsKey) {
  refreshSite(SITE_TAGS.cmsKey(key));
  revalidatePath("/portal/site", "layout");
}

export async function saveCmsDraft(key: string, data: unknown): Promise<CmsResult> {
  if (!isCmsKey(key)) return { ok: false, message: "Unknown section." };
  const result = await tryMutation(api.cms.saveDraft, { key, data });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/site", "layout");
  return { ok: true, message: "Draft saved. Preview it, then publish when you're ready." };
}

export async function publishCms(key: string): Promise<CmsResult> {
  if (!isCmsKey(key)) return { ok: false, message: "Unknown section." };
  const result = await tryMutation(api.cms.publish, { key });
  if (!result.ok) return { ok: false, message: result.message };
  refresh(key);
  return { ok: true, message: "Published. The website now shows your changes." };
}

export async function discardCmsDraft(key: string): Promise<CmsResult> {
  if (!isCmsKey(key)) return { ok: false, message: "Unknown section." };
  const result = await tryMutation(api.cms.discardDraft, { key });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/site", "layout");
  return { ok: true, message: "Draft discarded." };
}

export async function restoreCmsVersion(versionId: string): Promise<CmsResult> {
  const result = await tryMutation(api.cms.restoreVersion, { versionId: versionId as Id<"cmsVersions"> });
  if (!result.ok) return { ok: false, message: result.message };
  refresh(result.data.key as CmsKey);
  return { ok: true, message: "That version is live again." };
}

/** Leave preview: forget the token and turn Draft Mode off. */
export async function exitCmsPreview(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(PREVIEW_COOKIE)?.value;
  if (token) {
    try {
      await publicMutation(api.cms.endPreview, { token });
    } catch (error) {
      console.error("Could not revoke the preview token", error);
    }
  }
  jar.delete(PREVIEW_COOKIE);
  (await draftMode()).disable();
}
