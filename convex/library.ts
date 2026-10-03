import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import {
  assertStudentAccess,
  fail,
  parentStudentIds,
  requireAdmin,
  requireRole,
  requireViewer,
} from "./lib/access";
import { accountsForStudent, audit, notify, nowISO, todayKey, withId } from "./lib/util";
import { assertCopyFree, fulfilHold, promoteNextHold } from "./reading";

/**
 * The school library: catalogue, loans, returns and borrowing history.
 * Librarians are administrators. Pupils and parents see the catalogue and
 * only their own (or their children's) loans.
 */

type Ctx = QueryCtx | MutationCtx;

export const LOAN_DAYS = 14;
const MAX_ACTIVE_LOANS = 3;

const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Overdue is derived from the date, so it is right even before the nightly sweep runs. */
function loanStatus(b: Doc<"borrowings">, today = todayKey()): Doc<"borrowings">["status"] {
  if (b.returnedAt || b.status === "returned") return "returned";
  return b.dueDate < today ? "overdue" : "borrowed";
}

const toLoan = (b: Doc<"borrowings">, today = todayKey()) => ({ ...withId(b), status: loanStatus(b, today) });

async function loansFor(ctx: Ctx, studentId: Id<"students">) {
  const today = todayKey();
  const rows = await ctx.db.query("borrowings").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect();
  return rows.map((b) => toLoan(b, today)).sort((a, b) => b.borrowedAt.localeCompare(a.borrowedAt));
}

/* --------------------------------- readers -------------------------------- */

/** The catalogue for any signed-in user. */
export const catalogue = query({
  args: {},
  handler: async (ctx) => {
    await requireViewer(ctx);
    return (await ctx.db.query("books").collect()).map(withId).sort((a, b) => a.title.localeCompare(b.title));
  },
});

/** Books in the catalogue plus one pupil's loans. */
export const forStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, { studentId }) => {
    const viewer = await requireViewer(ctx);
    await assertStudentAccess(ctx, viewer, studentId);
    const [books, loans] = await Promise.all([ctx.db.query("books").collect(), loansFor(ctx, studentId)]);
    return { books: books.map(withId), loans };
  },
});

/** Each of a parent's children with their loans. */
export const forParent = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, "parent");
    if (!viewer.parentId) return { books: [], children: [] };
    const books = (await ctx.db.query("books").collect()).map(withId);
    const children = [];
    for (const sid of await parentStudentIds(ctx, viewer.parentId)) {
      const s = await ctx.db.get(sid);
      if (!s) continue;
      children.push({ id: s._id, firstName: s.firstName, lastName: s.lastName, classId: s.classId, loans: await loansFor(ctx, sid) });
    }
    return { books, children };
  },
});

/* ---------------------------------- admin --------------------------------- */

export const adminOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const today = todayKey();
    const [books, borrowings] = await Promise.all([ctx.db.query("books").collect(), ctx.db.query("borrowings").collect()]);
    const studentIds = [...new Set(borrowings.map((b) => b.studentId))];
    const students = new Map<string, Doc<"students"> | null>();
    for (const id of studentIds) students.set(id, await ctx.db.get(id));
    return {
      books: books.map(withId),
      loans: borrowings
        .map((b) => {
          const s = students.get(b.studentId);
          return { ...toLoan(b, today), studentName: s ? `${s.firstName} ${s.lastName}` : "—", classId: s?.classId ?? null };
        })
        .sort((a, b) => b.borrowedAt.localeCompare(a.borrowedAt)),
    };
  },
});

const bookArgs = {
  title: v.string(),
  author: v.string(),
  isbn: v.string(),
  category: v.string(),
  ageRange: v.string(),
  copiesTotal: v.number(),
};

