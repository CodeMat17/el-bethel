import { v } from "convex/values";

import { CLASS_LEVELS } from "../lib/school/config";
import { mutation, query } from "./_generated/server";
import { fail, requireAdmin } from "./lib/access";
import { audit } from "./lib/util";

/**
 * School structure, managed by administrators: classes (with class teachers),
 * subjects, sessions and terms, and who teaches which subject in which class.
 */

const LEVEL_IDS = new Set(CLASS_LEVELS.map((l) => l.id));

/* --------------------------------- classes -------------------------------- */

export const classStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const students = await ctx.db.query("students").withIndex("by_status", (q) => q.eq("status", "active")).collect();
    const counts: Record<string, number> = {};
    for (const s of students) counts[s.classId] = (counts[s.classId] ?? 0) + 1;
    return counts;
  },
});

/** Sections and active pupils per class level, for the public Academics page. Totals only. */
export const levelSummary = query({
  args: {},
  handler: async (ctx) => {
    const [classes, students] = await Promise.all([
      ctx.db.query("classes").collect(),
      ctx.db.query("students").withIndex("by_status", (q) => q.eq("status", "active")).collect(),
    ]);
    const levelOf = new Map(classes.map((c) => [c._id as string, c.levelId]));
    const summary: Record<string, { sections: number; pupils: number }> = {};
    for (const c of classes) (summary[c.levelId] ??= { sections: 0, pupils: 0 }).sections++;
    for (const s of students) {
      const levelId = levelOf.get(s.classId);
      if (levelId) summary[levelId].pupils++;
    }
    return summary;
  },
});

export const saveClass = mutation({
  args: {
    id: v.optional(v.id("classes")),
    levelId: v.string(),
    section: v.string(),
    name: v.string(),
    classTeacherId: v.optional(v.id("teachers")),
    capacity: v.number(),
    room: v.string(),
  },
  handler: async (ctx, { id, ...a }) => {
    const viewer = await requireAdmin(ctx);
    if (!LEVEL_IDS.has(a.levelId)) fail("INVALID", "Choose a level.");
    if (!a.name.trim()) fail("INVALID", "Enter the class name.");
    if (!Number.isInteger(a.capacity) || a.capacity < 1 || a.capacity > 200) fail("INVALID", "Capacity must be between 1 and 200.");
    const clash = (await ctx.db.query("classes").collect()).find((c) => c.name.toLowerCase() === a.name.trim().toLowerCase() && c._id !== id);
    if (clash) fail("CONFLICT", `A class called ${clash.name} already exists.`);
    const doc = { ...a, name: a.name.trim(), section: a.section.trim(), room: a.room.trim() };
    if (id) {
      await ctx.db.patch(id, doc);
      await audit(ctx, viewer, { action: "Edited class", entity: "Class", entityId: id, newValue: doc.name });
      return id;
    }
    const newId = await ctx.db.insert("classes", doc);
    await audit(ctx, viewer, { action: "Created class", entity: "Class", entityId: newId, newValue: doc.name });
    return newId;
  },
});

export const removeClass = mutation({
  args: { id: v.id("classes") },
  handler: async (ctx, { id }) => {
    const viewer = await requireAdmin(ctx);
    const cls = await ctx.db.get(id);
    if (!cls) return;
    const pupil = await ctx.db.query("students").withIndex("by_class", (q) => q.eq("classId", id)).first();
    if (pupil) fail("INVALID", "Move the pupils in this class to another class first.");
    const assignment = await ctx.db.query("assignments").withIndex("by_class", (q) => q.eq("classId", id)).first();
    if (assignment) fail("INVALID", "This class has assignments on record and can't be deleted.");
    for (const row of await ctx.db.query("teachingAssignments").withIndex("by_class", (q) => q.eq("classId", id)).collect()) {
      await ctx.db.delete(row._id);
    }
    for (const slot of await ctx.db.query("timetable").withIndex("by_class", (q) => q.eq("classId", id)).collect()) {
      await ctx.db.delete(slot._id);
    }
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Deleted class", entity: "Class", entityId: id, previousValue: cls.name });
  },
});

/* -------------------------------- subjects -------------------------------- */

