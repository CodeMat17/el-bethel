"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { destroyAsset } from "@/lib/school/cloudinary";
import { query, tryMutation } from "@/lib/school/convex";
import type { ApplicationStatus, CloudMedia, Role } from "@/lib/school/types";

/**
 * Administrator actions. Every one forwards to a Convex mutation that checks the
 * caller is an administrator (or super administrator, for admin accounts); Clerk
 * is only touched after Convex has agreed.
 */

export interface AdminResult {
  ok: boolean;
  message?: string;
  id?: string;
}

const str = (f: FormData, key: string) => String(f.get(key) ?? "").trim();
const opt = (f: FormData, key: string) => str(f, key) || undefined;
const num = (f: FormData, key: string) => Number(str(f, key));
const bool = (f: FormData, key: string) => f.get(key) === "on" || f.get(key) === "true";
const list = (f: FormData, key: string) =>
  str(f, key)
    .split(/\r?\n|,/)
    .map((x) => x.trim())
    .filter(Boolean);

function clerkMessage(error: unknown): string {
  if (isClerkAPIResponseError(error)) {
    const first = error.errors[0];
    return first?.longMessage ?? first?.message ?? "Clerk rejected the request.";
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

function done(message: string, ...paths: string[]): AdminResult {
  for (const path of paths) revalidatePath(path);
  return { ok: true, message };
}

/* --------------------------------- accounts ------------------------------- */

/**
 * Create a sign-in: reserve the account in Convex (which checks permissions and
 * the username), create the Clerk user, then link the two.
 */
export async function createLogin(formData: FormData): Promise<AdminResult> {
  const name = str(formData, "name");
  const username = str(formData, "username").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const email = str(formData, "email").toLowerCase();
  const roles = formData.getAll("roles").map(String) as Role[];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Enter a valid email address to sign in with." };
  if (password.length < 8) return { ok: false, message: "The password must be at least 8 characters." };

  const prepared = await tryMutation(api.users.prepareAccount, {
    userId: opt(formData, "userId") as Id<"users"> | undefined,
    name,
    username,
    email,
    roles,
    studentId: opt(formData, "studentId") as Id<"students"> | undefined,
    teacherId: opt(formData, "teacherId") as Id<"teachers"> | undefined,
    parentId: opt(formData, "parentId") as Id<"parents"> | undefined,
  });
  if (!prepared.ok) return { ok: false, message: prepared.message };
  const { userId, created } = prepared.data;

  const [firstName, ...rest] = name.replace(/^(Mrs|Mr|Miss|Dr|Mme|Prof)\.?\s+/i, "").split(/\s+/);
  let clerkUserId: string | null = null;
  try {
    const client = await clerkClient();
    const user = await client.users.createUser({
      username,
      password,
      firstName,
      lastName: rest.join(" ") || undefined,
      emailAddress: [email],
      externalId: userId,
    });
    clerkUserId = user.id;
  } catch (error) {
    await tryMutation(api.users.discardPreparedAccount, { userId, created });
    return { ok: false, message: clerkMessage(error) };
  }

  const linked = await tryMutation(api.users.linkClerkUser, { userId, clerkUserId });
  if (!linked.ok) {
    try {
      await (await clerkClient()).users.deleteUser(clerkUserId);
    } catch (error) {
      console.error("Could not roll back Clerk user", clerkUserId, error);
    }
    await tryMutation(api.users.discardPreparedAccount, { userId, created });
    return { ok: false, message: linked.message };
  }
  return { ...done(`Sign-in created. ${name} can now sign in with ${email}.`, "/portal/admin", "/portal/admin/users"), id: userId };
}

export async function resetPassword(formData: FormData): Promise<AdminResult> {
  const userId = str(formData, "userId") as Id<"users">;
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { ok: false, message: "The password must be at least 8 characters." };
  let account;
  try {
    account = await query(api.users.managedAccount, { userId });
  } catch {
    return { ok: false, message: "You can't manage this account." };
  }
  if (!account.clerkUserId) return { ok: false, message: "This account has no sign-in yet." };
  try {
    await (await clerkClient()).users.updateUser(account.clerkUserId, { password, signOutOfOtherSessions: true });
  } catch (error) {
    return { ok: false, message: clerkMessage(error) };
  }
  await tryMutation(api.users.recordPasswordReset, { userId });
  return done(`Password changed for ${account.name}. Give them the new password in person.`, "/portal/admin/users");
}

export async function setAccountActive(userId: string, active: boolean): Promise<AdminResult> {
  const result = await tryMutation(api.users.setActive, { userId: userId as Id<"users">, active });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data.clerkUserId) {
    try {
      const client = await clerkClient();
      if (active) await client.users.unbanUser(result.data.clerkUserId);
      else await client.users.banUser(result.data.clerkUserId);
    } catch (error) {
      console.error("Clerk ban/unban failed", error);
    }
  }
  return done(active ? "Account enabled." : "Account disabled. They have been signed out everywhere.", "/portal/admin/users");
}

export async function updateRoles(formData: FormData): Promise<AdminResult> {
  const result = await tryMutation(api.users.updateRoles, {
    userId: str(formData, "userId") as Id<"users">,
    roles: formData.getAll("roles").map(String) as Role[],
  });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Roles updated.", "/portal/admin/users");
}

/* --------------------------------- people --------------------------------- */

function studentFields(f: FormData) {
  return {
    firstName: str(f, "firstName"),
    middleName: opt(f, "middleName"),
    lastName: str(f, "lastName"),
    dateOfBirth: str(f, "dateOfBirth"),
    gender: (str(f, "gender") === "Female" ? "Female" : "Male") as "Male" | "Female",
    nationality: str(f, "nationality") || "Nigerian",
    address: str(f, "address"),
    classId: str(f, "classId") as Id<"classes">,
    house: (str(f, "house") || "Emerald") as "Emerald" | "Sapphire" | "Ruby" | "Amber",
    bloodGroup: str(f, "bloodGroup"),
    medicalNotes: opt(f, "medicalNotes"),
    admissionNo: opt(f, "admissionNo"),
  };
}

export async function saveStudent(formData: FormData): Promise<AdminResult> {
  const id = opt(formData, "id");
  const fields = studentFields(formData);
  if (!fields.classId) return { ok: false, message: "Choose a class." };
  const result = id
    ? await tryMutation(api.people.updateStudent, { studentId: id as Id<"students">, ...fields })
    : await tryMutation(api.people.createStudent, {
        ...fields,
        parentIds: formData.getAll("parentIds").map(String).filter(Boolean) as Id<"parents">[],
      });
  if (!result.ok) return { ok: false, message: result.message };
  return { ...done(id ? "Pupil record updated." : "Pupil enrolled.", "/portal/admin/students"), id: id ?? String(result.data) };
}

export async function setStudentStatus(studentId: string, status: "active" | "graduated" | "transferred" | "archived"): Promise<AdminResult> {
  const result = await tryMutation(api.people.setStudentStatus, { studentId: studentId as Id<"students">, status });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data.clerkUserId) {
    try {
      await (await clerkClient()).users.banUser(result.data.clerkUserId);
    } catch (error) {
      console.error("Clerk ban failed", error);
    }
  }
  return done(`Pupil marked as ${status}.`, "/portal/admin/students");
}

