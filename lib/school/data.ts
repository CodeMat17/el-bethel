import "server-only";

import { cache } from "react";

import { DEMO_TODAY } from "./seed";
import { getDb } from "./store";
import type {
  Application,
  AppNotification,
  Assignment,
  AttendanceRecord,
  ID,
  Invoice,
  LearningMaterial,
  MessageThread,
  Parent,
  ReportCard,
  ResultEntry,
  SchoolClass,
  SessionUser,
  Student,
  Subject,
  Submission,
  Teacher,
  TimetableSlot,
} from "./types";

export const today = () => DEMO_TODAY;

/* ------------------------------ simple lookups ---------------------------- */

export const getClasses = cache((): SchoolClass[] => getDb().classes);
export const getClass = (id: ID) => getDb().classes.find((c) => c.id === id) ?? null;
export const getSubjects = cache((): Subject[] => getDb().subjects);
export const getSubject = (id: ID) => getDb().subjects.find((s) => s.id === id) ?? null;
export const getTeachers = cache((): Teacher[] => getDb().teachers);
export const getTeacher = (id: ID) => getDb().teachers.find((t) => t.id === id) ?? null;
export const getStudent = (id: ID) => getDb().students.find((s) => s.id === id) ?? null;
export const getParent = (id: ID) => getDb().parents.find((p) => p.id === id) ?? null;
export const getTerm = (id: ID) => getDb().terms.find((t) => t.id === id) ?? null;
export const getActiveTerm = () => getDb().terms.find((t) => t.id === getDb().activeTermId)!;
export const getLevels = () => getDb().levels;
export const getLevel = (id: ID) => getDb().levels.find((l) => l.id === id) ?? null;

export function classDisplayName(classId: ID): string {
  return getClass(classId)?.name ?? "Unassigned";
}

export function studentName(student: Student): string {
  return `${student.firstName} ${student.lastName}`;
}

export function teacherName(teacher: Teacher): string {
  return `${teacher.title} ${teacher.firstName} ${teacher.lastName}`;
}

export function teacherNameById(id: ID | null | undefined): string {
  if (!id) return "Unassigned";
  const t = getTeacher(id);
  return t ? teacherName(t) : "Unassigned";
}

/* -------------------------------- students -------------------------------- */

export const getStudentsByClass = cache((classId: ID): Student[] =>
  getDb()
    .students.filter((s) => s.classId === classId)
    .sort((a, b) => a.lastName.localeCompare(b.lastName)),
);

export function getChildrenOfParent(parentId: ID): Student[] {
  const parent = getParent(parentId);
  if (!parent) return [];
  return parent.studentIds
    .map((id) => getStudent(id))
    .filter((s): s is Student => Boolean(s));
}

export function getParentsOfStudent(studentId: ID): Parent[] {
  const student = getStudent(studentId);
  if (!student) return [];
  return student.parentIds.map((id) => getParent(id)).filter((p): p is Parent => Boolean(p));
}

export interface StudentFilter {
  search?: string;
  classId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export function paginate<T>(items: T[], page = 1, pageSize = 12): Paged<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  return {
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    total,
    page: safePage,
    pageSize,
    pageCount,
  };
}