export const saveSubject = mutation({
  args: {
    id: v.optional(v.id("subjects")),
    name: v.string(),
    code: v.string(),
    group: v.union(v.literal("core"), v.literal("additional")),
    levelIds: v.array(v.string()),
  },
  handler: async (ctx, { id, ...a }) => {
    const viewer = await requireAdmin(ctx);
    if (!a.name.trim()) fail("INVALID", "Enter the subject name.");
    const code = a.code.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,8}$/.test(code)) fail("INVALID", "Use a short code of 2–8 letters or numbers.");
    if (a.levelIds.length === 0) fail("INVALID", "Choose at least one level.");
    if (a.levelIds.some((l) => !LEVEL_IDS.has(l))) fail("INVALID", "Unknown level.");
    const clash = await ctx.db.query("subjects").withIndex("by_code", (q) => q.eq("code", code)).first();
    if (clash && clash._id !== id) fail("CONFLICT", `The code ${code} is used by ${clash.name}.`);
    const doc = { name: a.name.trim(), code, group: a.group, levelIds: a.levelIds };
    if (id) {
      await ctx.db.patch(id, doc);
      await audit(ctx, viewer, { action: "Edited subject", entity: "Subject", entityId: id, newValue: doc.name });
      return id;
    }
    const newId = await ctx.db.insert("subjects", doc);
    await audit(ctx, viewer, { action: "Created subject", entity: "Subject", entityId: newId, newValue: doc.name });
    return newId;
  },
});

export const removeSubject = mutation({
  args: { id: v.id("subjects") },
  handler: async (ctx, { id }) => {
    const viewer = await requireAdmin(ctx);
    const subject = await ctx.db.get(id);
    if (!subject) return;
    const used =
      (await ctx.db.query("assignments").collect()).some((a) => a.subjectId === id) ||
      Boolean(await ctx.db.query("results").filter((q) => q.eq(q.field("subjectId"), id)).first());
    if (used) fail("INVALID", "This subject has assignments or results on record and can't be deleted.");
    for (const row of (await ctx.db.query("teachingAssignments").collect()).filter((r) => r.subjectId === id)) {
      await ctx.db.delete(row._id);
    }
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Deleted subject", entity: "Subject", entityId: id, previousValue: subject.name });
  },
});

/* ---------------------------- teaching assignments ------------------------ */

/** Set (or clear) who teaches a subject in a class. */
export const setSubjectTeacher = mutation({
  args: { classId: v.id("classes"), subjectId: v.id("subjects"), teacherId: v.optional(v.id("teachers")) },
  handler: async (ctx, { classId, subjectId, teacherId }) => {
    const viewer = await requireAdmin(ctx);
    const [cls, subject] = await Promise.all([ctx.db.get(classId), ctx.db.get(subjectId)]);
    if (!cls || !subject) fail("NOT_FOUND", "Class or subject not found.");
    if (!subject.levelIds.includes(cls.levelId)) fail("INVALID", `${subject.name} is not taught at this level.`);
    const existing = await ctx.db
      .query("teachingAssignments")
      .withIndex("by_class_subject", (q) => q.eq("classId", classId).eq("subjectId", subjectId))
      .collect();
    for (const row of existing) await ctx.db.delete(row._id);
    if (teacherId) {
      const teacher = await ctx.db.get(teacherId);
      if (!teacher?.active) fail("INVALID", "Choose an active teacher.");
      await ctx.db.insert("teachingAssignments", { classId, subjectId, teacherId });
    }
    await audit(ctx, viewer, { action: "Assigned subject teacher", entity: "Class", entityId: classId, newValue: `${subject.name}: ${teacherId ?? "none"}` });
  },
});

/* --------------------------- sessions and terms --------------------------- */

export const saveSession = mutation({
  args: { id: v.optional(v.id("academicSessions")), name: v.string(), startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { id, ...a }) => {
    const viewer = await requireAdmin(ctx);
    if (!/^\d{4}\/\d{4}$/.test(a.name.trim())) fail("INVALID", "Name the session like 2026/2027.");
    if (a.endDate <= a.startDate) fail("INVALID", "The session must end after it starts.");
    const doc = { name: a.name.trim(), startDate: a.startDate, endDate: a.endDate };
    if (id) {
      await ctx.db.patch(id, doc);
      return id;
    }
    const newId = await ctx.db.insert("academicSessions", { ...doc, active: false });
    await audit(ctx, viewer, { action: "Created session", entity: "Session", entityId: newId, newValue: doc.name });
    return newId;
  },
});