export async function linkGuardian(studentId: string, parentId: string, linked: boolean): Promise<AdminResult> {
  const result = await tryMutation(api.people.linkGuardian, {
    studentId: studentId as Id<"students">,
    parentId: parentId as Id<"parents">,
    linked,
  });
  if (!result.ok) return { ok: false, message: result.message };
  return done(linked ? "Parent linked." : "Parent unlinked.", "/portal/admin/students", "/portal/admin/parents");
}

export async function saveParent(formData: FormData): Promise<AdminResult> {
  const id = opt(formData, "id");
  const fields = {
    title: str(formData, "title"),
    firstName: str(formData, "firstName"),
    lastName: str(formData, "lastName"),
    relationship: (str(formData, "relationship") || "Guardian") as "Father" | "Mother" | "Guardian",
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    occupation: str(formData, "occupation"),
    address: str(formData, "address"),
    emergencyContactName: str(formData, "emergencyContactName"),
    emergencyContactPhone: str(formData, "emergencyContactPhone"),
  };
  const result = id
    ? await tryMutation(api.people.updateParent, { parentId: id as Id<"parents">, ...fields })
    : await tryMutation(api.people.createParent, {
        ...fields,
        studentIds: formData.getAll("studentIds").map(String).filter(Boolean) as Id<"students">[],
      });
  if (!result.ok) return { ok: false, message: result.message };
  return { ...done(id ? "Parent updated." : "Parent added.", "/portal/admin/parents"), id: id ?? String(result.data) };
}

