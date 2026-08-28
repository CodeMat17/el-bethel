"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSessionUser, setSessionCookie } from "@/lib/school/auth";
import { ADMISSION_OPEN_LEVELS, APPLICATION_DOCUMENT_REQUIREMENTS } from "@/lib/school/config";
import { DEMO_TODAY } from "@/lib/school/seed";
import { getDb } from "@/lib/school/store";
import type { Application, ApplicationStatus, Gender } from "@/lib/school/types";

export interface FormState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

const EMPTY: FormState = { ok: false };

function collectErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

function nextApplicationNumber(): string {
  const db = getDb();
  const highest = db.applications.reduce((max, a) => {
    const n = Number(a.applicationNo.split("-")[2] ?? 0);
    return n > max ? n : max;
  }, 0);
  return `ADM-2026-${String(highest + 1).padStart(5, "0")}`;
}

/* ------------------------------ step 1: account --------------------------- */

const accountSchema = z.object({
  fullName: z.string().trim().min(3, "Enter your full name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  password: z.string().min(8, "Use at least 8 characters"),
  intendedLevelId: z.string().refine((v) => ADMISSION_OPEN_LEVELS.includes(v), "Choose a class that is open for admission"),
});

export async function createApplicantAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = accountSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    intendedLevelId: formData.get("intendedLevelId"),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: collectErrors(parsed.error), message: "Please check the highlighted fields." };
  }

  const db = getDb();
  const { email } = parsed.data;

  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return {
      ok: false,
      fieldErrors: { email: "An account already exists with this email. Please sign in instead." },
    };
  }

  const userId = `usr-app-${db.users.length + 1}`;
  db.users.push({
    id: userId,
    name: parsed.data.fullName,
    email,
    phone: parsed.data.phone,
    password: parsed.data.password,
    roles: ["applicant"],
    avatarSeed: parsed.data.fullName,
    active: true,
    createdAt: new Date().toISOString(),
  });

  const application: Application = {
    id: `app-${db.applications.length + 1}-${Date.now().toString(36)}`,
    applicationNo: nextApplicationNumber(),
    sessionId: "ses-2026",
    intendedLevelId: parsed.data.intendedLevelId,
    status: "draft",
    createdAt: new Date().toISOString(),
    pupil: {
      firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "",
      nationality: "Nigerian", previousSchool: "", currentClass: "", address: "", photoUploaded: false,
    },
    guardian: {
      name: parsed.data.fullName, relationship: "", phone: parsed.data.phone, email,
      occupation: "", address: "", emergencyContact: "", emergencyPhone: "",
    },
    documents: APPLICATION_DOCUMENT_REQUIREMENTS.map((d) => ({
      key: d.key, label: d.label, required: d.required, uploaded: false,
    })),
    applicationFeePaid: false,
    timeline: [{ at: new Date().toISOString(), status: "draft", note: "Application started.", actor: "Parent" }],
    ownerEmail: email,
  };
  db.applications.push(application);

  await setSessionCookie(userId);
  redirect("/admissions/apply?step=pupil");
}

/* --------------------------- shared authorisation ------------------------- */

/** The signed-in applicant's own draft application, or null. Never leaks another family's record. */
async function ownDraft(): Promise<Application | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const db = getDb();
  return (
    db.applications.find(
      (a) => a.ownerEmail.toLowerCase() === user.email.toLowerCase() && a.status === "draft",
    ) ?? null
  );
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
  intendedLevelId: z.string().refine((v) => ADMISSION_OPEN_LEVELS.includes(v), "Choose a class that is open"),
});