export const saveBook = mutation({
  args: { id: v.optional(v.id("books")), ...bookArgs },
  handler: async (ctx, { id, ...a }) => {
    const viewer = await requireAdmin(ctx);
    const fields = {
      title: a.title.trim().slice(0, 200),
      author: a.author.trim().slice(0, 120),
      isbn: a.isbn.replace(/[^0-9Xx]/g, "").toUpperCase().slice(0, 13),
      category: a.category.trim().slice(0, 60) || "General",
      ageRange: a.ageRange.trim().slice(0, 20),
    };
    if (fields.title.length < 2) fail("INVALID", "Enter the book's title.");
    if (!fields.author) fail("INVALID", "Enter the author.");
    if (fields.isbn && fields.isbn.length !== 10 && fields.isbn.length !== 13) fail("INVALID", "An ISBN has 10 or 13 digits.");
    if (!Number.isInteger(a.copiesTotal) || a.copiesTotal < 1 || a.copiesTotal > 500) fail("INVALID", "Copies must be between 1 and 500.");

    if (id) {
      const book = await ctx.db.get(id);
      if (!book) fail("NOT_FOUND", "Book not found.");
      const onLoan = book.copiesTotal - book.copiesAvailable;
      if (a.copiesTotal < onLoan) fail("CONFLICT", `${onLoan} copies are on loan, so there must be at least ${onLoan}.`);
      await ctx.db.patch(id, { ...fields, copiesTotal: a.copiesTotal, copiesAvailable: a.copiesTotal - onLoan });
      await audit(ctx, viewer, { action: "Updated book", entity: "Library", entityId: id, newValue: fields.title });
      return id;
    }
    const newId = await ctx.db.insert("books", { ...fields, copiesTotal: a.copiesTotal, copiesAvailable: a.copiesTotal });
    await audit(ctx, viewer, { action: "Added book", entity: "Library", entityId: newId, newValue: fields.title });
    return newId;
  },
});

export const removeBook = mutation({
  args: { id: v.id("books") },
  handler: async (ctx, { id }) => {
    const viewer = await requireAdmin(ctx);
    const book = await ctx.db.get(id);
    if (!book) return;
    const loans = await ctx.db.query("borrowings").withIndex("by_book", (q) => q.eq("bookId", id)).collect();
    if (loans.some((l) => loanStatus(l) !== "returned")) fail("CONFLICT", "Copies of this book are still on loan.");
    if (loans.length > 0) fail("CONFLICT", "This book has a borrowing history. Set its copies to the number still on the shelf instead of deleting it.");
    await ctx.db.delete(id);
    await audit(ctx, viewer, { action: "Removed book", entity: "Library", entityId: id, previousValue: book.title });
  },
});

export const issue = mutation({
  args: { bookId: v.id("books"), studentId: v.id("students"), dueDate: v.optional(v.string()) },
  handler: async (ctx, { bookId, studentId, dueDate }) => {
    const viewer = await requireAdmin(ctx);
    const [book, student] = await Promise.all([ctx.db.get(bookId), ctx.db.get(studentId)]);
    if (!book) fail("NOT_FOUND", "Book not found.");
    if (!student || student.status !== "active") fail("NOT_FOUND", "Choose a current pupil.");
    if (book.copiesAvailable < 1) fail("CONFLICT", "Every copy of this book is on loan.");
    const today = todayKey();
    const due = dueDate || addDays(today, LOAN_DAYS);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || due <= today) fail("INVALID", "The return date must be in the future.");
    if (due > addDays(today, 60)) fail("INVALID", "Loans can be for at most 60 days.");
    const current = (await loansFor(ctx, studentId)).filter((l) => l.status !== "returned");
    if (current.some((l) => l.bookId === bookId)) fail("CONFLICT", `${student.firstName} already has this book.`);
    if (current.length >= MAX_ACTIVE_LOANS) fail("CONFLICT", `${student.firstName} already has ${MAX_ACTIVE_LOANS} books out.`);
    if (current.some((l) => l.status === "overdue")) fail("CONFLICT", `${student.firstName} has an overdue book to return first.`);
    await assertCopyFree(ctx, book, studentId);

    await ctx.db.patch(bookId, { copiesAvailable: book.copiesAvailable - 1 });
    await fulfilHold(ctx, bookId, studentId);
    const id = await ctx.db.insert("borrowings", { bookId, studentId, borrowedAt: today, dueDate: due, status: "borrowed", issuedBy: viewer._id });
    await audit(ctx, viewer, { action: "Issued book", entity: "Library", entityId: id, newValue: `${book.title} → ${student.firstName} ${student.lastName}` });
    return { dueDate: due };
  },
});

