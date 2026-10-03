// Pure helpers shared by pages. All data now comes from Convex (see lib/school/convex.ts).

import type { AttendanceRecord, ID, Student, Teacher, TimetableSlot } from "./types";

export const today = () => new Date();
export const todayKey = () => new Date().toISOString().slice(0, 10);

/** Weekday 1–5 for timetable lookups; weekends show Monday's lessons. */
export function schoolDay(date = new Date()): number {
  const weekday = date.getUTCDay();
  return weekday === 0 || weekday === 6 ? 1 : weekday;
}

export function studentName(student: Pick<Student, "firstName" | "lastName">): string {
  return `${student.firstName} ${student.lastName}`;
}

export function teacherName(teacher: Pick<Teacher, "title" | "firstName" | "lastName">): string {
  return `${teacher.title} ${teacher.firstName} ${teacher.lastName}`;
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

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: number;
}

export function summariseAttendance(records: Pick<AttendanceRecord, "status">[]): AttendanceSummary {
  const summary = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const r of records) summary[r.status] += 1;
  const total = records.length;
  const attended = summary.present + summary.late;
  return { ...summary, total, rate: total ? Math.round((attended / total) * 100) : 0 };
}

export function slotsForDay(slots: TimetableSlot[], day = schoolDay()): TimetableSlot[] {
  return slots.filter((s) => s.day === day).sort((a, b) => a.period - b.period);
}

export function sortTimetable(slots: TimetableSlot[]): TimetableSlot[] {
  return [...slots].sort((a, b) => a.day - b.day || a.period - b.period);
}

/** Read a single string search param. */
export function param(value: string | string[] | undefined, fallback = ""): string {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export function pageParam(value: string | string[] | undefined): number {
  return Number(param(value, "1")) || 1;
}

export type { ID };