export async function savePupilStep(_prev: FormState, formData: FormData): Promise<FormState> {
  const application = await ownDraft();
  if (!application) return { ok: false, message: "We couldn't find your application. Please start again." };

  const parsed = pupilSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectErrors(parsed.error), message: "Please check the highlighted fields." };
  }

  application.pupil = {
    firstName: parsed.data.firstName,
    middleName: parsed.data.middleName,
    lastName: parsed.data.lastName,
    dateOfBirth: parsed.data.dateOfBirth,
    gender: parsed.data.gender as Gender,
    nationality: parsed.data.nationality,
    previousSchool: parsed.data.previousSchool,
    currentClass: parsed.data.currentClass,
    address: parsed.data.address,
    photoUploaded: application.pupil.photoUploaded,
  };
  application.intendedLevelId = parsed.data.intendedLevelId;

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
  const application = await ownDraft();
  if (!application) return { ok: false, message: "We couldn't find your application. Please start again." };

  const parsed = guardianSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: collectErrors(parsed.error), message: "Please check the highlighted fields." };
  }

  application.guardian = parsed.data;
  revalidatePath("/admissions/apply");
  redirect("/admissions/apply?step=documents");
}

/* ---------------------------- step 4: documents --------------------------- */

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg", "image/png", "image/webp", "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/**
 * Server-side upload validation. The demo records metadata only — a production
 * deployment would stream the file to private object storage and store the key.
 */
export async function uploadDocument(_prev: FormState, formData: FormData): Promise<FormState> {
  const application = await ownDraft();
  if (!application) return { ok: false, message: "We couldn't find your application. Please start again." };

  const key = String(formData.get("key") ?? "");
  const file = formData.get("file");
  const document = application.documents.find((d) => d.key === key);
  if (!document) return { ok: false, message: "That document is not part of this application." };

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Please choose a file to upload." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "This file is too large. Please choose a file smaller than 5 MB." };
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, message: "Please upload a JPG, PNG, WEBP, PDF or DOCX file." };
  }

  document.uploaded = true;
  document.fileName = file.name;
  document.uploadedAt = new Date().toISOString();
  if (key === "passport") application.pupil.photoUploaded = true;

  revalidatePath("/admissions/apply");
  return { ok: true, message: `${document.label} uploaded.` };
}

export async function removeDocument(_prev: FormState, formData: FormData): Promise<FormState> {
  const application = await ownDraft();
  if (!application) return { ok: false, message: "We couldn't find your application." };
  const document = application.documents.find((d) => d.key === String(formData.get("key") ?? ""));
  if (!document) return { ok: false, message: "That document is not part of this application." };
  document.uploaded = false;
  document.fileName = undefined;
  document.uploadedAt = undefined;
  revalidatePath("/admissions/apply");
  return { ok: true, message: `${document.label} removed.` };
}

export async function continueToReview(): Promise<void> {
  redirect("/admissions/apply?step=review");
}

/* ----------------------------- step 5: payment ---------------------------- */

/**
 * Demo payment. A production integration initialises a Paystack or Flutterwave
 * transaction here, and only marks the invoice paid after verifying the
 * transaction server-side against the provider's API — never on a client callback.
 */
export async function payApplicationFee(_prev: FormState, formData: FormData): Promise<FormState> {
  const application = await ownDraft();
  if (!application) return { ok: false, message: "We couldn't find your application." };

  const provider = String(formData.get("provider") ?? "paystack");
  if (!["paystack", "flutterwave", "bank_transfer"].includes(provider)) {
    return { ok: false, message: "Choose a valid payment method." };
  }

  application.applicationFeePaid = true;
  application.applicationFeeReference = `CHA-ADM-${Date.now().toString(36).toUpperCase()}`;
  revalidatePath("/admissions/apply");
  redirect("/admissions/apply?step=submit");
}

/* ----------------------------- step 6: submit ----------------------------- */

