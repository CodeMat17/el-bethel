import { v } from "convex/values";

import { ADMISSION_OPEN_LEVELS, APPLICATION_DOCUMENT_REQUIREMENTS } from "../lib/school/config";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { fail, requireAdmin } from "./lib/access";
import { audit, getByLooseId, nowISO, withId } from "./lib/util";
import { applicationStatus } from "./validators";

/**
 * Online admissions. Public sign-up is off, so applicants don't get accounts:
 * a draft is tied to a random secret held in an httpOnly cookie in the
 * applicant's browser (only its SHA-256 hash is stored here). After submission,
 * status is looked up with the application number plus the email on record.
 */

type Ctx = QueryCtx | MutationCtx;

function publicShape(a: Doc<"applications">) {
  const shaped = withId(a);
  delete (shaped as { accessTokenHash?: string }).accessTokenHash;
  return shaped as Omit<typeof shaped, "accessTokenHash">;
}

async function draftFor(ctx: Ctx, tokenHash: string) {
  if (!tokenHash || tokenHash.length < 32) return null;
  const app = await ctx.db
    .query("applications")
    .withIndex("by_access_token", (q) => q.eq("accessTokenHash", tokenHash))
    .first();
  return app;
}

async function requireDraft(ctx: MutationCtx, tokenHash: string) {
  const app = await draftFor(ctx, tokenHash);
  if (!app) fail("NOT_FOUND", "We couldn't find your application. Please start again.");
  if (app.status !== "draft") fail("INVALID", "This application has already been submitted.");
  return app;
}

async function nextApplicationNo(ctx: MutationCtx) {
  const year = new Date().getUTCFullYear();
  const prefix = `ADM-${year}-`;
  const all = await ctx.db.query("applications").collect();
  const max = all
    .map((a) => (a.applicationNo.startsWith(prefix) ? Number(a.applicationNo.slice(prefix.length)) : 0))
    .reduce((m, n) => Math.max(m, Number.isFinite(n) ? n : 0), 0);
  return `${prefix}${String(max + 1).padStart(5, "0")}`;
}

/* --------------------------------- public --------------------------------- */

export const getDraft = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const app = await draftFor(ctx, tokenHash);
    return app ? publicShape(app) : null;
  },
});

export const start = mutation({
  args: {
    tokenHash: v.string(),
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    intendedLevelId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.tokenHash.length < 32) fail("INVALID", "Invalid session.");
    if (!ADMISSION_OPEN_LEVELS.includes(args.intendedLevelId)) fail("INVALID", "Choose a class that is open for admission.");
    const session = (await ctx.db.query("academicSessions").collect()).find((s) => s.active);
    if (!session) fail("INVALID", "Admissions are not open right now.");
    const email = args.email.trim().toLowerCase();
    const now = nowISO();
    const id = await ctx.db.insert("applications", {
      applicationNo: await nextApplicationNo(ctx),
      sessionId: session._id,
      intendedLevelId: args.intendedLevelId,
      status: "draft",
      createdAt: now,
      pupil: {
        firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "",
        nationality: "Nigerian", previousSchool: "", currentClass: "", address: "", photoUploaded: false,
      },
      guardian: {
        name: args.fullName.trim(), relationship: "", phone: args.phone.trim(), email,
        occupation: "", address: "", emergencyContact: "", emergencyPhone: "",
      },
      documents: APPLICATION_DOCUMENT_REQUIREMENTS.map((d) => ({ key: d.key, label: d.label, required: d.required, uploaded: false })),
      applicationFeePaid: false,
      timeline: [{ at: now, status: "draft", note: "Application started.", actor: "Parent" }],
      ownerEmail: email,
      accessTokenHash: args.tokenHash,
    });
    return id;
  },
});

export const savePupil = mutation({
  args: {
    tokenHash: v.string(),
    intendedLevelId: v.string(),
    pupil: v.object({
      firstName: v.string(),
      middleName: v.string(),
      lastName: v.string(),
      dateOfBirth: v.string(),
      gender: v.union(v.literal("Male"), v.literal("Female")),
      nationality: v.string(),
      previousSchool: v.string(),
      currentClass: v.string(),
      address: v.string(),
    }),
  },
  handler: async (ctx, { tokenHash, intendedLevelId, pupil }) => {
    const app = await requireDraft(ctx, tokenHash);
    if (!ADMISSION_OPEN_LEVELS.includes(intendedLevelId)) fail("INVALID", "Choose a class that is open.");
    await ctx.db.patch(app._id, { intendedLevelId, pupil: { ...pupil, photoUploaded: app.pupil.photoUploaded } });
  },
});

export const saveGuardian = mutation({
  args: {
    tokenHash: v.string(),
    guardian: v.object({
      name: v.string(),
      relationship: v.string(),
      phone: v.string(),
      email: v.string(),
      occupation: v.string(),
      address: v.string(),
      emergencyContact: v.string(),
      emergencyPhone: v.string(),
    }),
  },
  handler: async (ctx, { tokenHash, guardian }) => {
    const app = await requireDraft(ctx, tokenHash);
    await ctx.db.patch(app._id, { guardian: { ...guardian, email: guardian.email.toLowerCase() } });
  },
});