export async function saveTeacher(formData: FormData, photo?: CloudMedia): Promise<AdminResult> {
  const id = opt(formData, "id");
  const fields = {
    title: str(formData, "title"),
    firstName: str(formData, "firstName"),
    lastName: str(formData, "lastName"),
    position: str(formData, "position"),
    department: str(formData, "department"),
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    qualifications: list(formData, "qualifications"),
    experienceYears: num(formData, "experienceYears") || 0,
    bio: str(formData, "bio"),
    featured: bool(formData, "featured"),
    photo,
  };
  if (id) {
    const result = await tryMutation(api.people.updateTeacher, {
      teacherId: id as Id<"teachers">,
      ...fields,
      active: bool(formData, "active"),
    });
    if (!result.ok) return { ok: false, message: result.message };
    if (result.data.clerkUserId) {
      try {
        await (await clerkClient()).users.banUser(result.data.clerkUserId);
      } catch (error) {
        console.error("Clerk ban failed", error);
      }
    }
    return { ...done("Staff record updated.", "/portal/admin/teachers", "/about/teachers"), id };
  }
  const result = await tryMutation(api.people.createTeacher, fields);
  if (!result.ok) return { ok: false, message: result.message };
  return { ...done("Staff member added.", "/portal/admin/teachers", "/about/teachers"), id: String(result.data) };
}

/* --------------------------------- academics ------------------------------ */

