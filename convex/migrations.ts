import { v } from "convex/values";

import { CLASS_LEVELS } from "../lib/school/config";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

/**
 * One-off: merge A/B/C class arms into a single class per level.
 *
 *   npx convex run migrations:mergeClassArms '{"dryRun":true}'   # report only
 *   npx convex run migrations:mergeClassArms                     # do it
 *
 * For each level the first arm (A) is kept and renamed to the level name
 * ("Primary 4A" -> "Primary 4"). Every pupil, subject-teacher row, assignment,
 * score, report card and timetable slot of the other arms moves to it, then
 * the other arms are deleted. Where both arms had the same subject teacher
 * slot, timetable period or mid-term publication, the kept class's row wins.
 * The kept class's capacity becomes the arms' combined capacity, and its
 * old block/room label is removed.
 */

const BATCH = 400;

type ClassRef = { id: Id<"classes">; name: string };
type Plan = { level: string; keep: ClassRef | null; merge: ClassRef[]; capacity: number }[];

export const plan = internalQuery({
  args: {},
  handler: async (ctx): Promise<Plan> => {
    const classes = await ctx.db.query("classes").collect();
    return CLASS_LEVELS.map((level) => {
      const arms = classes
        .filter((c) => c.levelId === level.id)
        .sort((a, b) => (a.section ?? "").localeCompare(b.section ?? "") || a.name.localeCompare(b.name));
      const [keep, ...others] = arms;
      return {
        level: level.name,
        keep: keep ? { id: keep._id, name: keep.name } : null,
        merge: others.map((c) => ({ id: c._id, name: c.name })),
        capacity: arms.reduce((n, c) => n + c.capacity, 0),
      };
    });
  },
});

const movable = v.union(
  v.literal("students"),
  v.literal("teachingAssignments"),
  v.literal("assignments"),
  v.literal("results"),
  v.literal("midtermScores"),
  v.literal("midtermPublications"),
  v.literal("reportCards"),
  v.literal("timetable"),
);

/** Move up to BATCH rows of one table from one class to another. Returns how many it touched. */
export const moveBatch = internalMutation({
  args: { table: movable, from: v.id("classes"), to: v.id("classes") },
  handler: async (ctx, { table, from, to }) => {
    switch (table) {
      case "students": {
        const rows = await ctx.db.query("students").withIndex("by_class", (q) => q.eq("classId", from)).take(BATCH);
        for (const r of rows) await ctx.db.patch(r._id, { classId: to });
        return rows.length;
      }
      case "assignments": {
        const rows = await ctx.db.query("assignments").withIndex("by_class", (q) => q.eq("classId", from)).take(BATCH);
        for (const r of rows) await ctx.db.patch(r._id, { classId: to });
        return rows.length;
      }
      case "results": {
        const rows = await ctx.db.query("results").withIndex("by_class_term", (q) => q.eq("classId", from)).take(BATCH);
        for (const r of rows) await ctx.db.patch(r._id, { classId: to });
        return rows.length;
      }
      case "midtermScores": {
        const rows = await ctx.db.query("midtermScores").withIndex("by_class_term", (q) => q.eq("classId", from)).take(BATCH);
        for (const r of rows) await ctx.db.patch(r._id, { classId: to });
        return rows.length;
      }
      case "reportCards": {
        const rows = await ctx.db.query("reportCards").withIndex("by_class_term", (q) => q.eq("classId", from)).take(BATCH);
        for (const r of rows) await ctx.db.patch(r._id, { classId: to });
        return rows.length;
      }
      case "teachingAssignments": {
        const rows = await ctx.db.query("teachingAssignments").withIndex("by_class", (q) => q.eq("classId", from)).take(BATCH);
        for (const r of rows) {
          const taken = await ctx.db
            .query("teachingAssignments")
            .withIndex("by_class_subject", (q) => q.eq("classId", to).eq("subjectId", r.subjectId))
            .first();
          if (taken) await ctx.db.delete(r._id);
          else await ctx.db.patch(r._id, { classId: to });
        }
        return rows.length;
      }
      case "timetable": {
        const rows = await ctx.db.query("timetable").withIndex("by_class", (q) => q.eq("classId", from)).take(BATCH);
        for (const r of rows) {
          const taken = await ctx.db
            .query("timetable")
            .withIndex("by_class", (q) => q.eq("classId", to).eq("day", r.day).eq("period", r.period))
            .first();
          if (taken) await ctx.db.delete(r._id);
          else await ctx.db.patch(r._id, { classId: to });
        }
        return rows.length;
      }
      case "midtermPublications": {
        const rows = await ctx.db.query("midtermPublications").withIndex("by_class_term", (q) => q.eq("classId", from)).take(BATCH);
        for (const r of rows) {
          const taken = await ctx.db
            .query("midtermPublications")
            .withIndex("by_class_term", (q) => q.eq("classId", to).eq("termId", r.termId))
            .first();
          if (taken) await ctx.db.delete(r._id);
          else await ctx.db.patch(r._id, { classId: to });
        }
        return rows.length;
      }
    }
  },
});

export const finishLevel = internalMutation({
  args: { keep: v.id("classes"), remove: v.array(v.id("classes")), name: v.string(), capacity: v.number() },
  handler: async (ctx, { keep, remove, name, capacity }) => {
    for (const id of remove) await ctx.db.delete(id);
    await ctx.db.patch(keep, { name, section: undefined, room: undefined, capacity: Math.min(200, Math.max(1, capacity)) });
  },
});

const TABLES = [
  "students", "teachingAssignments", "assignments", "results",
  "midtermScores", "midtermPublications", "reportCards", "timetable",
] as const;

export const mergeClassArms = internalAction({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun = false }): Promise<Plan | string[]> => {
    const levels: Plan = await ctx.runQuery(internal.migrations.plan, {});
    if (dryRun) return levels;
    const report: string[] = [];
    for (const level of levels) {
      if (!level.keep) continue;
      const keep = level.keep.id;
      for (const other of level.merge) {
        for (const table of TABLES) {
          while ((await ctx.runMutation(internal.migrations.moveBatch, { table, from: other.id, to: keep })) > 0) {
            /* keep moving */
          }
        }
      }
      await ctx.runMutation(internal.migrations.finishLevel, {
        keep,
        remove: level.merge.map((c) => c.id),
        name: level.level,
        capacity: level.capacity,
      });
      report.push(level.merge.length ? `${level.level}: merged ${[level.keep.name, ...level.merge.map((c) => c.name)].join(", ")}` : `${level.level}: renamed ${level.keep.name}`);
    }
    return report;
  },
});

/**
 * One-off: cash is no longer a payment method. Re-label existing cash payments as POS.
 *
 *   npx convex run migrations:cashToPos '{"dryRun":true}'   # report only
 *   npx convex run migrations:cashToPos                     # do it
 */
export const cashToPos = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun }) => {
    const cash = (await ctx.db.query("payments").collect()).filter((p) => p.provider === "cash");
    if (!dryRun) for (const p of cash) await ctx.db.patch(p._id, { provider: "pos" });
    return { cashPayments: cash.length, updated: dryRun ? 0 : cash.length };
  },
});