export async function submitApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const application = await ownDraft();
  if (!application) return { ok: false, message: "We couldn't find your application." };

  if (formData.get("declaration") !== "on") {
    return { ok: false, message: "Please confirm the declaration before submitting." };
  }

  const missingRequired = application.documents.filter((d) => d.required && !d.uploaded);
  const pupilComplete =
    application.pupil.firstName && application.pupil.lastName && application.pupil.dateOfBirth && application.pupil.gender;
  const guardianComplete = application.guardian.relationship && application.guardian.occupation;

  if (!pupilComplete) return { ok: false, message: "Pupil information is incomplete. Please review that step." };
  if (!guardianComplete) return { ok: false, message: "Parent information is incomplete. Please review that step." };
  if (missingRequired.length > 0) {
    return {
      ok: false,
      message: `Please upload the required documents: ${missingRequired.map((d) => d.label).join(", ")}.`,
    };
  }
  if (!application.applicationFeePaid) {
    return { ok: false, message: "The application fee has not been recorded yet." };
  }

  const now = new Date().toISOString();
  application.status = "submitted";
  application.submittedAt = now;
  application.timeline.push({
    at: now,
    status: "submitted",
    note: "Application submitted for review.",
    actor: "Parent",
  });

  const db = getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === application.ownerEmail.toLowerCase());
  if (user) {
    db.notifications.unshift({
      id: `ntf-${db.notifications.length + 1}`,
      userId: user.id,
      type: "admission_update",
      title: "Application received",
      body: `We have received application ${application.applicationNo}. Our admissions team will review it shortly.`,
      href: "/admissions/status",
      createdAt: now,
      read: false,
    });
  }

  db.auditLogs.unshift({
    id: `aud-${db.auditLogs.length + 1}`,
    actorId: user?.id ?? "anonymous",
    actorName: application.guardian.name,
    action: "Submitted admission application",
    entity: "Application",
    entityId: application.id,
    newValue: application.applicationNo,
    at: now,
    ip: "—",
    device: "Web",
  });

  revalidatePath("/admissions/status");
  redirect(`/admissions/status?ref=${application.applicationNo}`);
}

/* --------------------------- admin decision flow -------------------------- */

const DECISION_STATUSES: ApplicationStatus[] = [
  "under_review", "documents_required", "assessment_scheduled", "assessment_completed",
  "interview_scheduled", "accepted", "conditionally_accepted", "waitlisted", "not_accepted",
  "withdrawn", "enrolled",
];

export async function updateApplicationStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  const allowed = ["super_admin", "admin", "headteacher", "admissions_officer"];
  if (!user || !user.roles.some((r) => allowed.includes(r))) {
    return { ok: false, message: "You don't have permission to change an application." };
  }

  const db = getDb();
  const application = db.applications.find((a) => a.id === String(formData.get("applicationId") ?? ""));
  if (!application) return { ok: false, message: "Application not found." };

  const status = String(formData.get("status") ?? "") as ApplicationStatus;
  if (!DECISION_STATUSES.includes(status)) return { ok: false, message: "Choose a valid status." };

  const note = String(formData.get("note") ?? "").trim();
  const previous = application.status;
  const now = DEMO_TODAY.toISOString();

  application.status = status;
  application.decisionNote = note || application.decisionNote;
  if (["accepted", "conditionally_accepted", "not_accepted", "waitlisted"].includes(status)) {
    application.decidedAt = now;
  }
  application.timeline.push({
    at: now,
    status,
    note: note || `Status changed to ${status.replace(/_/g, " ")}.`,
    actor: user.name,
  });

  const applicantUser = db.users.find((u) => u.email.toLowerCase() === application.ownerEmail.toLowerCase());
  if (applicantUser) {
    db.notifications.unshift({
      id: `ntf-${db.notifications.length + 1}`,
      userId: applicantUser.id,
      type: "admission_update",
      title: "Your application status changed",
      body: `Application ${application.applicationNo} is now: ${status.replace(/_/g, " ")}.`,
      href: "/admissions/status",
      createdAt: now,
      read: false,
    });
  }

  db.auditLogs.unshift({
    id: `aud-${db.auditLogs.length + 1}`,
    actorId: user.id,
    actorName: user.name,
    action: "Changed application status",
    entity: "Application",
    entityId: application.id,
    previousValue: previous,
    newValue: status,
    at: now,
    ip: "—",
    device: "Web",
  });

  revalidatePath("/portal/admin/admissions");
  return { ok: true, message: "Application updated." };
}

export const initialFormState = EMPTY;
