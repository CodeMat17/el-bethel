import "server-only";

import { cache } from "react";
import { cookies, draftMode } from "next/headers";

import { api } from "@/convex/_generated/api";
import { CMS_DEFAULTS, withDefaults } from "./cms/defaults";
import { validateCms, type CmsData, type CmsKey } from "./cms/schema";
import { fillTokens, withLinks, type School } from "./cms/tokens";
import { publicQuery } from "./convex";
import { SITE_TAGS, siteCache } from "./site-cache";

/**
 * Editable website content, read on the public site. Visitors get the published
 * value; an editor previewing from the Site portal (Draft Mode plus a preview
 * token) gets the draft. Anything missing or invalid falls back to the content
 * the site shipped with, so a page always renders.
 */

export const PREVIEW_COOKIE = "eb_cms_preview";

/** The preview token, only when Draft Mode is on. */
export const getPreviewToken = cache(async (): Promise<string | null> => {
  if (!(await draftMode()).isEnabled) return null;
  return (await cookies()).get(PREVIEW_COOKIE)?.value ?? null;
});

/** Published content stays cached until that section is published again (see the cms actions). */
const published = (key: CmsKey) =>
  siteCache(() => publicQuery(api.cms.published, { key }), `cms:${key}`, [SITE_TAGS.cms, SITE_TAGS.cmsKey(key)])();

const load = cache(async (key: CmsKey): Promise<unknown> => {
  try {
    const token = await getPreviewToken();
    if (token) {
      const draft = await publicQuery(api.cms.preview, { key, token });
      if (draft !== null) return draft;
    }
    return await published(key);
  } catch (error) {
    console.error(`Could not load website content "${key}"; using the defaults.`, error);
    return null;
  }
});

async function raw<K extends CmsKey>(key: K): Promise<CmsData[K]> {
  const stored = await load(key);
  if (stored === null) return CMS_DEFAULTS[key];
  const checked = validateCms(key, withDefaults(key, stored));
  if (!checked.ok) {
    console.error(`Website content "${key}" is invalid (${checked.message}); using the defaults.`);
    return CMS_DEFAULTS[key];
  }
  return checked.data;
}

/** The school's name, contact details and links. */
export const getSchool = cache(async (): Promise<School> => withLinks(await raw("identity")));

/** A page's content with {school}, {session}… placeholders filled in. */
export async function getContent<K extends Exclude<CmsKey, "identity">>(key: K): Promise<CmsData[K]> {
  const [content, school] = await Promise.all([raw(key), getSchool()]);
  return fillTokens(content, school);
}