export const saveTerm = mutation({
  args: {
    id: v.optional(v.id("terms")),
    sessionId: v.id("academicSessions"),
    key: v.union(v.literal("first"), v.literal("second"), v.literal("third")),
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    examStart: v.string(),
    examEnd: v.string(),
    resultPublishDate: v.string(),
  },
  handler: async (ctx, { id, ...a }) => {
    const viewer = await requireAdmin(ctx);
    if (!a.name.trim()) fail("INVALID", "Enter the term name.");
    if (a.endDate <= a.startDate) fail("INVALID", "The term must end after it starts.");
    if (a.examEnd < a.examStart) fail("INVALID", "Exams must end after they start.");
    const siblings = await ctx.db.query("terms").withIndex("by_session", (q) => q.eq("sessionId", a.sessionId)).collect();
    if (siblings.some((t) => t.key === a.key && t._id !== id)) fail("CONFLICT", "This session already has that term.");
    const doc = { ...a, name: a.name.trim() };
    if (id) {
      await ctx.db.patch(id, doc);
      await audit(ctx, viewer, { action: "Edited term", entity: "Term", entityId: id, newValue: doc.name });
      return id;
    }
    const newId = await ctx.db.insert("terms", { ...doc, active: false });
    await audit(ctx, viewer, { action: "Created term", entity: "Term", entityId: newId, newValue: doc.name });
    return newId;
  },
});

/** Delete a term that nothing has been recorded against yet. */
export const removeTerm = mutation({
  args: { id: v.id("terms") },
  handler: async (ctx, { id }) => {
    const viewer = await requireAdmin(ctx);
    const term = await ctx.db.get(id);
    if (!term) return;
    if (term.active) fail("INVALID", "Make another term current before deleting this one.");
    const [result, report, assignment, invoice] = await Promise.all([
      ctx.db.query("results").withIndex("by_term", (q) => q.eq("termId", id)).first(),
      ctx.db.query("reportCards").withIndex("by_term", (q) => q.eq("termId", id)).first(),
      ctx.db.query("assignments").filter((q) => q.eq(q.field("termId"), id)).first(),
      ctx.db.query("invoices").filter((q) => q.eq(q.field("termId"), id)).first(),
    ]);
    if (result || report) fail("INVALID", "This term has results on record and can't be deleted. Edit its dates instead.");
    if (assignment) fail("INVALID", "This term has assignments on record and can't be deleted. Edit its dates instead.");
    if (invoice) fail("INVALID", "This term has invoices on record and can't be deleted. Edit its dates instead.");
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Deleted term", entity: "Term", entityId: id, previousValue: term.name });
  },
});

/** Delete a session with no terms or applications. */
export const removeSession = mutation({
  args: { id: v.id("academicSessions") },
  handler: async (ctx, { id }) => {
    const viewer = await requireAdmin(ctx);
    const session = await ctx.db.get(id);
    if (!session) return;
    if (session.active) fail("INVALID", "This is the current session. Make a term in another session current first.");
    const term = await ctx.db.query("terms").withIndex("by_session", (q) => q.eq("sessionId", id)).first();
    if (term) fail("INVALID", "Delete this session's terms first.");
    const application = await ctx.db.query("applications").filter((q) => q.eq(q.field("sessionId"), id)).first();
    if (application) fail("INVALID", "Applications have been made for this session, so it can't be deleted.");
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Deleted session", entity: "Session", entityId: id, previousValue: session.name });
  },
});

/** Make a term the current one (and its session the current session). */
export const setActiveTerm = mutation({
  args: { termId: v.id("terms") },
  handler: async (ctx, { termId }) => {
    const viewer = await requireAdmin(ctx);
    const term = await ctx.db.get(termId);
    if (!term) fail("NOT_FOUND", "Term not found.");
    for (const t of await ctx.db.query("terms").collect()) {
      if (t.active !== (t._id === termId)) await ctx.db.patch(t._id, { active: t._id === termId });
    }
    for (const s of await ctx.db.query("academicSessions").collect()) {
      if (s.active !== (s._id === term.sessionId)) await ctx.db.patch(s._id, { active: s._id === term.sessionId });
    }
    await audit(ctx, viewer, { action: "Set current term", entity: "Term", entityId: termId, newValue: term.name });
  },
});
