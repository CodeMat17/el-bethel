import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { assertStudentAccess, fail, isAdmin, requireAdmin, requireViewer, type Viewer } from "./lib/access";
import { accountsForStudent, audit, notify, nowISO, todayKey, withId } from "./lib/util";
import { cloudMedia } from "./validators";

/**
 * The advanced digital library: e-books, audiobooks and read-along videos
 * matched to each pupil's class level, a reading diary with streaks and a
 * termly goal, and holds on library books whose copies are all out.
 */

type Ctx = QueryCtx | MutationCtx;

/** Termly reading goal shown to pupils and parents, in minutes. */
export const TERM_GOAL_MINUTES = 900;
const MAX_WAITING_HOLDS = 2;

const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

async function levelOf(ctx: Ctx, studentId: Id<"students">) {
  const s = await ctx.db.get(studentId);
  const cls = s ? await ctx.db.get(s.classId) : null;
  return cls?.levelId ?? null;
}

const suits = (r: Doc<"digitalResources">, levelId: string | null) => r.levelIds.length === 0 || (levelId !== null && r.levelIds.includes(levelId));

/** Consecutive days, ending today or yesterday, with at least one diary entry. */
function streak(days: Set<string>): number {
  let day = todayKey();
  if (!days.has(day)) day = addDays(day, -1);
  let n = 0;
  while (days.has(day)) {
    n += 1;
    day = addDays(day, -1);
  }
  return n;
}

/** Can this viewer write to the pupil's reading diary? The pupil, their parents, staff. */
async function assertDiaryAccess(ctx: Ctx, viewer: Viewer, studentId: Id<"students">) {
  await assertStudentAccess(ctx, viewer, studentId);
}

/* --------------------------------- readers -------------------------------- */

/** The pupil's digital shelf, reading diary, goal progress, holds and suggestions. */
export const shelf = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, { studentId }) => {
    const viewer = await requireViewer(ctx);
    await assertStudentAccess(ctx, viewer, studentId);
    const levelId = await levelOf(ctx, studentId);
    const resources = (await ctx.db.query("digitalResources").withIndex("by_published", (q) => q.eq("published", true)).collect()).filter((r) =>
      suits(r, levelId),
    );
    const logs = await ctx.db
      .query("readingLogs")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .order("desc")
      .take(400);
    const term = await ctx.db
      .query("terms")
      .withIndex("by_active", (q) => q.eq("active", true))
      .first();
    const termStart = term?.startDate.slice(0, 10) ?? addDays(todayKey(), -90);
    const weekStart = addDays(todayKey(), -6);
    const termLogs = logs.filter((l) => l.date >= termStart);

    // Suggestions: suitable titles not yet read, favouring categories the pupil reads most.
    const readIds = new Set(logs.map((l) => l.resourceId).filter(Boolean));
    const favourite = new Map<string, number>();
    for (const l of logs) {
      const r = l.resourceId ? resources.find((x) => x._id === l.resourceId) : undefined;
      if (r) favourite.set(r.category, (favourite.get(r.category) ?? 0) + l.minutes);
    }
    const suggestions = resources
      .filter((r) => !readIds.has(r._id))
      .sort((a, b) => (favourite.get(b.category) ?? 0) - (favourite.get(a.category) ?? 0) || b.opens - a.opens)
      .slice(0, 4)
      .map((r) => r._id);

    const holds = await ctx.db.query("bookReservations").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect();
    const openHolds = [];
    for (const h of holds.filter((x) => x.status === "waiting" || x.status === "ready")) {
      const book = await ctx.db.get(h.bookId);
      const queue = await ctx.db.query("bookReservations").withIndex("by_book", (q) => q.eq("bookId", h.bookId).eq("status", "waiting")).collect();
      openHolds.push({
        ...withId(h),
        title: book?.title ?? "—",
        author: book?.author ?? "",
        position: h.status === "waiting" ? queue.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).findIndex((x) => x._id === h._id) + 1 : 0,
      });
    }

    return {
      resources: resources.map(withId).sort((a, b) => a.title.localeCompare(b.title)),
      suggestions,
      logs: logs.slice(0, 40).map(withId),
      holds: openHolds,
      stats: {
        weekMinutes: logs.filter((l) => l.date >= weekStart).reduce((n, l) => n + l.minutes, 0),
        termMinutes: termLogs.reduce((n, l) => n + l.minutes, 0),
        termGoal: TERM_GOAL_MINUTES,
        booksFinished: termLogs.filter((l) => l.finished).length,
        streak: streak(new Set(logs.map((l) => l.date))),
      },
    };
  },
});

