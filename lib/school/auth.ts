import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { forbidden, unauthorized } from "next/navigation";

import { getDb } from "./store";
import type { ID, Role, SessionUser } from "./types";

const COOKIE_NAME = "cha_session";
const MAX_AGE_SECONDS = 60 * 60 * 8;

/**
 * Sessions are signed server-side. The browser only ever holds an opaque,
 * tamper-evident token — roles are re-read from the database on every request,
 * so a client can never elevate its own privileges by editing a cookie.
 */
function secret(): string {
  return process.env.SESSION_SECRET ?? "elbethel-heights-development-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createToken(userId: ID): string {
  const payload = `${userId}.${Date.now()}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

function verifyToken(token: string): ID | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!safeEqual(sign(payload), signature)) return null;
  const [userId, issued] = payload.split(".");
  if (!userId || !issued) return null;
  if (Date.now() - Number(issued) > MAX_AGE_SECONDS * 1000) return null;
  return userId;
}

export async function setSessionCookie(userId: ID): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, createToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** The signed-in user, or null. Never throws. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const userId = verifyToken(token);
  if (!userId) return null;
  const user = getDb().users.find((u) => u.id === userId && u.active);
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    avatarSeed: user.avatarSeed,
    teacherId: user.teacherId,
    parentId: user.parentId,
    studentId: user.studentId,
  };
}

/** Verify email + password. Returns the user id on success. */
export function verifyCredentials(email: string, password: string): ID | null {
  const user = getDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || !user.active) return null;
  if (!safeEqual(user.password, password)) return null;
  return user.id;
}

export function hasRole(user: SessionUser | null, ...roles: Role[]): boolean {
  if (!user) return false;
  return user.roles.some((r) => roles.includes(r));
}

export const ADMIN_ROLES: Role[] = [
  "super_admin",
  "admin",
  "headteacher",
  "deputy_headteacher",
  "accountant",
  "admissions_officer",
  "librarian",
];

/** Server-side guard. Redirects to the unauthorized/forbidden boundary. */
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
export const requireTeacher = () => requireRole("teacher", ...ADMIN_ROLES);
export const requireParent = () => requireRole("parent");
export const requirePupil = () => requireRole("pupil");

/** Portal a user should land on after signing in. */
export function homeForUser(user: SessionUser): string {
  if (user.roles.some((r) => ADMIN_ROLES.includes(r))) return "/portal/admin";
  if (user.roles.includes("teacher")) return "/portal/teacher";
  if (user.roles.includes("parent")) return "/portal/parent";
  if (user.roles.includes("pupil")) return "/portal/pupil";
  if (user.roles.includes("applicant")) return "/admissions/status";
  return "/";
}

/**
 * Authorization for pupil records — the single most important boundary in the
 * platform. A parent may only reach their own children; a pupil only themselves;
 * a teacher only pupils in a class they teach.
 */
export function canAccessStudent(user: SessionUser, studentId: ID): boolean {
  const db = getDb();
  if (user.roles.some((r) => ADMIN_ROLES.includes(r))) return true;
  if (user.studentId) return user.studentId === studentId;
  if (user.parentId) {
    const parent = db.parents.find((p) => p.id === user.parentId);
    return Boolean(parent?.studentIds.includes(studentId));
  }
  if (user.teacherId) {
    const teacher = db.teachers.find((t) => t.id === user.teacherId);
    const student = db.students.find((s) => s.id === studentId);
    return Boolean(teacher && student && teacher.classIds.includes(student.classId));
  }
  return false;
}

export function assertStudentAccess(user: SessionUser, studentId: ID): void {
  if (!canAccessStudent(user, studentId)) forbidden();
}

export function canAccessClass(user: SessionUser, classId: ID): boolean {
  const db = getDb();
  if (user.roles.some((r) => ADMIN_ROLES.includes(r))) return true;
  if (user.teacherId) {
    const teacher = db.teachers.find((t) => t.id === user.teacherId);
    return Boolean(teacher?.classIds.includes(classId));
  }
  if (user.studentId) {
    const student = db.students.find((s) => s.id === user.studentId);
    return student?.classId === classId;
  }
  if (user.parentId) {
    const parent = db.parents.find((p) => p.id === user.parentId);
    return Boolean(
      parent?.studentIds.some((sid) => db.students.find((s) => s.id === sid)?.classId === classId),
    );
  }
  return false;
}

export function assertClassAccess(user: SessionUser, classId: ID): void {
  if (!canAccessClass(user, classId)) forbidden();
}
