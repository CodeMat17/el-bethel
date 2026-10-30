import { v } from "convex/values";

import { buildDatabase } from "../lib/school/seed";
import { internal } from "./_generated/api";
import type { TableNames } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

/**
 * Demo data importer (development only).
 *
 *   npx convex run seed:demo                       # everything: people, records, content
 *   npx convex run seed:demo '{"scope":"content"}' # academic structure + website content only
 *   npx convex run seed:clear                      # wipe every table
 *
 * The demo dataset in lib/school/seed.ts uses string ids ("std-0001"); the
 * importer inserts in dependency order and rewrites every reference to the new
 * Convex ids.
 */

const TABLES: TableNames[] = [
  "users", "academicSessions", "terms", "classes", "subjects", "teachers", "teachingAssignments",
  "students", "parents", "guardianships", "assignments", "submissions", "attendance", "results",
  "reportCards", "midtermScores", "midtermPublications", "invoices", "payments", "applications", "news", "events", "gallery", "clubs",
  "achievements", "testimonials", "faqs", "documents", "vacancies", "emergencyNotices", "books",
  "borrowings", "transportRoutes", "enquiries", "tourBookings", "certificates", "notifications",
  "messageThreads", "threadParticipants", "threadMessages", "appointments", "availability",
  "materials", "quizzes", "quizAttempts", "timetable", "auditLogs", "deliveries", "houseStandings",
  "busTrips", "busPositions", "riderEvents", "tourScenes", "digitalResources", "readingLogs", "bookReservations",
  "parentInsights", "alumni", "alumniStories",
  "givingCampaigns", "pledges", "products", "orders",
];

const LEGACY_TABLES = new Set<TableNames>([
  "users", "academicSessions", "terms", "classes", "subjects", "teachers", "students", "parents", "assignments",
]);

type Row = Record<string, unknown>;

export const isEmpty = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [user, cls, news] = await Promise.all([
      ctx.db.query("users").first(),
      ctx.db.query("classes").first(),
      ctx.db.query("news").first(),
    ]);
    return !user && !cls && !news;
  },
});

export const importRows = internalMutation({
  args: { table: v.string(), rows: v.array(v.any()) },
  handler: async (ctx, { table, rows }) => {
    const ids: string[] = [];
    for (const row of rows as Row[]) {
      // Rows are validated against the schema by Convex on insert.
      ids.push(await ctx.db.insert(table as "faqs", row as never));
    }
    return ids;
  },
});

export const clearTable = internalMutation({
  args: { table: v.string() },
  handler: async (ctx, { table }) => {
    const docs = await ctx.db.query(table as TableNames).take(1000);
    for (const doc of docs) await ctx.db.delete(doc._id);
    return docs.length;
  },
});

export const clear = internalAction({
  args: {},
  handler: async (ctx) => {
    for (const table of TABLES) {
      let removed = 0;
      while ((removed = await ctx.runMutation(internal.seed.clearTable, { table })) > 0) {
        void removed;
      }
    }
    return "All tables cleared.";
  },
});

function clean(row: Row): Row {
  const out: Row = {};
  for (const [k, value] of Object.entries(row)) if (value !== undefined && value !== null) out[k] = value;
  return out;
}

