"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { api } from "@/convex/_generated/api";
import { convexErrorMessage, publicMutation } from "@/lib/school/convex";

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
  category: z.enum(["admissions", "fees", "academics", "general"], {
    message: "Choose a category",
  }),
  message: z.string().trim().min(10, "Please tell us a little more (at least 10 characters)").max(2000, "Please keep your message under 2000 characters"),
});

export async function submitEnquiry(_prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const parsed = enquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: collect(parsed.error), message: "Please check the highlighted fields." };
  }

  try {
    await publicMutation(api.office.submitEnquiry, parsed.data);
  } catch (error) {
    return { ok: false, message: convexErrorMessage(error, "We couldn't send your enquiry. Please try again.") };
  }

  revalidatePath("/portal/admin/enquiries");
  return {
    ok: true,
    message: "Thank you — your enquiry has reached our school office. We reply within one working day.",
  };
}
