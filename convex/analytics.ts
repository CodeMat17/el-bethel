import { query } from "./_generated/server";
import { requireAdmin } from "./lib/access";
import { todayKey } from "./lib/util";

/**
 * Deeper reporting for administrators: performance trends, pupils who may
 * need support, attendance patterns, homework and quiz engagement, library
 * use and the admissions funnel. Everything is computed from live records.
 */

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const insights = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [students, classes, terms] = await Promise.all([
      ctx.db.query("students").withIndex("by_status", (q) => q.eq("status", "active")).collect(),
      ctx.db.query("classes").collect(),
      ctx.db.query("terms").collect(),
    ]);
    const studentById = new Map(students.map((s) => [s._id as string, s]));
    const rosterByClass = new Map<string, number>();
    for (const s of students) rosterByClass.set(s.classId, (rosterByClass.get(s.classId) ?? 0) + 1);

    /* ------------------------------ academic ------------------------------ */
    const orderedTerms = [...terms].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const termTrend: { termId: string; label: string; average: number; pupils: number }[] = [];
    let latestCards: { studentId: string; classId: string; average: number }[] = [];
    for (const t of orderedTerms) {
      const cards = await ctx.db.query("reportCards").withIndex("by_term", (q) => q.eq("termId", t._id)).collect();
      if (cards.length === 0) continue;
      termTrend.push({ termId: t._id, label: t.name, average: Math.round(cards.reduce((n, c) => n + c.average, 0) / cards.length), pupils: cards.length });
      latestCards = cards.map((c) => ({ studentId: c.studentId, classId: c.classId, average: c.average }));
    }
    const classAverages = classes
      .map((c) => {
        const cards = latestCards.filter((x) => x.classId === c._id);
        return { classId: c._id, average: cards.length ? Math.round(cards.reduce((n, x) => n + x.average, 0) / cards.length) : null };
      })
      .filter((x): x is { classId: typeof x.classId; average: number } => x.average !== null)
      .sort((a, b) => b.average - a.average);
    const needSupport = latestCards
      .filter((c) => c.average < 50 && studentById.has(c.studentId))
      .sort((a, b) => a.average - b.average)
      .map((c) => {
        const s = studentById.get(c.studentId)!;
        return { studentId: s._id, name: `${s.firstName} ${s.lastName}`, classId: s.classId, average: Math.round(c.average) };
      });

    /* ----------------------------- attendance ----------------------------- */
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const att = await ctx.db.query("attendance").withIndex("by_date", (q) => q.gte("date", since)).take(15000);
    const perPupil = new Map<string, { attended: number; total: number; late: number }>();
    const lateByDay = new Map<number, number>();
    const absentByDay = new Map<number, number>();
    for (const r of att) {
      const e = perPupil.get(r.studentId) ?? { attended: 0, total: 0, late: 0 };
      e.total += 1;
      if (r.status === "present" || r.status === "late") e.attended += 1;
      if (r.status === "late") e.late += 1;
      perPupil.set(r.studentId, e);
      const day = new Date(`${r.date}T00:00:00Z`).getUTCDay();
      if (r.status === "late") lateByDay.set(day, (lateByDay.get(day) ?? 0) + 1);
      if (r.status === "absent") absentByDay.set(day, (absentByDay.get(day) ?? 0) + 1);
    }
    const chronic = [...perPupil.entries()]
      .filter(([id, e]) => e.total >= 5 && studentById.has(id) && pct(e.attended, e.total) < 90)
      .map(([id, e]) => {
        const s = studentById.get(id)!;
        return { studentId: s._id, name: `${s.firstName} ${s.lastName}`, classId: s.classId, rate: pct(e.attended, e.total), late: e.late };
      })
      .sort((a, b) => a.rate - b.rate);
    const weekdays = [1, 2, 3, 4, 5].map((d) => ({ label: WEEKDAYS[d], late: lateByDay.get(d) ?? 0, absent: absentByDay.get(d) ?? 0 }));

    /* ------------------------------ homework ------------------------------ */
    const [assignments, submissions] = await Promise.all([
      ctx.db.query("assignments").collect(),
      ctx.db.query("submissions").collect(),
    ]);
    const live = assignments.filter((a) => a.status !== "draft" && a.status !== "archived");
    const due = live.filter((a) => a.dueDate.slice(0, 10) <= todayKey());
    const byAssignment = new Map<string, typeof submissions>();
    for (const s of submissions) {
      const list = byAssignment.get(s.assignmentId) ?? [];
      list.push(s);
      byAssignment.set(s.assignmentId, list);
    }
    const homeworkByClass = classes
      .map((c) => {
        const set = due.filter((a) => a.classId === c._id);
        const expected = set.length * (rosterByClass.get(c._id) ?? 0);
        let handedIn = 0;
        let late = 0;
        for (const a of set) {
          for (const s of byAssignment.get(a._id) ?? []) {
            handedIn += 1;
            if (s.submittedAt > a.dueDate) late += 1;
          }
        }
        return { classId: c._id, assignments: set.length, rate: pct(handedIn, expected), late, handedIn };
      })
      .filter((x) => x.assignments > 0)
      .sort((a, b) => b.rate - a.rate);
    const totalHandedIn = homeworkByClass.reduce((n, x) => n + x.handedIn, 0);
    const totalLate = homeworkByClass.reduce((n, x) => n + x.late, 0);

    /* ------------------------------- quizzes ------------------------------ */
    const quizzes = (await ctx.db.query("quizzes").collect()).filter((q) => q.status !== "draft");
    let attemptsTotal = 0;
    let scoreSum = 0;
    let scored = 0;
    let pupilsSat = 0;
    let expectedQuiz = 0;
    for (const q of quizzes) {
      const attempts = (await ctx.db.query("quizAttempts").withIndex("by_quiz", (x) => x.eq("quizId", q._id)).collect()).filter(
        (a) => (a.status ?? "submitted") === "submitted",
      );
      attemptsTotal += attempts.length;
      pupilsSat += new Set(attempts.map((a) => a.studentId)).size;
      expectedQuiz += rosterByClass.get(q.classId) ?? 0;
      for (const a of attempts.filter((x) => !x.needsMarking && x.maxScore)) {
        scoreSum += a.score / a.maxScore;
        scored += 1;
      }
    }

    /* ------------------------------- library ------------------------------ */
    const loans = await ctx.db.query("borrowings").collect();
    const months: { key: string; label: string; loans: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() - i);
      const key = d.toISOString().slice(0, 7);
      months.push({ key, label: d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" }), loans: 0 });
    }
    const bookCounts = new Map<string, number>();
    for (const l of loans) {
      const m = months.find((x) => x.key === l.borrowedAt.slice(0, 7));
      if (m) m.loans += 1;
      bookCounts.set(l.bookId, (bookCounts.get(l.bookId) ?? 0) + 1);
    }
    const topBooks = [];
    for (const [bookId, count] of [...bookCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      const book = await ctx.db.get(bookId as typeof loans[number]["bookId"]);
      topBooks.push({ label: book?.title ?? "—", value: count });
    }
    const readers = new Set(loans.map((l) => l.studentId)).size;

    /* ------------------------------ transport ----------------------------- */
    const routes = await ctx.db.query("transportRoutes").collect();
    const seats = routes.reduce((n, r) => n + r.capacity, 0);
    const riders = students.filter((s) => s.transportRouteId).length;

    /* ------------------------------ admissions ---------------------------- */
    const applications = (await ctx.db.query("applications").collect()).filter((a) => a.status !== "draft");
    const reviewed = applications.filter((a) => !["submitted", "withdrawn"].includes(a.status));
    const offered = applications.filter((a) => ["accepted", "conditionally_accepted", "enrolled"].includes(a.status));
    const enrolled = applications.filter((a) => a.status === "enrolled");

    return {
      academic: { termTrend, classAverages, needSupport: needSupport.slice(0, 10), needSupportCount: needSupport.length, latestPupils: latestCards.length },
      attendance: { since, chronic: chronic.slice(0, 10), chronicCount: chronic.length, weekdays, pupilsTracked: perPupil.size },
      homework: { byClass: homeworkByClass, rate: pct(totalHandedIn, homeworkByClass.reduce((n, x) => n + x.assignments * (rosterByClass.get(x.classId) ?? 0), 0)), lateRate: pct(totalLate, totalHandedIn), due: due.length },
      quizzes: { count: quizzes.length, attempts: attemptsTotal, averagePercent: scored ? Math.round((scoreSum / scored) * 100) : null, completion: pct(pupilsSat, expectedQuiz) },
      library: { months, topBooks, readers, readerShare: pct(readers, students.length), overdue: loans.filter((l) => !l.returnedAt && l.dueDate < todayKey()).length },
      transport: { routes: routes.length, seats, riders, occupancy: pct(riders, seats) },
      admissions: {
        funnel: [
          { label: "Applied", value: applications.length },
          { label: "Reviewed", value: reviewed.length },
          { label: "Offered a place", value: offered.length },
          { label: "Enrolled", value: enrolled.length },
        ],
        conversion: pct(enrolled.length, applications.length),
      },
    };
  },
});