/** Counts an opening, and returns where the title opens. */
export const open = mutation({
  args: { id: v.id("digitalResources") },
  handler: async (ctx, { id }) => {
    await requireViewer(ctx);
    const r = await ctx.db.get(id);
    if (!r || !r.published) fail("NOT_FOUND", "That title is no longer in the digital library.");
    await ctx.db.patch(id, { opens: r.opens + 1 });
    return r.url;
  },
});

export const logReading = mutation({
  args: {
    studentId: v.id("students"),
    title: v.string(),
    resourceId: v.optional(v.id("digitalResources")),
    bookId: v.optional(v.id("books")),
    minutes: v.number(),
    date: v.string(),
    finished: v.boolean(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const viewer = await requireViewer(ctx);
    await assertDiaryAccess(ctx, viewer, a.studentId);
    let title = a.title.trim().slice(0, 160);
    if (a.resourceId) title = (await ctx.db.get(a.resourceId))?.title ?? title;
    if (a.bookId) title = (await ctx.db.get(a.bookId))?.title ?? title;
    if (title.length < 2) fail("INVALID", "What was read? Enter the title.");
    if (!Number.isInteger(a.minutes) || a.minutes < 1 || a.minutes > 300) fail("INVALID", "Minutes must be between 1 and 300.");
    const today = todayKey();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date) || a.date > today) fail("INVALID", "Choose today or an earlier day.");
    if (a.date < addDays(today, -30)) fail("INVALID", "Reading can be logged for the last 30 days only.");
    const id = await ctx.db.insert("readingLogs", {
      studentId: a.studentId,
      title,
      resourceId: a.resourceId,
      bookId: a.bookId,
      minutes: a.minutes,
      date: a.date,
      finished: a.finished,
      note: a.note?.trim().slice(0, 300) || undefined,
      loggedBy: viewer._id,
      createdAt: nowISO(),
    });
    return id;
  },
});

export const removeLog = mutation({
  args: { id: v.id("readingLogs") },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const log = await ctx.db.get(id);
    if (!log) return;
    if (log.loggedBy !== viewer._id && !isAdmin(viewer)) fail("FORBIDDEN", "Only the person who added this entry can remove it.");
    await ctx.db.delete(id);
  },
});

/** Join the queue for a book whose copies are all on loan. */
export const reserve = mutation({
  args: { bookId: v.id("books"), studentId: v.id("students") },
  handler: async (ctx, { bookId, studentId }) => {
    const viewer = await requireViewer(ctx);
    await assertDiaryAccess(ctx, viewer, studentId);
    const [book, student] = await Promise.all([ctx.db.get(bookId), ctx.db.get(studentId)]);
    if (!book) fail("NOT_FOUND", "Book not found.");
    if (!student || student.status !== "active") fail("NOT_FOUND", "Pupil not found.");
    const ready = await ctx.db.query("bookReservations").withIndex("by_book", (q) => q.eq("bookId", bookId).eq("status", "ready")).collect();
    if (book.copiesAvailable > ready.length) fail("CONFLICT", "A copy is on the shelf now — ask at the library desk to borrow it.");
    const mine = await ctx.db.query("bookReservations").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect();
    if (mine.some((h) => h.bookId === bookId && (h.status === "waiting" || h.status === "ready"))) fail("CONFLICT", `${student.firstName} is already in the queue for this book.`);
    if (mine.filter((h) => h.status === "waiting").length >= MAX_WAITING_HOLDS) fail("CONFLICT", `${student.firstName} can wait for ${MAX_WAITING_HOLDS} books at a time.`);
    const onLoan = await ctx.db.query("borrowings").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect();
    if (onLoan.some((l) => l.bookId === bookId && !l.returnedAt)) fail("CONFLICT", `${student.firstName} already has this book.`);
    await ctx.db.insert("bookReservations", { bookId, studentId, status: "waiting", createdAt: nowISO() });
  },
});

