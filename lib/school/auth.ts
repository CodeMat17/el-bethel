import "server-only";

import { cache } from "react";
import { forbidden, unauthorized } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { getConvexToken, query } from "./convex";
import type { Role, SessionUser } from "./types";

/**
 * Clerk authenticates (who is this?); Convex authorizes (what may they do?).
 * The signed-in user and their roles are read from Convex on every request, so
 * the browser can never grant itself a role. These guards only decide which
 * portal page to render — every query and mutation re-checks in Convex.
 */

export const ADMIN_ROLES: Role[] = ["super_admin", "admin"];

/** The signed-in, provisioned, active user — or null. Cached per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!(await getConvexToken())) return null;
  return await query(api.users.me, {});
});

export function hasRole(user: SessionUser | null, ...roles: Role[]): boolean {
  if (!user) return false;
  return user.roles.some((r) => roles.includes(r));
}

export const isAdmin = (user: SessionUser | null) => hasRole(user, ...ADMIN_ROLES);
export const isSuperAdmin = (user: SessionUser | null) => hasRole(user, "super_admin");

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) unauthorized();
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasRole(user, ...roles)) forbidden();
  return user;
}

export const requireAdmin = () => requireRole(...ADMIN_ROLES);
export const requireSuperAdmin = () => requireRole("super_admin");
export const requireTeacher = () => requireRole("teacher", ...ADMIN_ROLES);
export const requireParent = () => requireRole("parent");
export const requirePupil = () => requireRole("pupil");

/** Portal a user should land on after signing in. */
export function homeForUser(user: SessionUser): string {
  if (user.roles.some((r) => ADMIN_ROLES.includes(r))) return "/portal/admin";
  if (user.roles.includes("teacher")) return "/portal/teacher";
  if (user.roles.includes("parent")) return "/portal/parent";
  if (user.roles.includes("pupil")) return "/portal/pupil";
  return "/";
}
