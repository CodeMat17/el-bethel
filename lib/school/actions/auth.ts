"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearSessionCookie,
  getSessionUser,
  homeForUser,
  setSessionCookie,
  verifyCredentials,
} from "@/lib/school/auth";
import { getDb } from "@/lib/school/store";

export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, fieldErrors, message: "Please check the form and try again." };
  }

  const userId = verifyCredentials(parsed.data.email, parsed.data.password);
  if (!userId) {
    // Deliberately vague: never reveal whether an account exists.
    return { ok: false, message: "We couldn't sign you in with those details. Please try again." };
  }

  const user = getDb().users.find((u) => u.id === userId);
  if (user) user.lastLoginAt = new Date().toISOString();

  await setSessionCookie(userId);
  const session = await getSessionUser();
  redirect(session ? homeForUser(session) : "/");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login?signedOut=1");
}

/** One-click demo sign-in used by the login page's demo account picker. */
export async function demoLoginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const userId = verifyCredentials(email, "crestwood");
  if (!userId) redirect("/login?error=1");
  await setSessionCookie(userId);
  const session = await getSessionUser();
  redirect(session ? homeForUser(session) : "/");
}
