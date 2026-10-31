import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery, mutation, query, type QueryCtx } from "./_generated/server";
import { assertStudentAccess, requireAdmin, requireViewer } from "./lib/access";
import { audit, nowISO } from "./lib/util";

/**
 * Stars, badges and house points. Points are derived from what a pupil has
 * actually done — homework handed in on time and awards — so they can't drift
 * from the records. Pupils only ever see their own stars; the only shared
 * leaderboard is between houses, never between children.
 */

const HOUSES = ["Emerald", "Sapphire", "Ruby", "Amber"] as const;
type House = (typeof HOUSES)[number];

export const POINTS = {
  onTime: 10,
  late: 4,
  greatWork: 5,
  achievement: 25,
  certificate: 20,
};

const LEVELS = [
  { name: "Seedling", min: 0 },
  { name: "Explorer", min: 100 },
  { name: "Achiever", min: 250 },
  { name: "Trailblazer", min: 500 },
  { name: "Champion", min: 1000 },
  { name: "Legend", min: 2000 },
];

interface Tally {
  onTime: number;
  late: number;
  greatWork: number;
  achievements: number;
  certificates: number;
}

async function tally(ctx: QueryCtx, studentId: Id<"students">): Promise<Tally> {
  const [submissions, achievements, certificates] = await Promise.all([
    ctx.db.query("submissions").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect(),
    ctx.db.query("achievements").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect(),
    ctx.db.query("certificates").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect(),
  ]);

  const t: Tally = {
    onTime: 0,
    late: 0,
    greatWork: 0,
    achievements: achievements.length,
    certificates: certificates.filter((c) => !c.revokedAt).length,
  };

  const assignments = new Map<string, Doc<"assignments"> | null>();
  for (const s of submissions) {
    if (!assignments.has(s.assignmentId)) assignments.set(s.assignmentId, await ctx.db.get(s.assignmentId));
    const a = assignments.get(s.assignmentId);
    if (!a) continue;
    if (s.submittedAt <= a.dueDate) t.onTime += 1;
    else t.late += 1;
    if (s.status === "graded" && a.maxScore > 0 && (s.score ?? 0) / a.maxScore >= 0.8) t.greatWork += 1;
  }
  return t;
}

function score(t: Tally) {
  return (
    t.onTime * POINTS.onTime +
    t.late * POINTS.late +
    t.greatWork * POINTS.greatWork +
    t.achievements * POINTS.achievement +
    t.certificates * POINTS.certificate
  );
}

function badges(t: Tally) {
  const b = (key: string, label: string, description: string, icon: string, current: number, target: number) => ({
    key,
    label,
    description,
    icon,
    current: Math.min(current, target),
    target,
    earned: current >= target,
  });
  return [
    b("first-steps", "First Steps", "Hand in your first assignment.", "Sprout", t.onTime + t.late, 1),
    b("homework-hero", "Homework Hero", "Hand in 10 assignments on time.", "ClipboardCheck", t.onTime, 10),
    b("great-work", "Great Work", "Score 80% or more on 5 assignments.", "Trophy", t.greatWork, 5),
    b("shining-star", "Shining Star", "Earn an achievement on Our Stars.", "Sparkles", t.achievements, 1),
    b("certified", "Certified", "Receive a certificate.", "Award", t.certificates, 1),
  ];
}

function level(points: number) {
  let index = 0;
  LEVELS.forEach((l, i) => {
    if (points >= l.min) index = i;
  });
  const next = LEVELS[index + 1];
  return {
    name: LEVELS[index].name,
    number: index + 1,
    nextName: next?.name ?? null,
    nextAt: next?.min ?? null,
    progress: next ? Math.round(((points - LEVELS[index].min) / (next.min - LEVELS[index].min)) * 100) : 100,
  };
}

async function standings(ctx: QueryCtx) {
  const rows = await ctx.db.query("houseStandings").collect();
  return HOUSES.map((house) => {
    const r = rows.find((x) => x.house === house);
    return { house, points: r?.points ?? 0, pupils: r?.pupils ?? 0, computedAt: r?.computedAt ?? null };
  }).sort((a, b) => b.points - a.points);
}

/* --------------------------------- queries -------------------------------- */

export const forStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, { studentId }) => {
    const viewer = await requireViewer(ctx);
    await assertStudentAccess(ctx, viewer, studentId);
    const student = await ctx.db.get(studentId);
    if (!student) return null;
    const t = await tally(ctx, studentId);
    const total = score(t);
    return { house: student.house, points: total, level: level(total), badges: badges(t) };
  },
});

export const houseStandings = query({
  args: {},
  handler: async (ctx) => {
    await requireViewer(ctx);
    return await standings(ctx);
  },
});

/* ------------------------------ house points ------------------------------ */

export const houseBatch = internalQuery({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query("students").paginate({ cursor, numItems: 25 });
    const totals: Record<string, { points: number; pupils: number }> = {};
    for (const s of page.page) {
      if (s.status !== "active") continue;
      const entry = (totals[s.house] ??= { points: 0, pupils: 0 });
      entry.points += score(await tally(ctx, s._id));
      entry.pupils += 1;
    }
    return { totals, cursor: page.continueCursor, done: page.isDone };
  },
});

export const saveStandings = internalMutation({
  args: { totals: v.record(v.string(), v.object({ points: v.number(), pupils: v.number() })) },
  handler: async (ctx, { totals }) => {
    const at = nowISO();
    for (const house of HOUSES) {
      const value = totals[house] ?? { points: 0, pupils: 0 };
      const existing = await ctx.db.query("houseStandings").withIndex("by_house", (q) => q.eq("house", house)).unique();
      if (existing) await ctx.db.patch(existing._id, { ...value, computedAt: at });
      else await ctx.db.insert("houseStandings", { house: house as House, ...value, computedAt: at });
    }
  },
});

/** Recompute every house's total, a page of pupils at a time. Runs nightly. */
export const recompute = internalAction({
  args: {},
  handler: async (ctx) => {
    const totals: Record<string, { points: number; pupils: number }> = {};
    let cursor: string | null = null;
    for (;;) {
      const batch: { totals: Record<string, { points: number; pupils: number }>; cursor: string; done: boolean } = await ctx.runQuery(
        internal.gamification.houseBatch,
        { cursor },
      );
      for (const [house, t] of Object.entries(batch.totals)) {
        const entry = (totals[house] ??= { points: 0, pupils: 0 });
        entry.points += t.points;
        entry.pupils += t.pupils;
      }
      if (batch.done) break;
      cursor = batch.cursor;
    }
    await ctx.runMutation(internal.gamification.saveStandings, { totals });
    return totals;
  },
});

export const requestRecompute = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireAdmin(ctx);
    await ctx.scheduler.runAfter(0, internal.gamification.recompute, {});
    await audit(ctx, viewer, { action: "Recalculated house points", entity: "Gamification", entityId: "houses" });
  },
});
