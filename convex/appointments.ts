import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import {
  canAccessStudent,
  fail,
  parentStudentIds,
  requireRole,
  requireStaff,
  requireViewer,
} from "./lib/access";
import { audit, notify, todayKey, withId } from "./lib/util";

type Ctx = QueryCtx | MutationCtx;

/** Teachers a parent may meet about a child: the class teacher and every subject teacher. */
async function teachersOfStudent(ctx: Ctx, studentId: Id<"students">): Promise<Set<Id<"teachers">>> {
  const ids = new Set<Id<"teachers">>();
  const child = await ctx.db.get(studentId);
  if (!child) return ids;
  const cls = await ctx.db.get(child.classId);
  if (cls?.classTeacherId) ids.add(cls.classTeacherId);
  const rows = await ctx.db.query("teachingAssignments").withIndex("by_class", (q) => q.eq("classId", child.classId)).collect();
  rows.forEach((r) => ids.add(r.teacherId));
  return ids;
}

async function findSlot(ctx: Ctx, teacherId: Id<"teachers">, date: string, time: string) {
  const slots = await ctx.db
    .query("availability")
    .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId).eq("date", date))
    .collect();
  return slots.find((s) => s.time === time) ?? null;
}

async function teacherUser(ctx: Ctx, teacherId: Id<"teachers">) {
  const user = await ctx.db.query("users").withIndex("by_teacher", (q) => q.eq("teacherId", teacherId)).first();
  return user?.active ? user : null;
}

async function parentUser(ctx: Ctx, parentId: Id<"parents">) {
  const user = await ctx.db.query("users").withIndex("by_parent", (q) => q.eq("parentId", parentId)).first();
  return user?.active ? user : null;
}

const isOpen = (a: Doc<"appointments">) => a.status !== "cancelled" && a.status !== "completed";

async function assertBookableSlot(ctx: Ctx, slot: Doc<"availability"> | null, studentId: Id<"students">) {
  if (!slot) fail("NOT_FOUND", "That slot is no longer available.");
  if (slot.taken) fail("CONFLICT", "Someone has just taken that slot. Please choose another.");
  if (slot.date < todayKey()) fail("INVALID", "That slot is in the past.");
  if (!(await teachersOfStudent(ctx, studentId)).has(slot.teacherId)) fail("FORBIDDEN", "That teacher doesn't teach this child.");
  return slot;
}

export const forParent = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, "parent");
    if (!viewer.parentId) return { appointments: [], slots: [] };
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_parent", (q) => q.eq("parentId", viewer.parentId!))
      .collect();
    // Open slots from the children's teachers only.
    const teacherIds = new Set<Id<"teachers">>();
    for (const sid of await parentStudentIds(ctx, viewer.parentId)) {
      for (const tid of await teachersOfStudent(ctx, sid)) teacherIds.add(tid);
    }
    const today = todayKey();
    const slots = [];
    for (const tid of teacherIds) {
      const rows = await ctx.db
        .query("availability")
        .withIndex("by_teacher", (q) => q.eq("teacherId", tid).gte("date", today))
        .collect();
      slots.push(...rows.filter((s) => !s.taken).map(withId));
    }
    return {
      appointments: appointments.map(withId).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
      slots: slots.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    };
  },
});

export const forTeacher = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireStaff(ctx);
    if (!viewer.teacherId) return { appointments: [], slots: [] };
    const [appointments, slots] = await Promise.all([
      ctx.db.query("appointments").withIndex("by_teacher", (q) => q.eq("teacherId", viewer.teacherId!)).collect(),
      ctx.db.query("availability").withIndex("by_teacher", (q) => q.eq("teacherId", viewer.teacherId!).gte("date", todayKey())).collect(),
    ]);
    const parents = await Promise.all(appointments.map((a) => ctx.db.get(a.parentId)));
    const children = await Promise.all(appointments.map((a) => ctx.db.get(a.studentId)));
    return {
      appointments: appointments
        .map((a, i) => ({
          ...withId(a),
          parentName: parents[i] ? `${parents[i]!.title} ${parents[i]!.firstName} ${parents[i]!.lastName}` : "Parent",
          parentPhone: parents[i]?.phone ?? "",
          child: children[i] ? { firstName: children[i]!.firstName, lastName: children[i]!.lastName, classId: children[i]!.classId } : null,
        }))
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
      slots: slots.map(withId).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    };
  },
});

/* --------------------------------- teacher -------------------------------- */

