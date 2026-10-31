import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import {
  assertStudentAccess,
  fail,
  isAdmin,
  parentStudentIds,
  requireAdmin,
  requireRole,
  requireStaff,
  requireViewer,
  teacherClassIds,
} from "./lib/access";
import { getStudentsByIds, toParent, toStudent, toStudents, toTeacher } from "./lib/mappers";
import { audit, getByLooseId, nowISO, withId } from "./lib/util";
import { cloudMedia } from "./validators";

/**
 * Pupils, parents and teachers — the people records. Accounts (sign-ins) live in
 * `users`; a person can exist without one.
 */

function paged<T>(items: T[], page = 1, pageSize = 12) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safe = Math.min(Math.max(1, page), pageCount);
  return { items: items.slice((safe - 1) * pageSize, safe * pageSize), total: items.length, page: safe, pageSize, pageCount };
}

const byName = (a: { lastName: string; firstName: string }, b: { lastName: string; firstName: string }) =>
  a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);

/** The Cloudinary id of a photo an edit replaced or removed, so the caller can delete it. */
const replacedPhoto = (before: { photo?: { publicId: string } }, after?: { publicId: string }) =>
  before.photo && before.photo.publicId !== after?.publicId ? before.photo.publicId : undefined;

/* --------------------------------- pupils --------------------------------- */

/** The signed-in pupil's own record. */
export const myStudent = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, "pupil", "super_admin");
    if (!viewer.studentId) return null;
    const student = await ctx.db.get(viewer.studentId);
    return student ? await toStudent(ctx, student) : null;
  },
});

/** The signed-in parent's children. */
export const myChildren = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, "parent", "super_admin");
    if (!viewer.parentId) return [];
    const students = await getStudentsByIds(ctx, await parentStudentIds(ctx, viewer.parentId));
    return (await toStudents(ctx, students)).sort(byName);
  },
});

/** One pupil, if the viewer may see them. Includes their parents for staff. */
export const getStudent = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const student = await getByLooseId(ctx, "students", id);
    if (!student) return null;
    await assertStudentAccess(ctx, viewer, student._id);
    const shaped = await toStudent(ctx, student);
    const parents =
      viewer.teacherId || viewer.parentId || isAdmin(viewer)
        ? await Promise.all(
            shaped.parentIds.map(async (pid) => {
              const p = await ctx.db.get(pid);
              return p ? await toParent(ctx, p) : null;
            }),
          )
        : [];
    return { student: shaped, parents: parents.filter((p) => p !== null) };
  },
});

export const listStudents = query({
  args: {
    search: v.optional(v.string()),
    classId: v.optional(v.string()),
    status: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const term = args.search?.trim().toLowerCase() ?? "";
    const all = await ctx.db.query("students").collect();
    const filtered = all
      .filter((s) => {
        if (args.classId && args.classId !== "all" && s.classId !== args.classId) return false;
        if (args.status && args.status !== "all" && s.status !== args.status) return false;
        if (!term) return true;
        return `${s.firstName} ${s.lastName} ${s.studentNo} ${s.admissionNo}`.toLowerCase().includes(term);
      })
      .sort(byName);
    const page = paged(filtered, args.page, args.pageSize);
    const users = await Promise.all(
      page.items.map((s) => ctx.db.query("users").withIndex("by_student", (q) => q.eq("studentId", s._id)).first()),
    );
    return {
      ...page,
      items: await Promise.all(
        page.items.map(async (s, i) => ({
          ...(await toStudent(ctx, s)),
          account: users[i] ? { id: users[i]!._id, username: users[i]!.username, hasLogin: Boolean(users[i]!.clerkUserId), active: users[i]!.active } : null,
        })),
      ),
      counts: {
        all: all.length,
        active: all.filter((s) => s.status === "active").length,
        male: all.filter((s) => s.status === "active" && s.gender === "Male").length,
        female: all.filter((s) => s.status === "active" && s.gender === "Female").length,
      },
    };
  },
});