export const demo = internalAction({
  args: { scope: v.optional(v.union(v.literal("full"), v.literal("content"))) },
  handler: async (ctx, { scope = "full" }) => {
    if (!(await ctx.runQuery(internal.seed.isEmpty, {}))) {
      throw new Error("The database already has data. Run `npx convex run seed:clear` first.");
    }
    const full = scope === "full";
    const db = buildDatabase();
    const ids = new Map<string, string>();
    const ref = (table: TableNames, legacy: string | null | undefined) =>
      legacy ? ids.get(`${table}:${legacy}`) : undefined;

    async function put<T extends object>(table: TableNames, records: T[], map: (r: T) => Row) {
      const counts = { inserted: 0 };
      for (let i = 0; i < records.length; i += 400) {
        const chunk = records.slice(i, i + 400);
        const rows = chunk.map((r) => {
          const row = map(r);
          delete row.id;
          const legacy = (r as { id?: string }).id;
          if (LEGACY_TABLES.has(table) && legacy) row.legacyId = legacy;
          return clean(row);
        });
        const inserted = await ctx.runMutation(internal.seed.importRows, { table, rows });
        chunk.forEach((r, idx) => {
          const legacy = (r as { id?: string }).id;
          if (legacy) ids.set(`${table}:${legacy}`, inserted[idx]);
        });
        counts.inserted += inserted.length;
      }
      return counts.inserted;
    }

    const summary: Record<string, number> = {};
    const run = async <T extends object>(table: TableNames, records: T[], map: (r: T) => Row) => {
      summary[table] = (summary[table] ?? 0) + (await put(table, records, map));
    };

    /* academic structure */
    await run("academicSessions", db.sessions, (r) => ({ ...r }));
    await run("terms", db.terms, (r) => ({ ...r, sessionId: ref("academicSessions", r.sessionId) }));
    await run("subjects", db.subjects, (r) => ({ ...r }));
    await run("transportRoutes", db.transportRoutes, (r) => ({ ...r }));

    if (full) {
      await run("teachers", db.teachers, ({ subjectIds, classIds, isClassTeacher, ...r }) => {
        void subjectIds; void classIds; void isClassTeacher;
        return { ...r };
      });
    }
    await run("classes", db.classes, (r) => ({
      ...r,
      classTeacherId: full ? ref("teachers", r.classTeacherId) : undefined,
    }));

    if (full) {
      const teaching = [...db.teachingAssignments.entries()].map(([key, teacherId]) => {
        const [classId, subjectId] = key.split(":");
        return { classId, subjectId, teacherId };
      });
      await run("teachingAssignments", teaching, (r) => ({
        classId: ref("classes", r.classId),
        subjectId: ref("subjects", r.subjectId),
        teacherId: ref("teachers", r.teacherId),
      }));

      /* people */
      await run("parents", db.parents, ({ studentIds, ...r }) => {
        void studentIds;
        return { ...r };
      });
      await run("students", db.students, ({ parentIds, ...r }) => {
        void parentIds;
        return {
          ...r,
          classId: ref("classes", r.classId),
          transportRouteId: ref("transportRoutes", r.transportRouteId),
        };
      });
      const links = db.students.flatMap((s) => s.parentIds.map((parentId) => ({ studentId: s.id, parentId })));
      await run("guardianships", links, (r) => ({
        studentId: ref("students", r.studentId),
        parentId: ref("parents", r.parentId),
      }));
      await run("users", db.users, (r) => ({
        ...r,
        teacherId: ref("teachers", r.teacherId),
        parentId: ref("parents", r.parentId),
        studentId: ref("students", r.studentId),
      }));

      /* teaching and learning */
      await run("assignments", db.assignments, (r) => ({
        ...r,
        classId: ref("classes", r.classId),
        subjectId: ref("subjects", r.subjectId),
        teacherId: ref("teachers", r.teacherId),
        termId: ref("terms", r.termId),
      }));
      await run("submissions", db.submissions, ({ gradedBy, ...r }) => {
        void gradedBy;
        return { ...r, assignmentId: ref("assignments", r.assignmentId), studentId: ref("students", r.studentId) };
      });
      await run("attendance", db.attendance, ({ recordedBy, ...r }) => {
        void recordedBy;
        return { ...r, studentId: ref("students", r.studentId), classId: ref("classes", r.classId) };
      });
      await run("results", db.results, (r) => ({
        ...r,
        studentId: ref("students", r.studentId),
        subjectId: ref("subjects", r.subjectId),
        classId: ref("classes", r.classId),
        termId: ref("terms", r.termId),
      }));
      await run("reportCards", db.reportCards, (r) => ({
        ...r,
        studentId: ref("students", r.studentId),
        classId: ref("classes", r.classId),
        termId: ref("terms", r.termId),
      }));
      await run("invoices", db.invoices, (r) => ({
        ...r,
        studentId: ref("students", r.studentId),
        termId: ref("terms", r.termId),
      }));
      await run("payments", db.payments, (r) => ({
        ...r,
        invoiceId: ref("invoices", r.invoiceId),
        studentId: ref("students", r.studentId),
      }));
      await run("materials", db.materials, (r) => ({
        ...r,
        classId: ref("classes", r.classId),
        subjectId: ref("subjects", r.subjectId),
        teacherId: ref("teachers", r.teacherId),
      }));
      await run("quizzes", db.quizzes, (r) => ({
        ...r,
        classId: ref("classes", r.classId),
        subjectId: ref("subjects", r.subjectId),
        teacherId: ref("teachers", r.teacherId),
      }));
      await run("timetable", db.timetable, (r) => ({
        ...r,
        classId: ref("classes", r.classId),
        subjectId: ref("subjects", r.subjectId),
        teacherId: ref("teachers", r.teacherId),
      }));
      await run("applications", db.applications, (r) => ({ ...r, sessionId: ref("academicSessions", r.sessionId) }));
    }

    /* website content */
    await run("news", db.news, (r) => ({ ...r }));
    await run("events", db.events, (r) => ({ ...r }));
    await run("gallery", db.gallery, (r) => ({ ...r }));
    await run("clubs", db.clubs, (r) => ({ ...r, coordinatorId: full ? ref("teachers", r.coordinatorId) : undefined }));
    await run("achievements", db.achievements, (r) => ({ ...r }));
    await run("testimonials", db.testimonials, (r) => ({ ...r }));
    await run("faqs", db.faqs.map((f, i) => ({ ...f, order: i })), (r) => ({ ...r }));
    await run("documents", db.documents, (r) => ({ ...r }));
    await run("vacancies", db.vacancies, (r) => ({ ...r }));
    await run("emergencyNotices", db.emergencyNotices, (r) => ({ ...r }));
    await run("books", db.books, (r) => ({ ...r }));

    if (full) {
      // Borrowings reference books, which are inserted with the content above.
      await run("borrowings", db.borrowings, (r) => ({
        ...r,
        bookId: ref("books", r.bookId),
        studentId: ref("students", r.studentId),
      }));
      await run("enquiries", db.enquiries, (r) => ({ ...r }));
      await run("tourBookings", db.tourBookings, (r) => ({ ...r }));
      await run("certificates", db.certificates, (r) => ({ ...r, studentId: ref("students", r.studentId) }));
      await run(
        "notifications",
        db.notifications.filter((n) => ref("users", n.userId)),
        (r) => ({ ...r, userId: ref("users", r.userId) }),
      );

      for (const thread of db.messageThreads) {
        const participants = thread.participantIds.map((p) => ref("users", p)).filter(Boolean);
        const [threadId] = await ctx.runMutation(internal.seed.importRows, {
          table: "messageThreads",
          rows: [
            clean({
              subject: thread.subject,
              participantIds: participants,
              studentId: ref("students", thread.studentId),
              createdAt: thread.createdAt,
              updatedAt: thread.updatedAt,
            }),
          ],
        });
        await ctx.runMutation(internal.seed.importRows, {
          table: "threadParticipants",
          rows: participants.map((userId) => ({ threadId, userId })),
        });
        await ctx.runMutation(internal.seed.importRows, {
          table: "threadMessages",
          rows: thread.messages.map((m) => ({
            threadId,
            senderId: ref("users", m.senderId),
            body: m.body,
            sentAt: m.sentAt,
            readBy: m.readBy.map((u) => ref("users", u)).filter(Boolean),
          })),
        });
      }
      summary.messageThreads = db.messageThreads.length;

      await run("availability", db.availability, (r) => ({ ...r, teacherId: ref("teachers", r.teacherId) }));
      await run("appointments", db.appointments, (r) => ({
        ...r,
        teacherId: ref("teachers", r.teacherId),
        parentId: ref("parents", r.parentId),
        studentId: ref("students", r.studentId),
      }));
      await run("auditLogs", db.auditLogs, (r) => ({ ...r, actorId: ref("users", r.actorId) }));
    }

    // Premium modules: virtual tour, shop, digital library, giving.
    await ctx.runMutation(internal.premiumSeed.run, {});

    return summary;
  },
});

/** Seeded accounts with a username, for scripts/link-clerk.mjs. */
export const demoAccounts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u) => u.username && u.legacyId)
      .map((u) => ({ _id: u._id, name: u.name, username: u.username!, email: u.email, roles: u.roles, clerkUserId: u.clerkUserId }));
  },
});

/** Development helper: let an existing Clerk user sign in as a seeded account. */
export const linkDemoAccount = internalMutation({
  args: { username: v.string(), clerkUserId: v.string(), email: v.optional(v.string()) },
  handler: async (ctx, { username, clerkUserId, email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (!user) throw new Error(`No account with username ${username}.`);
    await ctx.db.patch(user._id, { clerkUserId, active: true, ...(email ? { email } : {}) });
    return user._id;
  },
});
