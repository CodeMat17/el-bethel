import { ConvexError } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { RoleValue } from "../validators";

/**
 * Authorization lives here. Every public query and mutation resolves the caller
 * from the Clerk JWT and checks it against the `users` table — the browser and
 * the Next.js server are never trusted to say who someone is or what they may do.
 */

type Ctx = QueryCtx | MutationCtx;
export type Viewer = Doc<"users">;

export type ErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID" | "CONFLICT";

export function fail(code: ErrorCode, message: string): never {
  throw new ConvexError({ code, message });
}

export const ADMIN_ROLES: RoleValue[] = ["super_admin", "admin"];

export function hasRole(user: Viewer | null, ...roles: RoleValue[]): boolean {
  return Boolean(user?.roles.some((r) => roles.includes(r)));
}

export const isAdmin = (user: Viewer | null) => hasRole(user, ...ADMIN_ROLES);
export const isSuperAdmin = (user: Viewer | null) => hasRole(user, "super_admin");

/** The signed-in, active user — or null. */
export async function getViewer(ctx: Ctx): Promise<Viewer | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
    .unique();
  if (!user || !user.active) return null;
  return user;
}

export async function requireViewer(ctx: Ctx): Promise<Viewer> {
  const user = await getViewer(ctx);
  if (!user) fail("UNAUTHENTICATED", "Please sign in to continue.");
  return user;
}

export async function requireRole(ctx: Ctx, ...roles: RoleValue[]): Promise<Viewer> {
  const user = await requireViewer(ctx);
  if (!hasRole(user, ...roles)) fail("FORBIDDEN", "You do not have permission to do that.");
  return user;
}

export const requireAdmin = (ctx: Ctx) => requireRole(ctx, ...ADMIN_ROLES);
export const requireSuperAdmin = (ctx: Ctx) => requireRole(ctx, "super_admin");
export const requireStaff = (ctx: Ctx) => requireRole(ctx, "teacher", ...ADMIN_ROLES);

/** Website content editors. Ordinary administrators are deliberately not included. */
export const SITE_ROLES: RoleValue[] = ["super_admin", "site_admin"];
export const requireSiteAdmin = (ctx: Ctx) => requireRole(ctx, ...SITE_ROLES);

/** The school calendar is run by the office as well as the website team. */
export const requireEventEditor = (ctx: Ctx) => requireRole(ctx, ...SITE_ROLES, ...ADMIN_ROLES);

/** Website documents administrators also edit from their own portal: the fee table and admission rules. */
export const ADMIN_CMS_KEYS: readonly string[] = ["fees"];

/** Site editors may edit every website document; administrators only the ones in ADMIN_CMS_KEYS. */
export async function requireCmsEditor(ctx: Ctx, key: string): Promise<Viewer> {
  const user = await requireViewer(ctx);
  if (hasRole(user, ...SITE_ROLES)) return user;
  if (isAdmin(user) && ADMIN_CMS_KEYS.includes(key)) return user;
  return fail("FORBIDDEN", "You do not have permission to do that.");
}

/* ------------------------------ relationships ----------------------------- */

/** Classes a teacher teaches a subject in, or is class teacher of. */
export async function teacherClassIds(ctx: Ctx, teacherId: Id<"teachers">): Promise<Set<Id<"classes">>> {
  const [teaching, classTeacherOf] = await Promise.all([
    ctx.db
      .query("teachingAssignments")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
      .collect(),
    ctx.db
      .query("classes")
      .withIndex("by_class_teacher", (q) => q.eq("classTeacherId", teacherId))
      .collect(),
  ]);
  return new Set([...teaching.map((t) => t.classId), ...classTeacherOf.map((c) => c._id)]);
}

export async function parentStudentIds(ctx: Ctx, parentId: Id<"parents">): Promise<Id<"students">[]> {
  const links = await ctx.db
    .query("guardianships")
    .withIndex("by_parent", (q) => q.eq("parentId", parentId))
    .collect();
  return links.map((l) => l.studentId);
}