export const cancelReservation = mutation({
  args: { id: v.id("bookReservations") },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const hold = await ctx.db.get(id);
    if (!hold) return;
    await assertDiaryAccess(ctx, viewer, hold.studentId);
    if (hold.status !== "waiting" && hold.status !== "ready") return;
    await ctx.db.patch(id, { status: "cancelled", closedAt: nowISO() });
    if (hold.status === "ready") await promoteNextHold(ctx, hold.bookId);
  },
});

/**
 * When a copy comes back (or a ready hold is given up), the next pupil waiting
 * for that book is told it is set aside for them. Called from library returns.
 */
export async function promoteNextHold(ctx: MutationCtx, bookId: Id<"books">) {
  const book = await ctx.db.get(bookId);
  if (!book) return;
  const ready = await ctx.db.query("bookReservations").withIndex("by_book", (q) => q.eq("bookId", bookId).eq("status", "ready")).collect();
  if (book.copiesAvailable <= ready.length) return;
  const waiting = (await ctx.db.query("bookReservations").withIndex("by_book", (q) => q.eq("bookId", bookId).eq("status", "waiting")).collect()).sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt),
  );
  const next = waiting[0];
  if (!next) return;
  await ctx.db.patch(next._id, { status: "ready", readyAt: nowISO() });
  for (const userId of await accountsForStudent(ctx, next.studentId)) {
    const user = await ctx.db.get(userId);
    await notify(ctx, userId, {
      type: "library_reservation",
      title: `"${book.title}" is waiting at the library desk`,
      body: "The book you reserved is set aside. Collect it within five school days.",
      href: user?.studentId ? "/portal/pupil/library" : "/portal/parent/library",
    });
  }
}

/** Copies set aside for other pupils' holds can't be lent to someone else. */
export async function assertCopyFree(ctx: MutationCtx, book: Doc<"books">, studentId: Id<"students">) {
  const ready = await ctx.db.query("bookReservations").withIndex("by_book", (q) => q.eq("bookId", book._id).eq("status", "ready")).collect();
  const forOthers = ready.filter((h) => h.studentId !== studentId).length;
  if (book.copiesAvailable - forOthers < 1) fail("CONFLICT", "The copies on the shelf are set aside for pupils who reserved this book.");
}

/** A pupil collected the book they were holding. */
export async function fulfilHold(ctx: MutationCtx, bookId: Id<"books">, studentId: Id<"students">) {
  const holds = await ctx.db.query("bookReservations").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect();
  for (const h of holds.filter((x) => x.bookId === bookId && (x.status === "ready" || x.status === "waiting"))) {
    await ctx.db.patch(h._id, { status: "fulfilled", closedAt: nowISO() });
  }
}

/* ---------------------------------- admin --------------------------------- */

export const adminOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const resources = (await ctx.db.query("digitalResources").collect()).map(withId).sort((a, b) => a.title.localeCompare(b.title));
    const holdRows = [
      ...(await ctx.db.query("bookReservations").withIndex("by_status", (q) => q.eq("status", "ready")).collect()),
      ...(await ctx.db.query("bookReservations").withIndex("by_status", (q) => q.eq("status", "waiting")).collect()),
    ];
    const holds = [];
    for (const h of holdRows) {
      const [book, s] = await Promise.all([ctx.db.get(h.bookId), ctx.db.get(h.studentId)]);
      holds.push({ ...withId(h), title: book?.title ?? "—", studentName: s ? `${s.firstName} ${s.lastName}` : "—", classId: s?.classId ?? null });
    }
    const since = addDays(todayKey(), -30);
    const recent = (await ctx.db.query("readingLogs").collect()).filter((l) => l.date >= since);
    const byPupil = new Map<string, number>();
    for (const l of recent) byPupil.set(l.studentId, (byPupil.get(l.studentId) ?? 0) + l.minutes);
    const topReaders = [];
    for (const [sid, minutes] of [...byPupil.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
      const s = await ctx.db.get(sid as Id<"students">);
      if (s) topReaders.push({ studentId: s._id, name: `${s.firstName} ${s.lastName}`, classId: s.classId, minutes });
    }
    return {
      resources,
      holds: holds.sort((a, b) => (a.status === b.status ? a.createdAt.localeCompare(b.createdAt) : a.status === "ready" ? -1 : 1)),
      reading: {
        minutes: recent.reduce((n, l) => n + l.minutes, 0),
        readers: byPupil.size,
        finished: recent.filter((l) => l.finished).length,
        topReaders,
      },
    };
  },
});

