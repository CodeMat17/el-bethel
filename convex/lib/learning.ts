import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Learning analytics for one pupil, computed from live records: term-on-term
 * results, subject strengths and focus areas against the class, homework and
 * quiz mastery by topic, attendance trend and reading. The "signals" are
 * plain-language prompts for a teacher or parent to look at — never decisions.
 */

type Ctx = QueryCtx | MutationCtx;

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((n, x) => n + x, 0) / xs.length) : null);
const dayKey = (offsetDays: number) => new Date(Date.now() + offsetDays * 86400_000).toISOString().slice(0, 10);

export type SignalTone = "success" | "info" | "warning" | "danger";
export interface Signal {
  tone: SignalTone;
  area: string;
  text: string;
}

export interface ProfileOptions {
  /** Staff see terms whose report cards aren't published yet; families don't. */
  includeUnpublished: boolean;
  /** Skip the per-subject class comparison (used for whole-class tables, where it is computed once). */
  skipClassComparison?: boolean;
}

export async function learningProfile(ctx: Ctx, studentId: Id<"students">, opts: ProfileOptions) {
  const student = await ctx.db.get(studentId);
  if (!student) return null;
  const subjects = new Map((await ctx.db.query("subjects").collect()).map((s) => [s._id as string, s]));
  const subjectName = (id: string) => subjects.get(id)?.name ?? "—";

  /* ------------------------------- results ------------------------------- */
  const cards = (await ctx.db.query("reportCards").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect()).filter(
    (c) => opts.includeUnpublished || c.publishedAt,
  );
  const terms: Doc<"terms">[] = [];
  for (const c of cards) {
    const t = await ctx.db.get(c.termId);
    if (t) terms.push(t);
  }
  terms.sort((a, b) => a.startDate.localeCompare(b.startDate));
  const termTrend = terms.map((t) => {
    const card = cards.find((c) => c.termId === t._id)!;
    return { termId: t._id, label: t.name, average: Math.round(card.average), position: card.position, classSize: card.classSize };
  });

  const latest = terms.at(-1) ?? null;
  const previous = terms.at(-2) ?? null;
  const resultsFor = async (termId: Id<"terms">) =>
    await ctx.db
      .query("results")
      .withIndex("by_student_term", (q) => q.eq("studentId", studentId).eq("termId", termId))
      .collect();
  const latestResults = latest ? await resultsFor(latest._id) : [];
  const previousResults = previous ? await resultsFor(previous._id) : [];

  const subjectRows = [];
  for (const r of latestResults) {
    const before = previousResults.find((p) => p.subjectId === r.subjectId);
    let classAverage: number | null = null;
    if (!opts.skipClassComparison) {
      const peers = await ctx.db
        .query("results")
        .withIndex("by_class_term_subject", (q) => q.eq("classId", r.classId).eq("termId", r.termId).eq("subjectId", r.subjectId))
        .collect();
      classAverage = avg(peers.map((p) => p.total));
    }
    subjectRows.push({
      subjectId: r.subjectId,
      subject: subjectName(r.subjectId),
      total: Math.round(r.total),
      grade: r.grade,
      change: before ? Math.round(r.total - before.total) : null,
      classAverage,
    });
  }
  subjectRows.sort((a, b) => b.total - a.total);
  const strengths = subjectRows.filter((s) => s.total >= 70 || (s.classAverage !== null && s.total >= s.classAverage + 8)).slice(0, 3);
  const focus = [...subjectRows]
    .reverse()
    .filter((s) => s.total < 55 || (s.change !== null && s.change <= -8) || (s.classAverage !== null && s.total <= s.classAverage - 10))
    .slice(0, 3);

  /* ------------------------------- homework ------------------------------ */
  const today = new Date().toISOString();
  const assignments = (await ctx.db.query("assignments").withIndex("by_class", (q) => q.eq("classId", student.classId)).collect()).filter(
    (a) => a.status === "published" || a.status === "closed",
  );
  const due = assignments.filter((a) => a.dueDate <= today);
  const submissions = await ctx.db.query("submissions").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect();
  const subByAssignment = new Map(submissions.map((s) => [s.assignmentId as string, s]));
  let late = 0;
  const topicScores = new Map<string, { subject: string; topic: string; scores: number[] }>();
  const subjectHomework = new Map<string, { due: number; done: number; scores: number[] }>();
  for (const a of due) {
    const s = subByAssignment.get(a._id);
    const sh = subjectHomework.get(a.subjectId) ?? { due: 0, done: 0, scores: [] };
    sh.due += 1;
    if (s) {
      sh.done += 1;
      if (s.submittedAt > a.dueDate) late += 1;
    }
    subjectHomework.set(a.subjectId, sh);
  }
  for (const a of assignments) {
    const s = subByAssignment.get(a._id);
    if (!s || s.status !== "graded" || s.score === undefined || !a.maxScore) continue;
    const score = pct(s.score, a.maxScore);
    const sh = subjectHomework.get(a.subjectId) ?? { due: 0, done: 0, scores: [] };
    sh.scores.push(score);
    subjectHomework.set(a.subjectId, sh);
    const key = `${a.subjectId}::${a.topic.trim().toLowerCase()}`;
    const t = topicScores.get(key) ?? { subject: subjectName(a.subjectId), topic: a.topic.trim() || a.title, scores: [] };
    t.scores.push(score);
    topicScores.set(key, t);
  }
  const gradedScores = [...subjectHomework.values()].flatMap((x) => x.scores);
  const topics = [...topicScores.values()]
    .map((t) => ({ subject: t.subject, topic: t.topic, score: avg(t.scores)!, pieces: t.scores.length }))
    .sort((a, b) => a.score - b.score);

  /* -------------------------------- quizzes ------------------------------ */
  const attempts = (await ctx.db.query("quizAttempts").withIndex("by_student", (q) => q.eq("studentId", studentId)).collect()).filter(
    (a) => (a.status ?? "submitted") === "submitted" && !a.needsMarking && a.maxScore > 0,
  );
  const quizScores = attempts.map((a) => pct(a.score, a.maxScore));

  /* ------------------------------ attendance ----------------------------- */
  const att = await ctx.db
    .query("attendance")
    .withIndex("by_student", (q) => q.eq("studentId", studentId).gte("date", dayKey(-56)))
    .collect();
  const rateOf = (rows: typeof att) => (rows.length ? pct(rows.filter((r) => r.status === "present" || r.status === "late").length, rows.length) : null);
  const recentCut = dayKey(-28);
  const attendance = {
    rate: rateOf(att),
    recent: rateOf(att.filter((r) => r.date >= recentCut)),
    earlier: rateOf(att.filter((r) => r.date < recentCut)),
    late: att.filter((r) => r.status === "late").length,
    days: att.length,
  };

  /* -------------------------------- reading ------------------------------ */
  const reading = await ctx.db
    .query("readingLogs")
    .withIndex("by_student", (q) => q.eq("studentId", studentId).gte("date", dayKey(-30)))
    .collect();
  const readingMinutes = reading.reduce((n, l) => n + l.minutes, 0);

  /* -------------------------------- signals ------------------------------ */
  const signals: Signal[] = [];
  const latestAvg = termTrend.at(-1)?.average ?? null;
  const prevAvg = termTrend.at(-2)?.average ?? null;
  if (latestAvg !== null && prevAvg !== null) {
    const d = latestAvg - prevAvg;
    if (d >= 5) signals.push({ tone: "success", area: "Results", text: `Term average rose ${d} points to ${latestAvg}%.` });
    else if (d <= -5) signals.push({ tone: "warning", area: "Results", text: `Term average fell ${Math.abs(d)} points to ${latestAvg}%.` });
  }
  if (latestAvg !== null && latestAvg < 50) signals.push({ tone: "danger", area: "Results", text: `Term average is ${latestAvg}%, below the pass mark.` });
  for (const f of focus) {
    signals.push({
      tone: "warning",
      area: f.subject,
      text:
        f.change !== null && f.change <= -8
          ? `${f.subject} dropped ${Math.abs(f.change)} points to ${f.total}.`
          : f.classAverage !== null && f.total <= f.classAverage - 10
            ? `${f.subject} is ${f.classAverage - f.total} points below the class average.`
            : `${f.subject} is at ${f.total} — worth extra practice.`,
    });
  }
  const homeworkRate = due.length ? pct(due.filter((a) => subByAssignment.has(a._id)).length, due.length) : null;
  if (homeworkRate !== null && homeworkRate < 80) signals.push({ tone: homeworkRate < 60 ? "danger" : "warning", area: "Homework", text: `${homeworkRate}% of homework handed in.` });
  else if (homeworkRate === 100 && due.length >= 3) signals.push({ tone: "success", area: "Homework", text: "Every piece of homework handed in." });
  for (const t of topics.filter((x) => x.score < 50).slice(0, 2)) {
    signals.push({ tone: "info", area: t.subject, text: `"${t.topic}" averaged ${t.score}% — a topic to revisit.` });
  }
  if (attendance.rate !== null && attendance.days >= 10 && attendance.rate < 90) {
    signals.push({ tone: attendance.rate < 85 ? "danger" : "warning", area: "Attendance", text: `Attendance is ${attendance.rate}% over the last eight weeks.` });
  }
  if (attendance.recent !== null && attendance.earlier !== null && attendance.earlier - attendance.recent >= 8) {
    signals.push({ tone: "warning", area: "Attendance", text: `Attendance dipped from ${attendance.earlier}% to ${attendance.recent}% in the last four weeks.` });
  }
  if (readingMinutes >= 300) signals.push({ tone: "success", area: "Reading", text: `${readingMinutes} minutes of reading logged this month.` });

  return {
    student: { id: student._id, firstName: student.firstName, lastName: student.lastName, classId: student.classId },
    termTrend,
    latestTerm: latest ? { id: latest._id, name: latest.name } : null,
    subjects: subjectRows,
    strengths,
    focus,
    homework: {
      due: due.length,
      done: due.filter((a) => subByAssignment.has(a._id)).length,
      rate: homeworkRate,
      late,
      averageScore: avg(gradedScores),
      bySubject: [...subjectHomework.entries()]
        .map(([id, x]) => ({ subject: subjectName(id), due: x.due, done: x.done, averageScore: avg(x.scores) }))
        .filter((x) => x.due > 0 || x.averageScore !== null)
        .sort((a, b) => a.subject.localeCompare(b.subject)),
    },
    topics,
    quizzes: { taken: attempts.length, averageScore: avg(quizScores) },
    attendance,
    reading: { minutes: readingMinutes, sessions: reading.length },
    signals,
  };
}

export type LearningProfile = NonNullable<Awaited<ReturnType<typeof learningProfile>>>;
