import { randomBytes } from "node:crypto";
import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { getSessionUser, hasRole } from "@/lib/school/auth";
import { tryMutation } from "@/lib/school/convex";
import { PREVIEW_COOKIE } from "@/lib/school/site-content";

/** Website pages an editor may preview. Anything else is refused (no open redirects). */
const PREVIEWABLE = new Set(["/", "/about", "/about/team", "/academics", "/admissions", "/school-life", "/alumni", "/contact", "/privacy", "/terms"]);

/**
 * Opens the public website with the editor's drafts. Lives under /portal so
 * Clerk identifies the editor; Convex issues the token the website reads drafts with.
 */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path") ?? "/";
  if (!PREVIEWABLE.has(path)) return new Response("That page cannot be previewed.", { status: 400 });

  const user = await getSessionUser();
  if (!user || !hasRole(user, "super_admin", "site_admin", "admin")) {
    return new Response("Only administrators can preview drafts.", { status: 403 });
  }

  const token = randomBytes(32).toString("hex");
  const started = await tryMutation(api.cms.startPreview, { token });
  if (!started.ok) return new Response(started.message, { status: 403 });

  (await cookies()).set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(started.data.expiresAt),
  });
  (await draftMode()).enable();
  redirect(path);
}