export const returnLoan = mutation({
  args: { id: v.id("borrowings") },
  handler: async (ctx, { id }) => {
    const viewer = await requireAdmin(ctx);
    const loan = await ctx.db.get(id);
    if (!loan) fail("NOT_FOUND", "Loan not found.");
    if (loanStatus(loan) === "returned") return;
    await ctx.db.patch(id, { status: "returned", returnedAt: todayKey() });
    const book = await ctx.db.get(loan.bookId);
    if (book) await ctx.db.patch(book._id, { copiesAvailable: Math.min(book.copiesTotal, book.copiesAvailable + 1) });
    await audit(ctx, viewer, { action: "Returned book", entity: "Library", entityId: id, newValue: book?.title });
    // The next pupil waiting for this book is told it is set aside for them.
    if (book) await promoteNextHold(ctx, book._id);
  },
});

export const renew = mutation({
  args: { id: v.id("borrowings") },
  handler: async (ctx, { id }) => {
    const viewer = await requireAdmin(ctx);
    const loan = await ctx.db.get(id);
    if (!loan) fail("NOT_FOUND", "Loan not found.");
    if (loanStatus(loan) === "returned") fail("INVALID", "This book has already been returned.");
    const base = loan.dueDate > todayKey() ? loan.dueDate : todayKey();
    const dueDate = addDays(base, LOAN_DAYS);
    await ctx.db.patch(id, { dueDate, status: "borrowed", reminder: undefined });
    await audit(ctx, viewer, { action: "Renewed loan", entity: "Library", entityId: id, previousValue: loan.dueDate, newValue: dueDate });
    return { dueDate };
  },
});

/* --------------------------------- nightly -------------------------------- */

/** Mark overdue loans and remind families once before and once after the due date. */
export const sweep = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = todayKey();
    const tomorrow = addDays(today, 1);
    const open = [
      ...(await ctx.db.query("borrowings").withIndex("by_status", (q) => q.eq("status", "borrowed")).collect()),
      ...(await ctx.db.query("borrowings").withIndex("by_status", (q) => q.eq("status", "overdue")).collect()),
    ];
    let reminders = 0;
    for (const loan of open) {
      if (loan.returnedAt) continue;
      const overdue = loan.dueDate < today;
      if (overdue && loan.status !== "overdue") await ctx.db.patch(loan._id, { status: "overdue" });
      const kind = overdue ? "overdue" : loan.dueDate <= tomorrow ? "due_soon" : null;
      if (!kind || loan.reminder === kind) continue;
      const book = await ctx.db.get(loan.bookId);
      for (const userId of await accountsForStudent(ctx, loan.studentId)) {
        const user = await ctx.db.get(userId);
        await notify(ctx, userId, {
          type: kind === "overdue" ? "library_overdue" : "library_due",
          title: kind === "overdue" ? "Library book overdue" : "Library book due back tomorrow",
          body: `"${book?.title ?? "A library book"}" ${kind === "overdue" ? "was" : "is"} due back on ${loan.dueDate}.`,
          href: user?.studentId ? "/portal/pupil/library" : user?.parentId ? "/portal/parent/library" : undefined,
        });
      }
      await ctx.db.patch(loan._id, { reminder: kind });
      reminders += 1;
    }
    return { checked: open.length, reminders, at: nowISO() };
  },
});
