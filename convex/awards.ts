import { v } from "convex/values";

import { AWARD_CATEGORIES, initialsOf } from "../lib/school/awards";
import { CLASS_LEVELS } from "../lib/school/config";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { assertStudentAccess, fail, requireAdmin, requireViewer } from "./lib/access";
import { accountsForStudent, audit, notify, nowISO, withId } from "./lib/util";

/**
 * "Our Stars" achievements and digital certificates with public QR verification.
 * The public site and verification page only ever see initials, never names.
 */

type Ctx = QueryCtx | MutationCtx;

const CATEGORY = new Set<string>(AWARD_CATEGORIES);

async function classLabelFor(ctx: Ctx, student: Doc<"students">) {
  const cls = await ctx.db.get(student.classId);
  return CLASS_LEVELS.find((l) => l.id === cls?.levelId)?.name ?? cls?.name ?? "";
}

async function activeSessionName(ctx: Ctx) {
  const session = (await ctx.db.query("academicSessions").collect()).find((s) => s.active);
  return session?.name ?? "";
}

/** Next number in this year's series: EIA-2026-00024. */
async function nextCertificateNo(ctx: MutationCtx) {
  const prefix = `EIA-${new Date().getUTCFullYear()}-`;
  const last = await ctx.db
    .query("certificates")
    .withIndex("by_certificate_no", (q) => q.gte("certificateNo", prefix).lt("certificateNo", `${prefix}~`))
    .order("desc")
    .first();
  const n = last ? Number(last.certificateNo.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(5, "0")}`;
}

async function tellFamily(ctx: MutationCtx, studentId: Id<"students">, n: { type: string; title: string; body: string }) {
  for (const userId of await accountsForStudent(ctx, studentId)) {
    const user = await ctx.db.get(userId);
    await notify(ctx, userId, {
      ...n,
      href: user?.studentId ? "/portal/pupil/profile" : user?.parentId ? `/portal/parent/children/${studentId}` : undefined,
    });
  }
}

async function createCertificate(
  ctx: MutationCtx,
  viewer: Doc<"users">,
  a: { studentId: Id<"students">; category: string; award: string; citation?: string; sessionName?: string; achievementId?: Id<"achievements"> },
) {
  const student = await ctx.db.get(a.studentId);
  if (!student) fail("NOT_FOUND", "Choose a pupil.");
  if (!CATEGORY.has(a.category)) fail("INVALID", "Choose an award category.");
  const award = a.award.trim().slice(0, 120) || a.category;
  const certificateNo = await nextCertificateNo(ctx);
  const id = await ctx.db.insert("certificates", {
    certificateNo,
    studentId: a.studentId,
    award,
    category: a.category,
    citation: a.citation?.trim().slice(0, 300) || undefined,
    sessionName: a.sessionName?.trim() || (await activeSessionName(ctx)),
    issuedAt: nowISO(),
    issuedBy: viewer._id,
    achievementId: a.achievementId,
  });
  await tellFamily(ctx, a.studentId, {
    type: "certificate_issued",
    title: `Certificate awarded: ${award}`,
    body: `${student.firstName} has been awarded a certificate (${certificateNo}). You can download it from the portal.`,
  });
  await audit(ctx, viewer, { action: "Issued certificate", entity: "Certificate", entityId: id, newValue: `${certificateNo} · ${award}` });
  return { id, certificateNo };
}

/* ------------------------------ certificates ------------------------------ */

export const certificatesForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, { studentId }) => {
    const viewer = await requireViewer(ctx);
    await assertStudentAccess(ctx, viewer, studentId);
    const rows = await ctx.db.query("certificates").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect();
    return rows.map(withId).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  },
});

/** One certificate with what is printed on it. Only the pupil, their parents and staff with access. */
export const certificate = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const normalized = ctx.db.normalizeId("certificates", id);
    const cert = normalized ? await ctx.db.get(normalized) : null;
    if (!cert) return null;
    await assertStudentAccess(ctx, viewer, cert.studentId);
    const student = await ctx.db.get(cert.studentId);
    return {
      ...withId(cert),
      studentName: student ? [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ") : "",
      classLabel: student ? await classLabelFor(ctx, student) : "",
    };
  },
});

/** Public verification. Returns only what is needed to confirm the document — initials, not names. */
export const verify = query({
  args: { certificateNo: v.string() },
  handler: async (ctx, { certificateNo }) => {
    const cert = await ctx.db
      .query("certificates")
      .withIndex("by_certificate_no", (q) => q.eq("certificateNo", certificateNo.trim().toUpperCase()))
      .first();
    if (!cert) return null;
    const student = await ctx.db.get(cert.studentId);
    return {
      certificateNo: cert.certificateNo,
      award: cert.award,
      category: cert.category ?? null,
      sessionName: cert.sessionName,
      issuedAt: cert.issuedAt,
      initials: student ? initialsOf(student.firstName, student.lastName) : "",
      revoked: Boolean(cert.revokedAt),
      revokedAt: cert.revokedAt ?? null,
    };
  },
});

export const adminCertificates = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("certificates").collect();
    const students = new Map<string, Doc<"students"> | null>();
    for (const r of rows) if (!students.has(r.studentId)) students.set(r.studentId, await ctx.db.get(r.studentId));
    return {
      sessionName: await activeSessionName(ctx),
      certificates: rows
        .map((r) => {
          const s = students.get(r.studentId);
          return { ...withId(r), studentName: s ? `${s.firstName} ${s.lastName}` : "—", classId: s?.classId ?? null };
        })
        .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    };
  },
});

export const issueCertificate = mutation({
  args: {
    studentId: v.id("students"),
    category: v.string(),
    award: v.string(),
    citation: v.optional(v.string()),
    sessionName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireAdmin(ctx);
    return await createCertificate(ctx, viewer, args);
  },
});

export const revokeCertificate = mutation({
  args: { id: v.id("certificates"), reason: v.string() },
  handler: async (ctx, { id, reason }) => {
    const viewer = await requireAdmin(ctx);
    const cert = await ctx.db.get(id);
    if (!cert) fail("NOT_FOUND", "Certificate not found.");
    if (cert.revokedAt) return;
    if (reason.trim().length < 5) fail("INVALID", "Give a short reason for withdrawing the certificate.");
    await ctx.db.patch(id, { revokedAt: nowISO(), revokedReason: reason.trim().slice(0, 300) });
    await audit(ctx, viewer, { action: "Revoked certificate", entity: "Certificate", entityId: id, previousValue: cert.certificateNo, newValue: reason });
  },
});

/* ------------------------------- achievements ----------------------------- */

export const adminAchievements = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("achievements").collect();
    const out = [];
    for (const r of rows) {
      const s = r.studentId ? await ctx.db.get(r.studentId) : null;
      out.push({ ...withId(r), published: r.published !== false, studentName: s ? `${s.firstName} ${s.lastName}` : null });
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const saveAchievement = mutation({
  args: {
    id: v.optional(v.id("achievements")),
    studentId: v.optional(v.id("students")),
    studentInitials: v.optional(v.string()),
    classLabel: v.optional(v.string()),
    category: v.string(),
    title: v.string(),
    description: v.string(),
    date: v.string(),
    published: v.boolean(),
    issueCertificate: v.optional(v.boolean()),
  },
  handler: async (ctx, a) => {
    const viewer = await requireAdmin(ctx);
    if (!CATEGORY.has(a.category)) fail("INVALID", "Choose a category.");
    if (a.title.trim().length < 3) fail("INVALID", "Give the achievement a title.");
    if (Number.isNaN(Date.parse(a.date))) fail("INVALID", "Choose a date.");
    const student = a.studentId ? await ctx.db.get(a.studentId) : null;
    if (a.studentId && !student) fail("NOT_FOUND", "Pupil not found.");
    // Initials and class are derived from the pupil when one is linked, so nothing more leaks out.
    const studentInitials = student ? initialsOf(student.firstName, student.lastName) : (a.studentInitials ?? "").trim().slice(0, 12);
    const classLabel = student ? await classLabelFor(ctx, student) : (a.classLabel ?? "").trim().slice(0, 40);
    if (!studentInitials) fail("INVALID", "Link a pupil or enter their initials.");
    const fields = {
      studentId: a.studentId,
      studentInitials,
      classLabel,
      category: a.category,
      title: a.title.trim().slice(0, 140),
      description: a.description.trim().slice(0, 500),
      date: new Date(a.date).toISOString(),
      published: a.published,
    };

    let id = a.id;
    if (id) {
      const existing = await ctx.db.get(id);
      if (!existing) fail("NOT_FOUND", "Achievement not found.");
      await ctx.db.replace(id, fields);
    } else {
      id = await ctx.db.insert("achievements", fields);
      if (student) {
        await tellFamily(ctx, student._id, {
          type: "achievement",
          title: `A new star: ${fields.title}`,
          body: `${student.firstName}'s achievement has been recorded${fields.published ? " and celebrated on Our Stars (initials only)" : ""}.`,
        });
      }
    }
    await audit(ctx, viewer, { action: a.id ? "Updated achievement" : "Added achievement", entity: "Achievement", entityId: id, newValue: fields.title });

    let certificateNo: string | undefined;
    if (a.issueCertificate && student) {
      const existing = (await ctx.db.query("certificates").withIndex("by_student", (q) => q.eq("studentId", student._id)).collect()).find(
        (c) => c.achievementId === id && !c.revokedAt,
      );
      if (!existing) {
        certificateNo = (await createCertificate(ctx, viewer, { studentId: student._id, category: a.category, award: fields.title, citation: fields.description, achievementId: id })).certificateNo;
      }
    }
    return { id, certificateNo };
  },
});

export const removeAchievement = mutation({
  args: { id: v.id("achievements") },
  handler: async (ctx, { id }) => {
    const viewer = await requireAdmin(ctx);
    const row = await ctx.db.get(id);
    if (!row) return;
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Removed achievement", entity: "Achievement", entityId: id, previousValue: row.title });
  },
});