/**
 * Pupil records — the single most important boundary in the platform. A parent
 * may only reach their own children, a pupil only themselves, a teacher only
 * pupils in a class they teach.
 */
export async function canAccessStudent(ctx: Ctx, viewer: Viewer, studentId: Id<"students">): Promise<boolean> {
  if (isAdmin(viewer)) return true;
  if (viewer.studentId && viewer.studentId === studentId) return true;
  if (viewer.parentId) {
    const link = await ctx.db
      .query("guardianships")
      .withIndex("by_parent_student", (q) => q.eq("parentId", viewer.parentId!).eq("studentId", studentId))
      .unique();
    if (link) return true;
  }
  if (viewer.teacherId) {
    const student = await ctx.db.get(studentId);
    if (student && (await teacherClassIds(ctx, viewer.teacherId)).has(student.classId)) return true;
  }
  return false;
}

export async function assertStudentAccess(ctx: Ctx, viewer: Viewer, studentId: Id<"students">) {
  if (!(await canAccessStudent(ctx, viewer, studentId))) {
    fail("FORBIDDEN", "You do not have access to this pupil's records.");
  }
}

export async function canAccessClass(ctx: Ctx, viewer: Viewer, classId: Id<"classes">): Promise<boolean> {
  if (isAdmin(viewer)) return true;
  if (viewer.teacherId && (await teacherClassIds(ctx, viewer.teacherId)).has(classId)) return true;
  if (viewer.studentId) {
    const student = await ctx.db.get(viewer.studentId);
    if (student?.classId === classId) return true;
  }
  if (viewer.parentId) {
    for (const sid of await parentStudentIds(ctx, viewer.parentId)) {
      const child = await ctx.db.get(sid);
      if (child?.classId === classId) return true;
    }
  }
  return false;
}

export async function assertClassAccess(ctx: Ctx, viewer: Viewer, classId: Id<"classes">) {
  if (!(await canAccessClass(ctx, viewer, classId))) {
    fail("FORBIDDEN", "You do not have access to this class.");
  }
}

/** Teachers may manage a class only if they teach in it (or are its class teacher). */
export async function assertTeachesClass(ctx: Ctx, viewer: Viewer, classId: Id<"classes">) {
  if (isAdmin(viewer)) return;
  if (!viewer.teacherId || !(await teacherClassIds(ctx, viewer.teacherId)).has(classId)) {
    fail("FORBIDDEN", "You do not teach this class.");
  }
}

/** True if the viewer teaches this subject in this class (or is its class teacher). */
export async function teachesSubject(
  ctx: Ctx,
  viewer: Viewer,
  classId: Id<"classes">,
  subjectId: Id<"subjects">,
): Promise<boolean> {
  if (isAdmin(viewer)) return true;
  if (!viewer.teacherId) return false;
  const cls = await ctx.db.get(classId);
  if (cls?.classTeacherId === viewer.teacherId) return true;
  const row = await ctx.db
    .query("teachingAssignments")
    .withIndex("by_class_subject", (q) => q.eq("classId", classId).eq("subjectId", subjectId))
    .first();
  return row?.teacherId === viewer.teacherId;
}

export async function assertTeachesSubject(
  ctx: Ctx,
  viewer: Viewer,
  classId: Id<"classes">,
  subjectId: Id<"subjects">,
) {
  if (!(await teachesSubject(ctx, viewer, classId, subjectId))) {
    fail("FORBIDDEN", "You do not teach this subject in this class.");
  }
}

/** Class teachers (and admins) publish a class's term results. */
export async function assertCanPublishClassResults(ctx: Ctx, viewer: Viewer, classId: Id<"classes">) {
  if (isAdmin(viewer)) return;
  const cls = await ctx.db.get(classId);
  if (!viewer.teacherId || cls?.classTeacherId !== viewer.teacherId) {
    fail("FORBIDDEN", "Only the class teacher or an administrator can publish this class's results.");
  }
}
