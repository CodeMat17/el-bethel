"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
// Which classes are open is checked by Convex against the published admission rules.
import { CLASS_LEVELS } from "@/lib/school/config";
import { convexErrorMessage, publicMutation, tryMutation } from "@/lib/school/convex";
import type { ApplicationStatus } from "@/lib/school/types";

/**
 * Online admissions without accounts (public sign-up is off). Starting an
 * application stores a random secret in an httpOnly cookie; Convex keeps only
 * its SHA-256 hash, so the draft can only be edited from the browser that
 * started it. After submission families track it by application number + email.
 */

export interface FormState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

const COOKIE = "eia_application";

function collectErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

async function requireToken(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? hash(token) : null;
}

/* ------------------------------ step 1: start ----------------------------- */

const startSchema = z.object({
  fullName: z.string().trim().min(3, "Enter your full name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  intendedLevelId: z.string().refine((v) => CLASS_LEVELS.some((l) => l.id === v), "Choose a class"),
});

export async function createApplicantAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = startSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    intendedLevelId: formData.get("intendedLevelId"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectErrors(parsed.error), message: "Please check the highlighted fields." };
  }

  const token = randomBytes(32).toString("base64url");
  try {
    await publicMutation(api.admissions.start, { tokenHash: hash(token), ...parsed.data });
  } catch (error) {
    return { ok: false, message: convexErrorMessage(error, "We couldn't start your application. Please try again.") };
  }
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admissions",
    maxAge: 60 * 60 * 24 * 60,
  });
  redirect("/admissions/apply?step=pupil");
}

/* ------------------------------ step 2: pupil ----------------------------- */

const pupilSchema = z.object({
  firstName: z.string().trim().min(2, "Enter the pupil's first name"),
  middleName: z.string().trim().optional().default(""),
  lastName: z.string().trim().min(2, "Enter the pupil's last name"),
  dateOfBirth: z.string().trim().min(1, "Enter the date of birth"),
  gender: z.enum(["Male", "Female"], { message: "Select a gender" }),
  nationality: z.string().trim().min(2, "Enter a nationality"),
  previousSchool: z.string().trim().optional().default(""),
  currentClass: z.string().trim().optional().default(""),
  address: z.string().trim().min(6, "Enter a home address"),
  intendedLevelId: z.string().refine((v) => CLASS_LEVELS.some((l) => l.id === v), "Choose a class"),
});

export async function savePupilStep(_prev: FormState, formData: FormData): Promise<FormState> {
  const tokenHash = await requireToken();
  if (!tokenHash) return { ok: false, message: "We couldn't find your application. Please start again." };
  const parsed = pupilSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectErrors(parsed.error), message: "Please check the highlighted fields." };
  }
  const { intendedLevelId, ...pupil } = parsed.data;
  try {
    await publicMutation(api.admissions.savePupil, { tokenHash, intendedLevelId, pupil });
  } catch (error) {
    return { ok: false, message: convexErrorMessage(error) };
  }
  revalidatePath("/admissions/apply");
  redirect("/admissions/apply?step=guardian");
}

/* ---------------------------- step 3: guardian ---------------------------- */

const guardianSchema = z.object({
  name: z.string().trim().min(3, "Enter the parent or guardian's full name"),
  relationship: z.string().trim().min(2, "Select a relationship"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  occupation: z.string().trim().min(2, "Enter an occupation"),
  address: z.string().trim().min(6, "Enter an address"),
  emergencyContact: z.string().trim().min(3, "Enter an emergency contact name"),
  emergencyPhone: z.string().trim().min(7, "Enter an emergency contact phone number"),
});

export async function saveGuardianStep(_prev: FormState, formData: FormData): Promise<FormState> {
  const tokenHash = await requireToken();
  if (!tokenHash) return { ok: false, message: "We couldn't find your application. Please start again." };
  const parsed = guardianSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectErrors(parsed.error), message: "Please check the highlighted fields." };
  }
  try {
    await publicMutation(api.admissions.saveGuardian, { tokenHash, guardian: parsed.data });
  } catch (error) {
    return { ok: false, message: convexErrorMessage(error) };
  }
  revalidatePath("/admissions/apply");
  redirect("/admissions/apply?step=documents");
}

/* ---------------------------- step 4: documents --------------------------- */

// Nothing is uploaded: the step only lists what to bring to the screening.
export async function continueToReview(): Promise<void> {
  redirect("/admissions/apply?step=review");
}

/* ----------------------------- step 5: payment ---------------------------- */

/**
 * The application fee is paid at the school or by bank transfer and confirmed
 * by the admissions office — nothing is charged online.
 */
export async function payApplicationFee(_prev: FormState): Promise<FormState> {
  void _prev;
  redirect("/admissions/apply?step=submit");
}

/* ----------------------------- step 6: submit ----------------------------- */

export async function submitApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const tokenHash = await requireToken();
  if (!tokenHash) return { ok: false, message: "We couldn't find your application." };
  if (formData.get("declaration") !== "on") return { ok: false, message: "Please confirm the declaration before submitting." };
  let applicationNo: string;
  try {
    applicationNo = await publicMutation(api.admissions.submit, { tokenHash });
  } catch (error) {
    return { ok: false, message: convexErrorMessage(error) };
  }
  (await cookies()).delete({ name: COOKIE, path: "/admissions" });
  revalidatePath("/portal/admin/admissions");
  redirect(`/admissions/status?ref=${encodeURIComponent(applicationNo)}&submitted=1`);
}

/* --------------------------- admin decision flow -------------------------- */

const DECISION_STATUSES: ApplicationStatus[] = [
  "under_review", "documents_required", "assessment_scheduled", "assessment_completed",
  "interview_scheduled", "accepted", "conditionally_accepted", "waitlisted", "not_accepted",
  "withdrawn",
];

export async function updateApplicationStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const status = String(formData.get("status") ?? "") as ApplicationStatus;
  if (!DECISION_STATUSES.includes(status)) return { ok: false, message: "Choose a valid status." };
  const feeValues = formData.getAll("feePaid");
  const result = await tryMutation(api.admissions.updateStatus, {
    applicationId: String(formData.get("applicationId") ?? "") as Id<"applications">,
    status: status as Exclude<ApplicationStatus, "draft">,
    note: String(formData.get("note") ?? ""),
    feePaid: feeValues.length ? feeValues.includes("on") : undefined,
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/admin/admissions");
  return { ok: true, message: "Application updated." };
}