const studentFields = {
  firstName: v.string(),
  middleName: v.optional(v.string()),
  lastName: v.string(),
  dateOfBirth: v.string(),
  gender: v.union(v.literal("Male"), v.literal("Female")),
  nationality: v.string(),
  address: v.string(),
  classId: v.id("classes"),
  house: v.union(v.literal("Emerald"), v.literal("Sapphire"), v.literal("Ruby"), v.literal("Amber")),
  bloodGroup: v.string(),
  medicalNotes: v.optional(v.string()),
  admissionNo: v.optional(v.string()),
  photo: v.optional(cloudMedia),
};

export async function nextStudentNo(ctx: MutationCtx): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `EIA-${year}-`;
  const all = await ctx.db.query("students").collect();
  const max = all
    .map((s) => (s.studentNo.startsWith(prefix) ? Number(s.studentNo.slice(prefix.length)) : 0))
    .reduce((a, b) => Math.max(a, Number.isFinite(b) ? b : 0), 0);
  return `${prefix}${String(max + 1).padStart(5, "0")}`;
}

function checkPerson(args: { firstName: string; lastName: string }) {
  if (!args.firstName.trim() || !args.lastName.trim()) fail("INVALID", "Enter a first name and a last name.");
}

export const createStudent = mutation({
  args: { ...studentFields, parentIds: v.optional(v.array(v.id("parents"))) },
  handler: async (ctx, { parentIds, ...args }) => {
    const viewer = await requireAdmin(ctx);
    checkPerson(args);
    if (!(await ctx.db.get(args.classId))) fail("INVALID", "Choose a class.");
    const studentNo = await nextStudentNo(ctx);
    const id = await ctx.db.insert("students", {
      ...args,
      firstName: args.firstName.trim(),
      middleName: args.middleName?.trim() || undefined,
      lastName: args.lastName.trim(),
      medicalNotes: args.medicalNotes?.trim() || undefined,
      studentNo,
      admissionNo: args.admissionNo?.trim() || studentNo,
      status: "active",
      enrolledAt: nowISO().slice(0, 10),
      avatarSeed: `${args.firstName}${args.lastName}${studentNo}`,
    });
    for (const parentId of parentIds ?? []) await ctx.db.insert("guardianships", { parentId, studentId: id });
    await audit(ctx, viewer, { action: "Enrolled pupil", entity: "Student", entityId: id, newValue: `${args.firstName} ${args.lastName}` });
    return id;
  },
});

export const updateStudent = mutation({
  args: { studentId: v.id("students"), ...studentFields },
  handler: async (ctx, { studentId, ...args }) => {
    const viewer = await requireAdmin(ctx);
    checkPerson(args);
    const before = await ctx.db.get(studentId);
    if (!before) fail("NOT_FOUND", "Pupil not found.");
    await ctx.db.patch(studentId, {
      ...args,
      firstName: args.firstName.trim(),
      middleName: args.middleName?.trim() || undefined,
      lastName: args.lastName.trim(),
      medicalNotes: args.medicalNotes?.trim() || undefined,
      admissionNo: args.admissionNo?.trim() || before.admissionNo,
    });
    if (before.classId !== args.classId) {
      const [from, to] = await Promise.all([ctx.db.get(before.classId), ctx.db.get(args.classId)]);
      await audit(ctx, viewer, { action: "Changed pupil class", entity: "Student", entityId: studentId, previousValue: from?.name, newValue: to?.name });
    } else {
      await audit(ctx, viewer, { action: "Updated pupil record", entity: "Student", entityId: studentId, newValue: `${args.firstName} ${args.lastName}` });
    }
    return { previousPhoto: replacedPhoto(before, args.photo) };
  },
});

