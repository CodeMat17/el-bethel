"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ADMISSION_OPEN_LEVELS } from "@/lib/school/config";
import { DEMO_TODAY } from "@/lib/school/seed";
import { getDb } from "@/lib/school/store";

export interface PublicFormState {
  ok: boolean;
  message?: string;
  reference?: string;
  fieldErrors?: Record<string, string>;
}

function collect(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  category: z.enum(["admissions", "fees", "academics", "transport", "general"], {
    message: "Choose a category",
  }),
  message: z.string().trim().min(10, "Please tell us a little more (at least 10 characters)").max(2000, "Please keep your message under 2000 characters"),
});

export async function submitEnquiry(_prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const parsed = enquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: collect(parsed.error), message: "Please check the highlighted fields." };
  }

  const db = getDb();
  db.enquiries.unshift({
    id: `enq-${db.enquiries.length + 1}-${Date.now().toString(36)}`,
    ...parsed.data,
    status: "new",
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/portal/admin/enquiries");
  return {
    ok: true,
    message: "Thank you — your enquiry has reached our school office. We reply within one working day.",
  };
}

const tourSchema = z.object({
  parentName: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  preferredDate: z.string().trim().min(1, "Choose a preferred date"),
  preferredTime: z.string().trim().min(1, "Choose a preferred time"),
  visitors: z.coerce.number().int().min(1, "At least one visitor").max(8, "Please contact us directly for groups over eight"),
  intendedLevelId: z.string().refine((v) => ADMISSION_OPEN_LEVELS.includes(v), "Choose a class"),
  mode: z.enum(["physical", "virtual", "consultation"], { message: "Choose a visit type" }),
  notes: z.string().trim().max(1000).optional().default(""),
});

export async function bookTour(_prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const parsed = tourSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: collect(parsed.error), message: "Please check the highlighted fields." };
  }

  const chosen = new Date(parsed.data.preferredDate);
  if (Number.isNaN(chosen.getTime())) {
    return { ok: false, fieldErrors: { preferredDate: "Choose a valid date" } };
  }
  const day = chosen.getUTCDay();
  if (day === 0 || day === 6) {
    return { ok: false, fieldErrors: { preferredDate: "Tours run Monday to Friday. Please choose a weekday." } };
  }

  const db = getDb();
  const reference = `TOUR-2026-${String(db.tourBookings.length + 1).padStart(4, "0")}`;
  db.tourBookings.unshift({
    id: `tour-${db.tourBookings.length + 1}-${Date.now().toString(36)}`,
    reference,
    parentName: parsed.data.parentName,
    phone: parsed.data.phone,
    email: parsed.data.email,
    preferredDate: parsed.data.preferredDate,
    preferredTime: parsed.data.preferredTime,
    visitors: parsed.data.visitors,
    intendedLevelId: parsed.data.intendedLevelId,
    mode: parsed.data.mode,
    notes: parsed.data.notes,
    status: "requested",
    createdAt: DEMO_TODAY.toISOString(),
  });

  revalidatePath("/portal/admin/tours");
  return {
    ok: true,
    reference,
    message: `Your visit request has been received. Reference ${reference}. We will confirm by phone or email within one working day.`,
  };
}

const applicationSchema = z.object({
  vacancySlug: z.string().trim().min(1),
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  message: z.string().trim().min(20, "Tell us a little about yourself (at least 20 characters)"),
});

export async function submitJobApplication(
  _prev: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: collect(parsed.error), message: "Please check the highlighted fields." };
  }

  const cv = formData.get("cv");
  if (!(cv instanceof File) || cv.size === 0) {
    return { ok: false, message: "Please attach your CV." };
  }
  if (cv.size > 5 * 1024 * 1024) {
    return { ok: false, message: "Your CV is too large. Please attach a file smaller than 5 MB." };
  }
  const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (!allowed.includes(cv.type)) {
    return { ok: false, message: "Please attach your CV as a PDF or DOCX file." };
  }

  const db = getDb();
  db.enquiries.unshift({
    id: `enq-job-${db.enquiries.length + 1}-${Date.now().toString(36)}`,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    category: "general",
    message: `Job application for ${parsed.data.vacancySlug}. CV: ${cv.name}. ${parsed.data.message}`,
    status: "new",
    createdAt: DEMO_TODAY.toISOString(),
  });

  revalidatePath("/portal/admin/enquiries");
  return {
    ok: true,
    message: "Thank you — your application has been received. We contact shortlisted candidates within two weeks of the closing date.",
  };
}
