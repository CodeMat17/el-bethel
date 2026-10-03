import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  assertStudentAccess,
  assertTeachesClass,
  requireAdmin,
  requireStaff,
  requireViewer,
} from "./lib/access";
import { audit, notify, nowISO, todayKey, withId } from "./lib/util";
import { attendanceStatus } from "./validators";

export const forStudent = query({
  args: { studentId: v.id("students"), limit: v.optional(v.number()) },
  handler: async (ctx, { studentId, limit }) => {
    const viewer = await requireViewer(ctx);
    await assertStudentAccess(ctx, viewer, studentId);
    const rows = await ctx.db
      .query("attendance")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .order("desc")
      .take(limit ?? 400);
    return rows.map(withId);
  },
});

/** One class's register for one day. */
export const classDay = query({
  args: { classId: v.id("classes"), date: v.string() },
  handler: async (ctx, { classId, date }) => {
    const viewer = await requireStaff(ctx);
    await assertTeachesClass(ctx, viewer, classId);
    const rows = await ctx.db
      .query("attendance")
      .withIndex("by_class_date", (q) => q.eq("classId", classId).eq("date", date))
      .collect();
    return rows.map(withId);
  },
});

/** Recent register history for a class (dates and rates). */
export const classHistory = query({
  args: { classId: v.id("classes"), days: v.optional(v.number()) },
  handler: async (ctx, { classId, days }) => {
    const viewer = await requireStaff(ctx);
    await assertTeachesClass(ctx, viewer, classId);
    const rows = await ctx.db
      .query("attendance")
      .withIndex("by_class_date", (q) => q.eq("classId", classId))
      .order("desc")
      .take(2000);
    const byDate = new Map<string, { present: number; total: number }>();
    for (const r of rows) {
      const e = byDate.get(r.date) ?? { present: 0, total: 0 };
      e.total += 1;
      if (r.status === "present" || r.status === "late") e.present += 1;
      byDate.set(r.date, e);
    }
    return [...byDate.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, days ?? 10)
      .map(([date, e]) => ({ date, present: e.present, total: e.total, rate: e.total ? Math.round((e.present / e.total) * 100) : 0 }));
  },
});

export const save = mutation({
  args: {
    classId: v.id("classes"),
    date: v.string(),
    entries: v.array(v.object({ studentId: v.id("students"), status: attendanceStatus, note: v.optional(v.string()) })),
  },
  handler: async (ctx, { classId, date, entries }) => {
    const viewer = await requireStaff(ctx);
    await assertTeachesClass(ctx, viewer, classId);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid date.");
    if (date > todayKey()) throw new Error("You can't take a register for a future date.");

    let changed = 0;
    for (const entry of entries) {
      const student = await ctx.db.get(entry.studentId);
      if (!student || student.classId !== classId) continue;
      const note = entry.note?.trim() || undefined;
      const existing = await ctx.db
        .query("attendance")
        .withIndex("by_student", (q) => q.eq("studentId", entry.studentId).eq("date", date))
        .first();
      if (existing) {
        if (existing.status === entry.status && (existing.note ?? "") === (note ?? "")) continue;
        await ctx.db.patch(existing._id, { status: entry.status, note, recordedBy: viewer._id });
      } else {
        await ctx.db.insert("attendance", { studentId: entry.studentId, classId, date, status: entry.status, note, recordedBy: viewer._id });
      }
      changed += 1;

      if (entry.status === "absent" && existing?.status !== "absent") {
        const links = await ctx.db
          .query("guardianships")
          .withIndex("by_student", (q) => q.eq("studentId", student._id))
          .collect();
        for (const link of links) {
          const parent = await ctx.db
            .query("users")
            .withIndex("by_parent", (q) => q.eq("parentId", link.parentId))
            .first();
          if (parent?.active) {
            await notify(ctx, parent._id, {
              type: "attendance_alert",
              title: "Attendance notice",
              body: `${student.firstName} was marked absent on ${date}.`,
              href: "/portal/parent/attendance",
            });
          }
        }
      }
    }
    const cls = await ctx.db.get(classId);
    await audit(ctx, viewer, { action: "Recorded class attendance", entity: "Attendance", entityId: `${classId}:${date}`, newValue: `${cls?.name ?? ""} · ${entries.length} pupils` });
    return { saved: entries.length, changed, at: nowISO() };
  },
});

/** School-wide attendance for a day plus a recent trend (admin dashboard and reports). */
export const schoolOverview = query({
  args: { date: v.optional(v.string()), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // The trend covers the last three weeks of registers only.
    const since = new Date(Date.now() - 21 * 86400000).toISOString().slice(0, 10);
    const recent = await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.gte("date", since))
      .take(12000);
    const byDate = new Map<string, { present: number; late: number; absent: number; excused: number; total: number }>();
    const byClass = new Map<string, { present: number; late: number; absent: number; excused: number; total: number }>();
    const overall = { present: 0, late: 0, absent: 0, excused: 0, total: 0 };
    const byClassDate = new Map<string, { present: number; total: number }>();
    for (const r of recent) {
      const e = byDate.get(r.date) ?? { present: 0, late: 0, absent: 0, excused: 0, total: 0 };
      e[r.status] += 1;
      e.total += 1;
      byDate.set(r.date, e);
      const k = byClass.get(r.classId) ?? { present: 0, late: 0, absent: 0, excused: 0, total: 0 };
      k[r.status] += 1;
      k.total += 1;
      byClass.set(r.classId, k);
      overall[r.status] += 1;
      overall.total += 1;
      const key = `${r.classId}|${r.date}`;
      const c = byClassDate.get(key) ?? { present: 0, total: 0 };
      c.total += 1;
      if (r.status === "present" || r.status === "late") c.present += 1;
      byClassDate.set(key, c);
    }
    const dates = [...byDate.keys()].sort().reverse();
    const date = args.date && byDate.has(args.date) ? args.date : (dates.find((d) => d <= todayKey()) ?? dates[0] ?? todayKey());
    const day = byDate.get(date) ?? { present: 0, late: 0, absent: 0, excused: 0, total: 0 };
    const rate = (e: { present: number; late?: number; total: number }) =>
      e.total ? Math.round(((e.present + (e.late ?? 0)) / e.total) * 100) : 0;
    const classes = [...byClassDate.entries()]
      .filter(([k]) => k.endsWith(`|${date}`))
      .map(([k, e]) => ({ classId: k.split("|")[0], present: e.present, total: e.total, rate: e.total ? Math.round((e.present / e.total) * 100) : 0 }));
    return {
      date,
      day: { ...day, rate: rate(day) },
      overall: { ...overall, rate: rate(overall) },
      byClass: [...byClass.entries()].map(([classId, e]) => ({ classId, ...e, rate: rate(e) })),
      classes,
      trend: dates
        .slice(0, args.days ?? 10)
        .reverse()
        .map((d) => ({ date: d, rate: rate(byDate.get(d)!) })),
    };
  },
});