export const setStudentStatus = mutation({
  args: {
    studentId: v.id("students"),
    status: v.union(v.literal("active"), v.literal("graduated"), v.literal("transferred"), v.literal("archived")),
  },
  handler: async (ctx, { studentId, status }) => {
    const viewer = await requireAdmin(ctx);
    const before = await ctx.db.get(studentId);
    if (!before) fail("NOT_FOUND", "Pupil not found.");
    await ctx.db.patch(studentId, { status });
    // A pupil who has left can no longer sign in.
    const account = await ctx.db.query("users").withIndex("by_student", (q) => q.eq("studentId", studentId)).first();
    if (account && status !== "active" && account.active) await ctx.db.patch(account._id, { active: false });
    await audit(ctx, viewer, { action: "Changed pupil status", entity: "Student", entityId: studentId, previousValue: before.status, newValue: status });
    return { clerkUserId: status !== "active" ? account?.clerkUserId : undefined };
  },
});

export const linkGuardian = mutation({
  args: { studentId: v.id("students"), parentId: v.id("parents"), linked: v.boolean() },
  handler: async (ctx, { studentId, parentId, linked }) => {
    const viewer = await requireAdmin(ctx);
    const existing = await ctx.db
      .query("guardianships")
      .withIndex("by_parent_student", (q) => q.eq("parentId", parentId).eq("studentId", studentId))
      .unique();
    if (linked && !existing) await ctx.db.insert("guardianships", { parentId, studentId });
    if (!linked && existing) await ctx.db.delete(existing._id);
    await audit(ctx, viewer, { action: linked ? "Linked parent" : "Unlinked parent", entity: "Student", entityId: studentId, newValue: parentId });
  },
});

/* -------------------------------- parents --------------------------------- */

export const myParent = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, "parent", "super_admin");
    if (!viewer.parentId) return null;
    const parent = await ctx.db.get(viewer.parentId);
    return parent ? await toParent(ctx, parent) : null;
  },
});

export const listParents = query({
  args: { search: v.optional(v.string()), page: v.optional(v.number()), pageSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const term = args.search?.trim().toLowerCase() ?? "";
    const all = await ctx.db.query("parents").collect();
    const filtered = all
      .filter((p) => !term || `${p.firstName} ${p.lastName} ${p.email} ${p.phone}`.toLowerCase().includes(term))
      .sort(byName);
    const page = paged(filtered, args.page, args.pageSize);
    const items = await Promise.all(
      page.items.map(async (p) => {
        const shaped = await toParent(ctx, p);
        const children = await getStudentsByIds(ctx, shaped.studentIds as Id<"students">[]);
        const account = await ctx.db.query("users").withIndex("by_parent", (q) => q.eq("parentId", p._id)).first();
        return {
          ...shaped,
          children: children.map((c) => ({ id: c._id, name: `${c.firstName} ${c.lastName}`, classId: c.classId })),
          account: account ? { id: account._id, username: account.username, hasLogin: Boolean(account.clerkUserId), active: account.active } : null,
        };
      }),
    );
    return { ...page, items, counts: { all: all.length } };
  },
});

/** Lightweight parent picker for linking a parent to a pupil. */
export const parentOptions = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, { search }) => {
    await requireAdmin(ctx);
    const term = search?.trim().toLowerCase() ?? "";
    const all = await ctx.db.query("parents").collect();
    return all
      .filter((p) => !term || `${p.firstName} ${p.lastName} ${p.email} ${p.phone}`.toLowerCase().includes(term))
      .sort(byName)
      .slice(0, 50)
      .map((p) => ({ id: p._id, name: `${p.title} ${p.firstName} ${p.lastName}`, email: p.email, phone: p.phone }));
  },
});

const parentFields = {
  title: v.string(),
  firstName: v.string(),
  lastName: v.string(),
  relationship: v.union(v.literal("Father"), v.literal("Mother"), v.literal("Guardian")),
  email: v.string(),
  phone: v.string(),
  occupation: v.string(),
  address: v.string(),
  emergencyContactName: v.string(),
  emergencyContactPhone: v.string(),
  photo: v.optional(cloudMedia),
};

