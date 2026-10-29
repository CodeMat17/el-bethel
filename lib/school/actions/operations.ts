"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { tryMutation } from "@/lib/school/convex";
import { SITE_TAGS, refreshSite } from "@/lib/school/site-cache";

/**
 * Certificate and achievement actions. Each forwards to a
 * Convex mutation that checks the caller is an administrator.
 */

export interface OpsResult {
  ok: boolean;
  message?: string;
  id?: string;
}

const str = (f: FormData, key: string) => String(f.get(key) ?? "").trim();
const opt = (f: FormData, key: string) => str(f, key) || undefined;
const bool = (f: FormData, key: string) => f.get(key) === "on" || f.get(key) === "true";

function done(message: string, ...paths: string[]): OpsResult {
  for (const path of paths) revalidatePath(path);
  return { ok: true, message };
}

/* ------------------------------ certificates ------------------------------ */

export async function issueCertificate(formData: FormData): Promise<OpsResult> {
  const studentId = str(formData, "studentId");
  if (!studentId) return { ok: false, message: "Choose the pupil receiving the certificate." };
  const result = await tryMutation(api.awards.issueCertificate, {
    studentId: studentId as Id<"students">,
    category: str(formData, "category"),
    award: str(formData, "award"),
    citation: opt(formData, "citation"),
    sessionName: opt(formData, "sessionName"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  return { ...done(`Certificate ${result.data.certificateNo} issued. The family has been notified.`, "/portal/admin/certificates"), id: result.data.id };
}

export async function revokeCertificate(formData: FormData): Promise<OpsResult> {
  const result = await tryMutation(api.awards.revokeCertificate, {
    id: str(formData, "id") as Id<"certificates">,
    reason: str(formData, "reason"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Certificate withdrawn. Verification now shows it as no longer valid.", "/portal/admin/certificates");
}

/* ------------------------------- achievements ----------------------------- */

export async function saveAchievement(formData: FormData): Promise<OpsResult> {
  const result = await tryMutation(api.awards.saveAchievement, {
    id: opt(formData, "id") as Id<"achievements"> | undefined,
    studentId: opt(formData, "studentId") as Id<"students"> | undefined,
    studentInitials: opt(formData, "studentInitials"),
    classLabel: opt(formData, "classLabel"),
    category: str(formData, "category"),
    title: str(formData, "title"),
    description: str(formData, "description"),
    date: str(formData, "date"),
    published: bool(formData, "published"),
    issueCertificate: bool(formData, "issueCertificate"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  refreshSite(SITE_TAGS.lists);
  return done(
    result.data.certificateNo ? `Saved, and certificate ${result.data.certificateNo} issued.` : "Achievement saved.",
    "/portal/admin/achievements",
    "/portal/admin/certificates",
  );
}

export async function removeAchievement(id: string): Promise<OpsResult> {
  const result = await tryMutation(api.awards.removeAchievement, { id: id as Id<"achievements"> });
  if (!result.ok) return { ok: false, message: result.message };
  refreshSite(SITE_TAGS.lists);
  return done("Achievement removed.", "/portal/admin/achievements");
}

/* ------------------------------- house points ----------------------------- */

export async function recalculateHousePoints(): Promise<OpsResult> {
  const result = await tryMutation(api.gamification.requestRecompute, {});
  if (!result.ok) return { ok: false, message: result.message };
  return done("Recalculating house points. Refresh in a moment to see the new totals.", "/portal/admin/achievements");
}

/* ---------------------------------- email --------------------------------- */

export async function sendTestEmail(): Promise<OpsResult> {
  const result = await tryMutation(api.delivery.sendTest, {});
  if (!result.ok) return { ok: false, message: result.message };
  return done(`Test email sent to ${result.data}.`, "/portal/admin/notifications");
}