export async function saveClass(formData: FormData): Promise<AdminResult> {
  const result = await tryMutation(api.academics.saveClass, {
    id: opt(formData, "id") as Id<"classes"> | undefined,
    levelId: str(formData, "levelId"),
    section: str(formData, "section"),
    name: str(formData, "name"),
    classTeacherId: opt(formData, "classTeacherId") as Id<"teachers"> | undefined,
    capacity: num(formData, "capacity") || 30,
    room: str(formData, "room"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Class saved.", "/portal/admin/classes");
}

export async function removeClass(classId: string): Promise<AdminResult> {
  const result = await tryMutation(api.academics.removeClass, { id: classId as Id<"classes"> });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Class deleted.", "/portal/admin/classes");
}

export async function setSubjectTeacher(classId: string, subjectId: string, teacherId: string): Promise<AdminResult> {
  const result = await tryMutation(api.academics.setSubjectTeacher, {
    classId: classId as Id<"classes">,
    subjectId: subjectId as Id<"subjects">,
    teacherId: teacherId ? (teacherId as Id<"teachers">) : undefined,
  });
  if (!result.ok) return { ok: false, message: result.message };
  return done(teacherId ? "Subject teacher assigned." : "Subject teacher removed.", "/portal/admin/classes");
}

export async function saveSubject(formData: FormData): Promise<AdminResult> {
  const result = await tryMutation(api.academics.saveSubject, {
    id: opt(formData, "id") as Id<"subjects"> | undefined,
    name: str(formData, "name"),
    code: str(formData, "code"),
    group: str(formData, "group") === "additional" ? "additional" : "core",
    levelIds: formData.getAll("levelIds").map(String),
  });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Subject saved.", "/portal/admin/subjects", "/academics/subjects");
}

export async function removeSubject(subjectId: string): Promise<AdminResult> {
  const result = await tryMutation(api.academics.removeSubject, { id: subjectId as Id<"subjects"> });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Subject deleted.", "/portal/admin/subjects");
}

export async function saveSession(formData: FormData): Promise<AdminResult> {
  const result = await tryMutation(api.academics.saveSession, {
    id: opt(formData, "id") as Id<"academicSessions"> | undefined,
    name: str(formData, "name"),
    startDate: str(formData, "startDate"),
    endDate: str(formData, "endDate"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Session saved.", "/portal/admin/sessions");
}

export async function saveTerm(formData: FormData): Promise<AdminResult> {
  const key = str(formData, "key");
  const result = await tryMutation(api.academics.saveTerm, {
    id: opt(formData, "id") as Id<"terms"> | undefined,
    sessionId: str(formData, "sessionId") as Id<"academicSessions">,
    key: key === "second" ? "second" : key === "third" ? "third" : "first",
    name: str(formData, "name"),
    startDate: str(formData, "startDate"),
    endDate: str(formData, "endDate"),
    examStart: str(formData, "examStart"),
    examEnd: str(formData, "examEnd"),
    resultPublishDate: str(formData, "resultPublishDate"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Term saved.", "/portal/admin/sessions");
}

export async function setActiveTerm(termId: string): Promise<AdminResult> {
  const result = await tryMutation(api.academics.setActiveTerm, { termId: termId as Id<"terms"> });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal", "layout");
  return { ok: true, message: "Current term updated." };
}

/* ------------------------------ website content --------------------------- */

export async function saveNews(formData: FormData, cover?: CloudMedia): Promise<AdminResult> {
  const status = str(formData, "status");
  const result = await tryMutation(api.content.saveNews, {
    id: opt(formData, "id") as Id<"news"> | undefined,
    title: str(formData, "title"),
    excerpt: str(formData, "excerpt"),
    content: String(formData.get("content") ?? ""),
    category: str(formData, "category"),
    tags: list(formData, "tags"),
    authorName: str(formData, "authorName"),
    publishedAt: str(formData, "publishedAt") ? new Date(str(formData, "publishedAt")).toISOString() : new Date().toISOString(),
    status: (["draft", "scheduled", "published", "archived"].includes(status) ? status : "draft") as "draft" | "scheduled" | "published" | "archived",
    featured: bool(formData, "featured"),
    seoTitle: opt(formData, "seoTitle"),
    seoDescription: opt(formData, "seoDescription"),
    cover,
  });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data.previousCover) await destroyAsset(result.data.previousCover);
  revalidatePath("/news", "layout");
  revalidatePath("/");
  return { ...done("Post saved.", "/portal/admin/news"), id: result.data.id };
}

export async function removeNews(id: string): Promise<AdminResult> {
  const result = await tryMutation(api.content.removeNews, { id: id as Id<"news"> });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data?.publicId) await destroyAsset(result.data.publicId);
  revalidatePath("/news", "layout");
  return done("Post deleted.", "/portal/admin/news");
}

export async function saveEvent(formData: FormData, cover?: CloudMedia): Promise<AdminResult> {
  const category = str(formData, "category");
  const result = await tryMutation(api.content.saveEvent, {
    id: opt(formData, "id") as Id<"events"> | undefined,
    title: str(formData, "title"),
    description: str(formData, "description"),
    date: str(formData, "date"),
    endDate: opt(formData, "endDate"),
    startTime: str(formData, "startTime"),
    endTime: str(formData, "endTime"),
    venue: str(formData, "venue"),
    category: (["academic", "sports", "cultural", "parents", "holiday", "assessment", "alumni"].includes(category) ? category : "academic") as
      | "academic"
      | "sports"
      | "cultural"
      | "parents"
      | "holiday"
      | "assessment"
      | "alumni",
    requiresRegistration: bool(formData, "requiresRegistration"),
    cancelled: bool(formData, "cancelled"),
    cover,
  });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data.previousCover) await destroyAsset(result.data.previousCover);
  revalidatePath("/school-life/events", "layout");
  revalidatePath("/calendar");
  return { ...done("Event saved.", "/portal/admin/events"), id: result.data.id };
}

export async function removeEvent(id: string): Promise<AdminResult> {
  const result = await tryMutation(api.content.removeEvent, { id: id as Id<"events"> });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data?.publicId) await destroyAsset(result.data.publicId);
  revalidatePath("/school-life/events", "layout");
  return done("Event deleted.", "/portal/admin/events");
}

export async function addGalleryItem(formData: FormData, media: CloudMedia): Promise<AdminResult> {
  const result = await tryMutation(api.content.addGalleryItem, {
    title: str(formData, "title"),
    caption: str(formData, "caption"),
    category: str(formData, "category"),
    takenAt: str(formData, "takenAt") ? new Date(str(formData, "takenAt")).toISOString() : new Date().toISOString(),
    consentCleared: bool(formData, "consentCleared"),
    media,
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/school-life/gallery");
  return done("Added to the gallery.", "/portal/admin/gallery");
}

export async function updateGalleryItem(formData: FormData): Promise<AdminResult> {
  const result = await tryMutation(api.content.updateGalleryItem, {
    id: str(formData, "id") as Id<"gallery">,
    title: str(formData, "title"),
    caption: str(formData, "caption"),
    category: str(formData, "category"),
    consentCleared: bool(formData, "consentCleared"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/school-life/gallery");
  return done("Gallery item updated.", "/portal/admin/gallery");
}

export async function removeGalleryItem(id: string): Promise<AdminResult> {
  const result = await tryMutation(api.content.removeGalleryItem, { id: id as Id<"gallery"> });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data?.publicId) await destroyAsset(result.data.publicId, result.data.resourceType ?? "image");
  revalidatePath("/school-life/gallery");
  return done("Removed from the gallery.", "/portal/admin/gallery");
}

export async function saveNotice(formData: FormData): Promise<AdminResult> {
  const priority = str(formData, "priority") === "critical" ? "critical" : "high";
  const audience = str(formData, "audience");
  const result = await tryMutation(api.content.saveNotice, {
    id: opt(formData, "id") as Id<"emergencyNotices"> | undefined,
    title: str(formData, "title"),
    body: str(formData, "body"),
    priority,
    audience: (["all", "parents", "staff", "pupils"].includes(audience) ? audience : "all") as "all" | "parents" | "staff" | "pupils",
    startsAt: new Date(str(formData, "startsAt") || Date.now()).toISOString(),
    endsAt: new Date(str(formData, "endsAt") || Date.now() + 86400000).toISOString(),
    active: bool(formData, "active"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/", "layout");
  return done("Notice saved.", "/portal/admin/notices");
}

export async function removeNotice(id: string): Promise<AdminResult> {
  const result = await tryMutation(api.content.removeNotice, { id: id as Id<"emergencyNotices"> });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/", "layout");
  return done("Notice deleted.", "/portal/admin/notices");
}

/* ------------------------------- office desk ------------------------------ */

export async function recordPayment(formData: FormData): Promise<AdminResult> {
  const provider = str(formData, "provider");
  const result = await tryMutation(api.fees.recordPayment, {
    invoiceId: str(formData, "invoiceId") as Id<"invoices">,
    amount: num(formData, "amount"),
    provider: (provider === "cash" ? "cash" : "bank_transfer") as "bank_transfer" | "cash",
    reference: opt(formData, "reference"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  return done(`Payment recorded. Receipt ${result.data.receiptNo}.`, "/portal/admin/fees", "/portal/admin/payments");
}

export async function updateEnquiry(formData: FormData): Promise<AdminResult> {
  const status = str(formData, "status");
  const result = await tryMutation(api.office.updateEnquiry, {
    id: str(formData, "id") as Id<"enquiries">,
    status: (["new", "assigned", "in_progress", "resolved", "archived"].includes(status) ? status : "in_progress") as
      | "new"
      | "assigned"
      | "in_progress"
      | "resolved"
      | "archived",
    reply: opt(formData, "reply"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Enquiry updated.", "/portal/admin/enquiries");
}

export async function updateApplication(formData: FormData): Promise<AdminResult> {
  const result = await tryMutation(api.admissions.updateStatus, {
    applicationId: str(formData, "applicationId") as Id<"applications">,
    status: str(formData, "status") as Exclude<ApplicationStatus, "draft">,
    note: opt(formData, "note"),
    feePaid: formData.has("feePaid") ? bool(formData, "feePaid") : undefined,
  });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Application updated.", "/portal/admin/admissions");
}

/** Parent picker search (administrators only — enforced in Convex). */
export async function findParents(term: string) {
  try {
    return await query(api.people.parentOptions, { search: term });
  } catch {
    return [];
  }
}

/** Pupil picker search (administrators only — enforced in Convex). */
export async function findStudents(term: string) {
  try {
    const result = await query(api.people.listStudents, { search: term, status: "active", page: 1, pageSize: 20 });
    return result.items.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, studentNo: s.studentNo, classId: s.classId }));
  } catch {
    return [];
  }
}