export const createParent = mutation({
  args: { ...parentFields, studentIds: v.optional(v.array(v.id("students"))) },
  handler: async (ctx, { studentIds, ...args }) => {
    const viewer = await requireAdmin(ctx);
    checkPerson(args);
    const id = await ctx.db.insert("parents", {
      ...args,
      email: args.email.trim().toLowerCase(),
      avatarSeed: `${args.firstName}${args.lastName}${Date.now()}`,
    });
    for (const studentId of studentIds ?? []) await ctx.db.insert("guardianships", { parentId: id, studentId });
    await audit(ctx, viewer, { action: "Added parent", entity: "Parent", entityId: id, newValue: `${args.firstName} ${args.lastName}` });
    return id;
  },
});

export const updateParent = mutation({
  args: { parentId: v.id("parents"), ...parentFields },
  handler: async (ctx, { parentId, ...args }) => {
    const viewer = await requireAdmin(ctx);
    checkPerson(args);
    const before = await ctx.db.get(parentId);
    if (!before) fail("NOT_FOUND", "Parent not found.");
    await ctx.db.patch(parentId, { ...args, email: args.email.trim().toLowerCase() });
    await audit(ctx, viewer, { action: "Updated parent", entity: "Parent", entityId: parentId, newValue: `${args.firstName} ${args.lastName}` });
    return { previousPhoto: replacedPhoto(before, args.photo) };
  },
});

/* -------------------------------- teachers -------------------------------- */

export const myTeacher = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireStaff(ctx);
    if (!viewer.teacherId) return null;
    const teacher = await ctx.db.get(viewer.teacherId);
    return teacher ? await toTeacher(ctx, teacher) : null;
  },
});

export const listTeachers = query({
  args: { search: v.optional(v.string()), department: v.optional(v.string()), page: v.optional(v.number()), pageSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const term = args.search?.trim().toLowerCase() ?? "";
    const all = await ctx.db.query("teachers").collect();
    const filtered = all
      .filter((t) => {
        if (args.department && args.department !== "all" && t.department !== args.department) return false;
        return !term || `${t.firstName} ${t.lastName} ${t.staffNo} ${t.position} ${t.email}`.toLowerCase().includes(term);
      })
      .sort(byName);
    const page = paged(filtered, args.page, args.pageSize);
    const items = await Promise.all(
      page.items.map(async (t) => {
        const account = await ctx.db.query("users").withIndex("by_teacher", (q) => q.eq("teacherId", t._id)).first();
        return {
          ...(await toTeacher(ctx, t)),
          account: account ? { id: account._id, username: account.username, hasLogin: Boolean(account.clerkUserId), active: account.active } : null,
        };
      }),
    );
    return {
      ...page,
      items,
      departments: [...new Set(all.map((t) => t.department))].sort(),
      counts: { all: all.length, active: all.filter((t) => t.active).length },
    };
  },
});

const teacherFields = {
  title: v.string(),
  firstName: v.string(),
  lastName: v.string(),
  position: v.string(),
  department: v.string(),
  email: v.string(),
  phone: v.string(),
  qualifications: v.array(v.string()),
  experienceYears: v.number(),
  bio: v.string(),
  featured: v.boolean(),
  photo: v.optional(cloudMedia),
};

async function nextStaffNo(ctx: MutationCtx) {
  const all = await ctx.db.query("teachers").collect();
  const max = all.map((t) => Number(t.staffNo.split("/").pop())).reduce((a, b) => Math.max(a, Number.isFinite(b) ? b : 0), 0);
  return `EIA/STF/${String(max + 1).padStart(3, "0")}`;
}