const KINDS = ["ebook", "audiobook", "video", "article"] as const;

export const saveResource = mutation({
  args: {
    id: v.optional(v.id("digitalResources")),
    title: v.string(),
    author: v.string(),
    kind: v.union(v.literal("ebook"), v.literal("audiobook"), v.literal("video"), v.literal("article")),
    description: v.string(),
    category: v.string(),
    levelIds: v.array(v.string()),
    url: v.optional(v.string()),
    media: v.optional(cloudMedia),
    minutes: v.optional(v.number()),
    published: v.boolean(),
  },
  handler: async (ctx, { id, ...a }) => {
    const viewer = await requireAdmin(ctx);
    if (!KINDS.includes(a.kind)) fail("INVALID", "Choose what kind of resource this is.");
    const url = a.media?.url ?? a.url?.trim() ?? "";
    if (!/^https:\/\/\S+$/.test(url)) fail("INVALID", "Add a secure link (https://…) or upload the audio or video.");
    const fields = {
      title: a.title.trim().slice(0, 160),
      author: a.author.trim().slice(0, 120),
      kind: a.kind,
      description: a.description.trim().slice(0, 600),
      category: a.category.trim().slice(0, 40) || "Stories",
      levelIds: a.levelIds.slice(0, 20),
      url,
      media: a.media,
      minutes: a.minutes && Number.isFinite(a.minutes) ? Math.max(1, Math.min(600, Math.round(a.minutes))) : undefined,
      published: a.published,
    };
    if (fields.title.length < 2) fail("INVALID", "Enter the title.");
    if (!fields.author) fail("INVALID", "Enter the author or publisher.");
    if (id) {
      const before = await ctx.db.get(id);
      if (!before) fail("NOT_FOUND", "Resource not found.");
      await ctx.db.patch(id, fields);
      await audit(ctx, viewer, { action: "Updated digital resource", entity: "Library", entityId: id, newValue: fields.title });
      return { id, previousMedia: before.media?.publicId !== fields.media?.publicId ? before.media?.publicId : undefined };
    }
    const newId = await ctx.db.insert("digitalResources", { ...fields, opens: 0, addedAt: nowISO() });
    await audit(ctx, viewer, { action: "Added digital resource", entity: "Library", entityId: newId, newValue: fields.title });
    return { id: newId, previousMedia: undefined };
  },
});

export const removeResource = mutation({
  args: { id: v.id("digitalResources") },
  handler: async (ctx, { id }) => {
    const viewer = await requireAdmin(ctx);
    const r = await ctx.db.get(id);
    if (!r) return { publicId: undefined };
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Removed digital resource", entity: "Library", entityId: id, previousValue: r.title });
    return { publicId: r.media?.publicId };
  },
});

/** The desk gives up a ready hold (not collected in time) and passes the copy on. */
export const releaseHold = mutation({
  args: { id: v.id("bookReservations") },
  handler: async (ctx, { id }) => {
    const viewer = await requireAdmin(ctx);
    const hold = await ctx.db.get(id);
    if (!hold || (hold.status !== "ready" && hold.status !== "waiting")) return;
    await ctx.db.patch(id, { status: "cancelled", closedAt: nowISO() });
    await audit(ctx, viewer, { action: "Released reservation", entity: "Library", entityId: id });
    if (hold.status === "ready") await promoteNextHold(ctx, hold.bookId);
  },
});
