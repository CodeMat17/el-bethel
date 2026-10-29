"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { destroyAsset } from "@/lib/school/cloudinary";
import { tryMutation } from "@/lib/school/convex";
import { SITE_TAGS, refreshSite } from "@/lib/school/site-cache";
import type { CloudMedia } from "@/lib/school/types";

/**
 * Actions for alumni stories. Each forwards to Convex, which checks who the
 * caller is and what they may do.
 */

export interface PremiumResult {
  ok: boolean;
  message?: string;
  id?: string;
}

const str = (f: FormData, key: string) => String(f.get(key) ?? "").trim();
const opt = (f: FormData, key: string) => str(f, key) || undefined;
const bool = (f: FormData, key: string) => f.get(key) === "on" || f.get(key) === "true";

function done(message: string, ...paths: string[]): PremiumResult {
  for (const path of paths) revalidatePath(path);
  return { ok: true, message };
}

/* --------------------------------- alumni --------------------------------- */

export async function saveAlumniStory(formData: FormData, cover?: CloudMedia): Promise<PremiumResult> {
  const result = await tryMutation(api.alumni.saveStory, {
    id: opt(formData, "id") as Id<"alumniStories"> | undefined,
    title: str(formData, "title"),
    authorName: str(formData, "authorName"),
    graduationYear: Number(str(formData, "graduationYear")),
    excerpt: str(formData, "excerpt"),
    body: str(formData, "body"),
    cover,
    published: bool(formData, "published"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data.previousCover) await destroyAsset(result.data.previousCover);
  refreshSite(SITE_TAGS.alumni);
  return done("Story saved.", "/portal/admin/alumni");
}

export async function removeAlumniStory(id: string): Promise<PremiumResult> {
  const result = await tryMutation(api.alumni.removeStory, { id: id as Id<"alumniStories"> });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data.publicId) await destroyAsset(result.data.publicId);
  refreshSite(SITE_TAGS.alumni);
  return done("Story removed.", "/portal/admin/alumni");
}