export const createTeacher = mutation({
  args: teacherFields,
  handler: async (ctx, args) => {
    const viewer = await requireAdmin(ctx);
    checkPerson(args);
    const id = await ctx.db.insert("teachers", {
      ...args,
      email: args.email.trim().toLowerCase(),
      staffNo: await nextStaffNo(ctx),
      active: true,
      joinedAt: nowISO().slice(0, 10),
      avatarSeed: `${args.firstName}${args.lastName}`,
    });
    await audit(ctx, viewer, { action: "Added staff member", entity: "Teacher", entityId: id, newValue: `${args.title} ${args.firstName} ${args.lastName}` });
    return id;
  },
});

export const updateTeacher = mutation({
  args: { teacherId: v.id("teachers"), ...teacherFields, active: v.boolean() },
  handler: async (ctx, { teacherId, ...args }) => {
    const viewer = await requireAdmin(ctx);
    checkPerson(args);
    const before = await ctx.db.get(teacherId);
    if (!before) fail("NOT_FOUND", "Teacher not found.");
    await ctx.db.patch(teacherId, { ...args, email: args.email.trim().toLowerCase() });
    let clerkUserId: string | undefined;
    if (before.active && !args.active) {
      const account = await ctx.db.query("users").withIndex("by_teacher", (q) => q.eq("teacherId", teacherId)).first();
      if (account?.active) {
        await ctx.db.patch(account._id, { active: false });
        clerkUserId = account.clerkUserId;
      }
    }
    await audit(ctx, viewer, { action: "Updated staff member", entity: "Teacher", entityId: teacherId, newValue: `${args.firstName} ${args.lastName}` });
    return { clerkUserId, previousPhoto: replacedPhoto(before, args.photo) };
  },
});

/**
 * The signed-in teacher's or parent's own profile photo (Cloudinary). Pupils'
 * photos are set by the school office, through the pupil record.
 */
export const setMyPhoto = mutation({
  args: { photo: v.optional(cloudMedia) },
  handler: async (ctx, { photo }) => {
    const viewer = await requireViewer(ctx);
    const record = viewer.teacherId
      ? await ctx.db.get(viewer.teacherId)
      : viewer.parentId
        ? await ctx.db.get(viewer.parentId)
        : null;
    if (!record) fail("FORBIDDEN", "This account has no profile to add a photo to.");
    if (photo && photo.resourceType !== "image") fail("INVALID", "Choose a photo.");
    await ctx.db.patch(record._id, { photo });
    return { previousPhoto: replacedPhoto(record, photo) };
  },
});

/** Active pupil counts for the classes a teacher teaches (every class for admins). */
export const classSizes = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireStaff(ctx);
    const students = await ctx.db.query("students").withIndex("by_status", (q) => q.eq("status", "active")).collect();
    const allowed = isAdmin(viewer) || !viewer.teacherId ? null : await teacherClassIds(ctx, viewer.teacherId);
    const counts: Record<string, number> = {};
    for (const s of students) {
      if (allowed && !allowed.has(s.classId)) continue;
      counts[s.classId] = (counts[s.classId] ?? 0) + 1;
    }
    return counts;
  },
});

/** A parent's record with their children and sign-in, for administrators. */
export const getParentDetail = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const parent = await getByLooseId(ctx, "parents", id);
    if (!parent) return null;
    const shaped = await toParent(ctx, parent);
    const children = await toStudents(ctx, await getStudentsByIds(ctx, shaped.studentIds as Id<"students">[]));
    const account = await ctx.db.query("users").withIndex("by_parent", (q) => q.eq("parentId", parent._id)).first();
    return { parent: shaped, children, account: account ? withId(account) : null };
  },
});

/** A teacher's record with their sign-in, for administrators. */
export const getTeacherDetail = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const teacher = await getByLooseId(ctx, "teachers", id);
    if (!teacher) return null;
    const account = await ctx.db.query("users").withIndex("by_teacher", (q) => q.eq("teacherId", teacher._id)).first();
    return { teacher: await toTeacher(ctx, teacher), account: account ? withId(account) : null };
  },
});
