"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { tryMutation } from "@/lib/school/convex";
import { SITE_TAGS, refreshSite } from "@/lib/school/site-cache";

/**
 * Site portal list actions (testimonials, clubs, FAQs). Convex checks the caller
 * is a site or super administrator; these refresh only the pages that show the lists.
 */

export interface SiteResult {
  ok: boolean;
  message?: string;
}

const str = (f: FormData, key: string) => String(f.get(key) ?? "").trim();
const opt = (f: FormData, key: string) => str(f, key) || undefined;

async function finish(result: { ok: boolean; message?: string }, message: string, portalPath: string): Promise<SiteResult> {
  if (!result.ok) return { ok: false, message: result.message };
  // Lists appear on several public pages (homepage, school life, admissions); the tag finds them all.
  refreshSite(SITE_TAGS.lists);
  revalidatePath(portalPath);
  return { ok: true, message };
}

export async function saveTestimonial(formData: FormData): Promise<SiteResult> {
  const result = await tryMutation(api.siteLists.saveTestimonial, {
    id: opt(formData, "id") as Id<"testimonials"> | undefined,
    name: str(formData, "name"),
    relationship: str(formData, "relationship"),
    quote: str(formData, "quote"),
  });
  return finish(result, "Testimonial saved.", "/portal/site/testimonials");
}

export async function removeTestimonial(id: string): Promise<SiteResult> {
  return finish(await tryMutation(api.siteLists.removeTestimonial, { id: id as Id<"testimonials"> }), "Testimonial deleted.", "/portal/site/testimonials");
}

const CLUB_CATEGORIES = ["stem", "arts", "sports", "literary", "service"] as const;

export async function saveClub(formData: FormData): Promise<SiteResult> {
  const category = str(formData, "category");
  const result = await tryMutation(api.siteLists.saveClub, {
    id: opt(formData, "id") as Id<"clubs"> | undefined,
    name: str(formData, "name"),
    description: str(formData, "description"),
    meetingDay: str(formData, "meetingDay"),
    meetingTime: str(formData, "meetingTime"),
    memberCount: Number(str(formData, "memberCount")) || 0,
    category: (CLUB_CATEGORIES as readonly string[]).includes(category) ? (category as (typeof CLUB_CATEGORIES)[number]) : "stem",
  });
  return finish(result, "Club saved.", "/portal/site/clubs");
}

export async function removeClub(id: string): Promise<SiteResult> {
  return finish(await tryMutation(api.siteLists.removeClub, { id: id as Id<"clubs"> }), "Club deleted.", "/portal/site/clubs");
}

export async function saveFaq(formData: FormData): Promise<SiteResult> {
  const result = await tryMutation(api.siteLists.saveFaq, {
    id: opt(formData, "id") as Id<"faqs"> | undefined,
    category: str(formData, "category"),
    question: str(formData, "question"),
    answer: str(formData, "answer"),
  });
  return finish(result, "Question saved.", "/portal/site/faqs");
}

export async function moveFaq(id: string, direction: "up" | "down"): Promise<SiteResult> {
  return finish(await tryMutation(api.siteLists.moveFaq, { id: id as Id<"faqs">, direction }), "", "/portal/site/faqs");
}

export async function removeFaq(id: string): Promise<SiteResult> {
  return finish(await tryMutation(api.siteLists.removeFaq, { id: id as Id<"faqs"> }), "Question deleted.", "/portal/site/faqs");
}