export const setDocument = mutation({
  args: { tokenHash: v.string(), key: v.string(), fileName: v.optional(v.string()) },
  handler: async (ctx, { tokenHash, key, fileName }) => {
    const app = await requireDraft(ctx, tokenHash);
    const doc = app.documents.find((d) => d.key === key);
    if (!doc) fail("INVALID", "That document is not part of this application.");
    const documents = app.documents.map((d) =>
      d.key === key
        ? fileName
          ? { ...d, uploaded: true, fileName, uploadedAt: nowISO() }
          : { key: d.key, label: d.label, required: d.required, uploaded: false }
        : d,
    );
    await ctx.db.patch(app._id, {
      documents,
      pupil: key === "passport" ? { ...app.pupil, photoUploaded: Boolean(fileName) } : app.pupil,
    });
    return doc.label;
  },
});

export const submit = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const app = await requireDraft(ctx, tokenHash);
    const p = app.pupil;
    if (!p.firstName || !p.lastName || !p.dateOfBirth || !p.gender) fail("INVALID", "Pupil information is incomplete. Please review that step.");
    if (!app.guardian.relationship || !app.guardian.occupation) fail("INVALID", "Parent information is incomplete. Please review that step.");
    const missing = app.documents.filter((d) => d.required && !d.uploaded);
    if (missing.length) fail("INVALID", `Please upload the required documents: ${missing.map((d) => d.label).join(", ")}.`);
    const now = nowISO();
    await ctx.db.patch(app._id, {
      status: "submitted",
      submittedAt: now,
      accessTokenHash: undefined,
      timeline: [...app.timeline, { at: now, status: "submitted", note: "Application submitted for review.", actor: "Parent" }],
    });
    await ctx.db.insert("auditLogs", {
      actorName: app.guardian.name,
      action: "Submitted admission application",
      entity: "Application",
      entityId: app._id,
      newValue: app.applicationNo,
      at: now,
      ip: "—",
      device: "Web",
    });
    return app.applicationNo;
  },
});

/** Public status lookup: needs both the application number and the email on record. */
export const lookup = query({
  args: { applicationNo: v.string(), email: v.string() },
  handler: async (ctx, { applicationNo, email }) => {
    const app = await ctx.db
      .query("applications")
      .withIndex("by_application_no", (q) => q.eq("applicationNo", applicationNo.trim().toUpperCase()))
      .first();
    if (!app || app.ownerEmail.toLowerCase() !== email.trim().toLowerCase()) return null;
    return publicShape(app);
  },
});

/* --------------------------------- admin ---------------------------------- */

export const list = query({
  args: { search: v.optional(v.string()), status: v.optional(v.string()), levelId: v.optional(v.string()), page: v.optional(v.number()), pageSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const all = (await ctx.db.query("applications").collect()).filter((a) => a.status !== "draft" || args.status === "draft");
    const term = args.search?.trim().toLowerCase() ?? "";
    const filtered = all
      .filter((a) => {
        if (args.status && args.status !== "all" && a.status !== args.status) return false;
        if (args.levelId && args.levelId !== "all" && a.intendedLevelId !== args.levelId) return false;
        if (!term) return true;
        return `${a.applicationNo} ${a.pupil.firstName} ${a.pupil.lastName} ${a.guardian.name} ${a.ownerEmail}`.toLowerCase().includes(term);
      })
      .sort((a, b) => (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt));
    const pageSize = args.pageSize ?? 10;
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(Math.max(1, args.page ?? 1), pageCount);
    const statusCounts: Record<string, number> = {};
    for (const a of all) statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize).map(publicShape),
      total: filtered.length,
      page,
      pageSize,
      pageCount,
      statusCounts,
      totals: {
        all: all.length,
        recent: all.filter((a) => a.createdAt >= monthAgo).length,
        pending: all.filter((a) => ["submitted", "under_review", "documents_required"].includes(a.status)).length,
        accepted: all.filter((a) => ["accepted", "conditionally_accepted", "enrolled"].includes(a.status)).length,
      },
    };
  },
});

export const get = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const app = await getByLooseId(ctx, "applications", id);
    return app ? publicShape(app) : null;
  },
});

export const updateStatus = mutation({
  args: { applicationId: v.id("applications"), status: applicationStatus, note: v.optional(v.string()), feePaid: v.optional(v.boolean()) },
  handler: async (ctx, { applicationId, status, note, feePaid }) => {
    const viewer = await requireAdmin(ctx);
    const app = await ctx.db.get(applicationId);
    if (!app) fail("NOT_FOUND", "Application not found.");
    if (status === "draft") fail("INVALID", "Choose a valid status.");
    const now = nowISO();
    const text = note?.trim();
    await ctx.db.patch(applicationId, {
      status,
      decisionNote: text || app.decisionNote,
      decidedAt: ["accepted", "conditionally_accepted", "not_accepted", "waitlisted"].includes(status) ? now : app.decidedAt,
      applicationFeePaid: feePaid ?? app.applicationFeePaid,
      timeline: [...app.timeline, { at: now, status, note: text || `Status changed to ${status.replace(/_/g, " ")}.`, actor: viewer.name }],
    });
    await audit(ctx, viewer, { action: "Changed application status", entity: "Application", entityId: applicationId, previousValue: app.status, newValue: status });
  },
});