export const addSlot = mutation({
  args: { date: v.string(), time: v.string() },
  handler: async (ctx, { date, time }) => {
    const viewer = await requireStaff(ctx);
    if (!viewer.teacherId) fail("FORBIDDEN", "This account is not linked to a teacher.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) fail("INVALID", "Choose a date and a time.");
    if (date < todayKey()) fail("INVALID", "Choose a date in the future.");
    if (await findSlot(ctx, viewer.teacherId, date, time)) fail("CONFLICT", "That slot is already published.");
    await ctx.db.insert("availability", { teacherId: viewer.teacherId, date, time, taken: false });
  },
});

export const removeSlot = mutation({
  args: { id: v.id("availability") },
  handler: async (ctx, { id }) => {
    const viewer = await requireStaff(ctx);
    const slot = await ctx.db.get(id);
    if (!slot) return;
    if (slot.teacherId !== viewer.teacherId) fail("FORBIDDEN", "You can only remove your own slots.");
    if (slot.taken) fail("CONFLICT", "A parent has booked this slot. Cancel the meeting instead.");
    await ctx.db.delete(id);
  },
});

export const complete = mutation({
  args: { id: v.id("appointments") },
  handler: async (ctx, { id }) => {
    const viewer = await requireStaff(ctx);
    const appt = await ctx.db.get(id);
    if (!appt) fail("NOT_FOUND", "Appointment not found.");
    if (appt.teacherId !== viewer.teacherId) fail("FORBIDDEN", "Only the teacher can mark this meeting as held.");
    if (!isOpen(appt)) fail("INVALID", "This meeting is already closed.");
    if (appt.date > todayKey()) fail("INVALID", "You can mark a meeting as held on or after its date.");
    await ctx.db.patch(id, { status: "completed" });
  },
});

/* ---------------------------------- parent -------------------------------- */

export const book = mutation({
  args: {
    slotId: v.id("availability"),
    studentId: v.id("students"),
    mode: v.union(v.literal("in_person"), v.literal("virtual")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireRole(ctx, "parent");
    if (!viewer.parentId) fail("FORBIDDEN", "This account is not linked to a parent.");
    if (!(await canAccessStudent(ctx, viewer, args.studentId))) fail("FORBIDDEN", "You can only book for your own children.");
    const slot = await assertBookableSlot(ctx, await ctx.db.get(args.slotId), args.studentId);
    await ctx.db.patch(slot._id, { taken: true });
    const id = await ctx.db.insert("appointments", {
      teacherId: slot.teacherId,
      parentId: viewer.parentId,
      studentId: args.studentId,
      date: slot.date,
      time: slot.time,
      mode: args.mode,
      status: "confirmed",
      note: args.note?.trim().slice(0, 500) || undefined,
    });
    await notify(ctx, viewer._id, {
      type: "appointment",
      title: "Parent-teacher appointment confirmed",
      body: `Your meeting is confirmed for ${slot.date} at ${slot.time}.`,
      href: "/portal/parent/appointments",
    });
    const teacher = await teacherUser(ctx, slot.teacherId);
    if (teacher) {
      await notify(ctx, teacher._id, {
        type: "appointment",
        title: `New appointment with ${viewer.name}`,
        body: `${slot.date} at ${slot.time}.`,
        href: "/portal/teacher/appointments",
      });
    }
    await audit(ctx, viewer, { action: "Booked appointment", entity: "Appointment", entityId: id, newValue: `${slot.date} ${slot.time}` });
  },
});

/** Move a meeting to another open slot with the same teacher, in one step. */
export const reschedule = mutation({
  args: { id: v.id("appointments"), slotId: v.id("availability") },
  handler: async (ctx, { id, slotId }) => {
    const viewer = await requireRole(ctx, "parent");
    const appt = await ctx.db.get(id);
    if (!appt || appt.parentId !== viewer.parentId) fail("NOT_FOUND", "Appointment not found.");
    if (!isOpen(appt)) fail("INVALID", "This meeting can no longer be changed.");
    const slot = await assertBookableSlot(ctx, await ctx.db.get(slotId), appt.studentId);
    if (slot.teacherId !== appt.teacherId) fail("INVALID", "Choose another slot with the same teacher.");

    const old = await findSlot(ctx, appt.teacherId, appt.date, appt.time);
    if (old) await ctx.db.patch(old._id, { taken: false });
    await ctx.db.patch(slot._id, { taken: true });
    await ctx.db.patch(id, { date: slot.date, time: slot.time, status: "rescheduled" });

    await notify(ctx, viewer._id, {
      type: "appointment",
      title: "Meeting rescheduled",
      body: `Your meeting is now on ${slot.date} at ${slot.time}.`,
      href: "/portal/parent/appointments",
    });
    const teacher = await teacherUser(ctx, appt.teacherId);
    if (teacher) {
      await notify(ctx, teacher._id, {
        type: "appointment",
        title: `${viewer.name} moved a meeting`,
        body: `From ${appt.date} ${appt.time} to ${slot.date} at ${slot.time}.`,
        href: "/portal/teacher/appointments",
      });
    }
    await audit(ctx, viewer, {
      action: "Rescheduled appointment",
      entity: "Appointment",
      entityId: id,
      previousValue: `${appt.date} ${appt.time}`,
      newValue: `${slot.date} ${slot.time}`,
    });
  },
});

export const cancel = mutation({
  args: { id: v.id("appointments") },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const appt = await ctx.db.get(id);
    if (!appt) return;
    const byParent = Boolean(viewer.parentId) && appt.parentId === viewer.parentId;
    const byTeacher = Boolean(viewer.teacherId) && appt.teacherId === viewer.teacherId;
    if (!byParent && !byTeacher) fail("FORBIDDEN", "You can't cancel this appointment.");
    if (!isOpen(appt)) return;
    await ctx.db.patch(id, { status: "cancelled" });
    const slot = await findSlot(ctx, appt.teacherId, appt.date, appt.time);
    // Free the slot so someone else can book it, unless it has already passed.
    if (slot && appt.date >= todayKey()) await ctx.db.patch(slot._id, { taken: false });

    const other = byParent ? await teacherUser(ctx, appt.teacherId) : await parentUser(ctx, appt.parentId);
    if (other) {
      await notify(ctx, other._id, {
        type: "appointment",
        title: "Meeting cancelled",
        body: `${viewer.name} cancelled the meeting on ${appt.date} at ${appt.time}.`,
        href: byParent ? "/portal/teacher/appointments" : "/portal/parent/appointments",
      });
    }
    await audit(ctx, viewer, { action: "Cancelled appointment", entity: "Appointment", entityId: id, previousValue: appt.status });
  },
});
