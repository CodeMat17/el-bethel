import "server-only";

import { cache } from "react";
import { forbidden, redirect, unauthorized } from "next/navigation";

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

/**
 * Each portal belongs to one role; only the super admin may enter every portal.
 * Anyone else who wanders into the wrong portal is sent back to their own.
 */
async function requirePortal(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasRole(user, "super_admin", ...roles)) redirect(homeForUser(user));
  return user;
}

export const requireAdmin = () => requirePortal("admin");
export const requireSiteAdmin = () => requirePortal("site_admin");
export const requireSuperAdmin = () => requireRole("super_admin");
export const requireTeacher = () => requirePortal("teacher");
export const requireParent = () => requirePortal("parent");
export const requirePupil = () => requirePortal("pupil");

/** Where a signed-in person with no portal role, or no linked active account, is sent. */
export const NO_ACCESS = "/portal/no-access";

/** Portal a user should land on after signing in. */
export function homeForUser(user: SessionUser): string {
  if (user.roles.some((r) => ADMIN_ROLES.includes(r))) return "/portal/admin";
  if (user.roles.includes("site_admin")) return "/portal/site";
  if (user.roles.includes("teacher")) return "/portal/teacher";
  if (user.roles.includes("parent")) return "/portal/parent";
  if (user.roles.includes("pupil")) return "/portal/pupil";
  return NO_ACCESS;
}