export function findStudents(filter: StudentFilter): Paged<Student> {
  const term = filter.search?.trim().toLowerCase() ?? "";
  const filtered = getDb()
    .students.filter((s) => {
      if (filter.classId && filter.classId !== "all" && s.classId !== filter.classId) return false;
      if (filter.status && filter.status !== "all" && s.status !== filter.status) return false;
      if (!term) return true;
      return (
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
        s.studentNo.toLowerCase().includes(term) ||
        s.admissionNo.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => a.lastName.localeCompare(b.lastName));
  return paginate(filtered, filter.page, filter.pageSize ?? 12);
}

/* ------------------------------- assignments ------------------------------ */

export function getAssignment(id: ID): Assignment | null {
  return getDb().assignments.find((a) => a.id === id) ?? null;
}

export function getAssignmentsForClass(classId: ID): Assignment[] {
  return getDb()
    .assignments.filter((a) => a.classId === classId && a.status === "published")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getAssignmentsForTeacher(teacherId: ID): Assignment[] {
  return getDb()
    .assignments.filter((a) => a.teacherId === teacherId)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getSubmission(assignmentId: ID, studentId: ID): Submission | null {
  return (
    getDb().submissions.find((s) => s.assignmentId === assignmentId && s.studentId === studentId) ??
    null
  );
}

export function getSubmissionsForAssignment(assignmentId: ID): Submission[] {
  return getDb().submissions.filter((s) => s.assignmentId === assignmentId);
}

export interface AssignmentWithSubmission {
  assignment: Assignment;
  submission: Submission | null;
  subject: Subject | null;
  teacherLabel: string;
}

export function getStudentAssignments(studentId: ID): AssignmentWithSubmission[] {
  const student = getStudent(studentId);
  if (!student) return [];
  return getAssignmentsForClass(student.classId).map((assignment) => ({
    assignment,
    submission: getSubmission(assignment.id, studentId),
    subject: getSubject(assignment.subjectId),
    teacherLabel: teacherNameById(assignment.teacherId),
  }));
}

export interface AssignmentStats {
  students: number;
  submitted: number;
  notSubmitted: number;
  graded: number;
  pendingGrading: number;
  late: number;
}

export function getAssignmentStats(assignmentId: ID): AssignmentStats {
  const assignment = getAssignment(assignmentId);
  if (!assignment) {
    return { students: 0, submitted: 0, notSubmitted: 0, graded: 0, pendingGrading: 0, late: 0 };
  }
  const roster = getStudentsByClass(assignment.classId);
  const subs = getSubmissionsForAssignment(assignmentId);
  const submitted = subs.filter((s) =>
    ["submitted", "late", "grading", "graded", "returned"].includes(s.status),
  ).length;
  const graded = subs.filter((s) => s.status === "graded" || s.status === "returned").length;
  return {
    students: roster.length,
    submitted,
    notSubmitted: roster.length - submitted,
    graded,
    pendingGrading: submitted - graded,
    late: subs.filter((s) => s.status === "late").length,
  };
}

/* -------------------------------- attendance ------------------------------ */

export function getAttendanceForStudent(studentId: ID): AttendanceRecord[] {
  return getDb()
    .attendance.filter((a) => a.studentId === studentId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: number;
}

export function summariseAttendance(records: AttendanceRecord[]): AttendanceSummary {
  const summary = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const r of records) summary[r.status] += 1;
  const total = records.length;
  const attended = summary.present + summary.late;
  return { ...summary, total, rate: total ? Math.round((attended / total) * 100) : 0 };
}

export function getClassAttendanceForDate(classId: ID, date: string): AttendanceRecord[] {
  return getDb().attendance.filter((a) => a.classId === classId && a.date === date);
}

export function schoolAttendanceRateToday(): number {
  const date = DEMO_TODAY.toISOString().slice(0, 10);
  let records = getDb().attendance.filter((a) => a.date === date);
  if (records.length === 0) {
    const latest = getDb().attendance.reduce((max, a) => (a.date > max ? a.date : max), "");
    records = getDb().attendance.filter((a) => a.date === latest);
  }
  return summariseAttendance(records).rate;
}

/* --------------------------------- results -------------------------------- */

export function getResultsForStudent(studentId: ID, termId: ID): ResultEntry[] {
  return getDb().results.filter((r) => r.studentId === studentId && r.termId === termId);
}

export function getReportCard(studentId: ID, termId: ID): ReportCard | null {
  return getDb().reportCards.find((r) => r.studentId === studentId && r.termId === termId) ?? null;
}

export function getReportCardsForStudent(studentId: ID): ReportCard[] {
  return getDb()
    .reportCards.filter((r) => r.studentId === studentId)
    .sort((a, b) => (a.termId < b.termId ? 1 : -1));
}

/** Terms that actually have published results, newest first. */
export function getPublishedResultTerms(studentId: ID) {
  const termIds = new Set(getDb().reportCards.filter((r) => r.studentId === studentId).map((r) => r.termId));
  return getDb()
    .terms.filter((t) => termIds.has(t.id))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

/* ----------------------------------- fees --------------------------------- */

export function getInvoicesForStudent(studentId: ID): Invoice[] {
  return getDb().invoices.filter((i) => i.studentId === studentId);
}

export function getInvoice(id: ID): Invoice | null {
  return getDb().invoices.find((i) => i.id === id) ?? null;
}

export function getPaymentsForStudent(studentId: ID) {
  return getDb()
    .payments.filter((p) => p.studentId === studentId)
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

export function outstandingForStudents(studentIds: ID[]): number {
  return getDb()
    .invoices.filter((i) => studentIds.includes(i.studentId))
    .reduce((sum, i) => sum + (i.total - i.amountPaid), 0);
}

/* -------------------------------- timetable ------------------------------- */

export function getTimetableForClass(classId: ID): TimetableSlot[] {
  return getDb()
    .timetable.filter((t) => t.classId === classId)
    .sort((a, b) => a.day - b.day || a.period - b.period);
}

export function getTodaySlots(classId: ID): TimetableSlot[] {
  const weekday = DEMO_TODAY.getUTCDay();
  const day = weekday === 0 || weekday === 6 ? 1 : weekday;
  return getTimetableForClass(classId).filter((t) => t.day === day);
}

export function getTeacherTodaySlots(teacherId: ID): TimetableSlot[] {
  const weekday = DEMO_TODAY.getUTCDay();
  const day = weekday === 0 || weekday === 6 ? 1 : weekday;
  return getDb()
    .timetable.filter((t) => t.teacherId === teacherId && t.day === day)
    .sort((a, b) => a.period - b.period);
}

/* ------------------------------- materials -------------------------------- */

export function getMaterialsForClass(classId: ID): LearningMaterial[] {
  return getDb()
    .materials.filter((m) => m.classId === classId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function getMaterialsForTeacher(teacherId: ID): LearningMaterial[] {
  return getDb()
    .materials.filter((m) => m.teacherId === teacherId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

/* ------------------------------- quizzes ---------------------------------- */

export function getQuizzesForClass(classId: ID) {
  return getDb().quizzes.filter((q) => q.classId === classId && q.status === "published");
}

export function getQuiz(id: ID) {
  return getDb().quizzes.find((q) => q.id === id) ?? null;
}

export function getQuizAttempts(quizId: ID, studentId: ID) {
  return getDb().quizAttempts.filter((a) => a.quizId === quizId && a.studentId === studentId);
}

/* ---------------------------- notifications ------------------------------- */

export function getNotifications(userId: ID): AppNotification[] {
  return getDb()
    .notifications.filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function unreadCount(userId: ID): number {
  return getDb().notifications.filter((n) => n.userId === userId && !n.read).length;
}

/* -------------------------------- messages -------------------------------- */

export function getThreadsForUser(userId: ID): MessageThread[] {
  return getDb()
    .messageThreads.filter((t) => t.participantIds.includes(userId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getThread(id: ID): MessageThread | null {
  return getDb().messageThreads.find((t) => t.id === id) ?? null;
}

export function userDisplayName(userId: ID): string {
  return getDb().users.find((u) => u.id === userId)?.name ?? "School Staff";
}

/* ------------------------------- admissions ------------------------------- */

export function getApplicationsByEmail(email: string): Application[] {
  return getDb()
    .applications.filter((a) => a.ownerEmail.toLowerCase() === email.toLowerCase())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getApplicationByNumber(applicationNo: string): Application | null {
  return (
    getDb().applications.find(
      (a) => a.applicationNo.toLowerCase() === applicationNo.trim().toLowerCase(),
    ) ?? null
  );
}

export function getApplication(id: ID): Application | null {
  return getDb().applications.find((a) => a.id === id) ?? null;
}

/* ------------------------------ public content ---------------------------- */

export const getPublishedNews = cache(() =>
  getDb()
    .news.filter((n) => n.status === "published")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
);

export const getNewsBySlug = (slug: string) =>
  getDb().news.find((n) => n.slug === slug && n.status === "published") ?? null;

export const getUpcomingEvents = cache(() =>
  getDb()
    .events.filter((e) => e.status === "upcoming")
    .sort((a, b) => a.date.localeCompare(b.date)),
);

export const getAllEvents = cache(() =>
  [...getDb().events].sort((a, b) => a.date.localeCompare(b.date)),
);

export const getEventBySlug = (slug: string) => getDb().events.find((e) => e.slug === slug) ?? null;

export const getGallery = () => getDb().gallery;
export const getClubs = () => getDb().clubs;
export const getAchievements = () => getDb().achievements;
export const getTestimonials = () => getDb().testimonials;
export const getFaqs = () => getDb().faqs;
export const getPublicDocuments = () => getDb().documents.filter((d) => d.visibility === "public");
export const getVacancies = () => getDb().vacancies;
export const getVacancyBySlug = (slug: string) => getDb().vacancies.find((v) => v.slug === slug) ?? null;
export const getFeaturedTeachers = () => getDb().teachers.filter((t) => t.featured);
export const getActiveNotice = () =>
  getDb().emergencyNotices.find(
    (n) => n.active && new Date(n.startsAt) <= DEMO_TODAY && new Date(n.endsAt) >= DEMO_TODAY,
  ) ?? null;

/* --------------------------------- admin ---------------------------------- */

export interface AdminMetrics {
  students: number;
  teachers: number;
  parents: number;
  newApplicants: number;
  pendingAdmissions: number;
  attendanceRate: number;
  assignments: number;
  upcomingEvents: number;
  feesBilled: number;
  feesCollected: number;
  outstanding: number;
  collectionRate: number;
}

export const getAdminMetrics = cache((): AdminMetrics => {
  const db = getDb();
  const feesBilled = db.invoices.reduce((s, i) => s + i.total, 0);
  const feesCollected = db.invoices.reduce((s, i) => s + i.amountPaid, 0);
  const thirtyDaysAgo = new Date(DEMO_TODAY.getTime() - 30 * 86400000).toISOString();
  return {
    students: db.students.filter((s) => s.status === "active").length,
    teachers: db.teachers.filter((t) => t.active).length,
    parents: db.parents.length,
    newApplicants: db.applications.filter((a) => a.createdAt >= thirtyDaysAgo).length,
    pendingAdmissions: db.applications.filter((a) =>
      ["submitted", "under_review", "documents_required"].includes(a.status),
    ).length,
    attendanceRate: schoolAttendanceRateToday(),
    assignments: db.assignments.filter((a) => a.status === "published").length,
    upcomingEvents: db.events.filter((e) => e.status === "upcoming").length,
    feesBilled,
    feesCollected,
    outstanding: feesBilled - feesCollected,
    collectionRate: feesBilled ? Math.round((feesCollected / feesBilled) * 100) : 0,
  };
});

export function getEnrolmentByLevel() {
  const db = getDb();
  return db.levels.map((level) => {
    const classIds = db.classes.filter((c) => c.levelId === level.id).map((c) => c.id);
    return {
      level: level.name,
      count: db.students.filter((s) => classIds.includes(s.classId)).length,
    };
  });
}

export function getApplicationsByStatus() {
  const db = getDb();
  const counts = new Map<string, number>();
  for (const a of db.applications) counts.set(a.status, (counts.get(a.status) ?? 0) + 1);
  return [...counts.entries()].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
}

export function getGradeDistribution(termId: ID) {
  const db = getDb();
  const counts = new Map<string, number>();
  for (const r of db.results.filter((x) => x.termId === termId)) {
    counts.set(r.grade, (counts.get(r.grade) ?? 0) + 1);
  }
  return ["A", "B", "C", "D", "E", "F"].map((grade) => ({ grade, count: counts.get(grade) ?? 0 }));
}

export function getAttendanceTrend(days = 10) {
  const db = getDb();
  const byDate = new Map<string, { present: number; total: number }>();
  for (const a of db.attendance) {
    const entry = byDate.get(a.date) ?? { present: 0, total: 0 };
    entry.total += 1;
    if (a.status === "present" || a.status === "late") entry.present += 1;
    byDate.set(a.date, entry);
  }
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-days)
    .map(([date, v]) => ({ date, rate: v.total ? Math.round((v.present / v.total) * 100) : 0 }));
}

export function getSubmissionRate() {
  const db = getDb();
  const total = db.submissions.length;
  const submitted = db.submissions.filter((s) =>
    ["submitted", "late", "grading", "graded", "returned"].includes(s.status),
  ).length;
  const graded = db.submissions.filter((s) => s.status === "graded").length;
  const late = db.submissions.filter((s) => s.status === "late").length;
  const scores = db.submissions.filter((s) => typeof s.score === "number").map((s) => s.score ?? 0);
  return {
    total,
    submitted,
    graded,
    late,
    pending: submitted - graded,
    submissionRate: total ? Math.round((submitted / total) * 100) : 0,
    averageScore: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
  };
}

export function getAuditLogs(page = 1, pageSize = 15) {
  return paginate(getDb().auditLogs, page, pageSize);
}

/* -------------------------- portal-scoped helpers ------------------------- */

/** Children a signed-in parent may see, or an empty list for other roles. */
export function childrenForSession(user: SessionUser): Student[] {
  if (!user.parentId) return [];
  return getChildrenOfParent(user.parentId);
}

/**
 * Resolve the "active child" for the parent portal from a query parameter,
 * always falling back to the first authorised child. Never trusts the input.
 */
export function resolveActiveChild(user: SessionUser, requested?: string): Student | null {
  const children = childrenForSession(user);
  if (children.length === 0) return null;
  const match = requested ? children.find((c) => c.id === requested) : undefined;
  return match ?? children[0];
}

export function classesForTeacher(teacherId: ID): SchoolClass[] {
  const teacher = getTeacher(teacherId);
  if (!teacher) return [];
  return teacher.classIds
    .map((id) => getClass(id))
    .filter((c): c is SchoolClass => Boolean(c))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function subjectsForTeacher(teacherId: ID): Subject[] {
  const teacher = getTeacher(teacherId);
  if (!teacher) return [];
  return teacher.subjectIds.map((id) => getSubject(id)).filter((s): s is Subject => Boolean(s));
}

export function pendingGradingForTeacher(teacherId: ID) {
  const assignments = getAssignmentsForTeacher(teacherId);
  const ids = new Set(assignments.map((a) => a.id));
  return getDb()
    .submissions.filter(
      (s) => ids.has(s.assignmentId) && ["submitted", "late", "grading"].includes(s.status),
    )
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
}

export function globalSearch(query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return { news: [], events: [], staff: [], faqs: [], documents: [] };
  const db = getDb();
  return {
    news: db.news.filter((n) => n.status === "published" && n.title.toLowerCase().includes(q)).slice(0, 5),
    events: db.events.filter((e) => e.title.toLowerCase().includes(q)).slice(0, 5),
    staff: db.teachers
      .filter((t) => t.featured && `${t.firstName} ${t.lastName} ${t.position}`.toLowerCase().includes(q))
      .slice(0, 5),
    faqs: db.faqs.filter((f) => `${f.question} ${f.answer}`.toLowerCase().includes(q)).slice(0, 5),
    documents: db.documents
      .filter((d) => d.visibility === "public" && d.title.toLowerCase().includes(q))
      .slice(0, 5),
  };
}
