import "server-only";

import { cache } from "react";

import { api } from "@/convex/_generated/api";
import { CLASS_LEVELS } from "./config";
import { publicQuery } from "./convex";
import { SITE_TAGS, siteCache } from "./site-cache";
import type { AcademicSession, ID, SchoolClass, Subject, Teacher, TeachingAssignment, Term } from "./types";

/**
 * Reference data (classes, subjects, teachers, terms) loaded once per request and
 * exposed as synchronous lookups, so pages can resolve names inside render loops.
 */
export interface Directory {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  teaching: TeachingAssignment[];
  terms: Term[];
  sessions: AcademicSession[];
  activeTerm: Term | null;
  getClass(id: ID | null | undefined): SchoolClass | null;
  getSubject(id: ID | null | undefined): Subject | null;
  getTeacher(id: ID | null | undefined): Teacher | null;
  getTerm(id: ID | null | undefined): Term | null;
  getSession(id: ID | null | undefined): AcademicSession | null;
  className(id: ID | null | undefined): string;
  subjectName(id: ID | null | undefined): string;
  teacherName(id: ID | null | undefined): string;
  termName(id: ID | null | undefined): string;
  levelName(levelId: ID | null | undefined): string;
  /** True for JSS classes, whose learners are called students and get a more grown-up portal. */
  isSecondaryClass(id: ID | null | undefined): boolean;
  /** Classes a teacher teaches in or is class teacher of. */
  classesForTeacher(teacherId: ID | null | undefined): SchoolClass[];
  /** Subjects a teacher teaches in a class (all of the class's subjects for its class teacher). */
  subjectsForTeacherInClass(teacherId: ID | null | undefined, classId: ID): Subject[];
  subjectsForTeacher(teacherId: ID | null | undefined): Subject[];
  subjectsForClass(classId: ID): Subject[];
  /** Who teaches a subject in a class. */
  teacherFor(classId: ID, subjectId: ID): Teacher | null;
}

export function formatTeacherName(t: Pick<Teacher, "title" | "firstName" | "lastName">): string {
  return `${t.title} ${t.firstName} ${t.lastName}`;
}

function build(data: Awaited<ReturnType<typeof load>>): Directory {
  const classes = [...data.classes].sort((a, b) => {
    const la = CLASS_LEVELS.find((l) => l.id === a.levelId)?.order ?? 99;
    const lb = CLASS_LEVELS.find((l) => l.id === b.levelId)?.order ?? 99;
    return la - lb || a.name.localeCompare(b.name);
  });
  const byId = <T extends { id: ID }>(items: T[]) => new Map(items.map((i) => [i.id, i] as const));
  const classMap = byId(classes);
  const subjectMap = byId(data.subjects);
  const teacherMap = byId(data.teachers);
  const termMap = byId(data.terms);
  const sessionMap = byId(data.sessions);

  const getClass = (id: ID | null | undefined) => (id ? classMap.get(id) ?? null : null);
  const getSubject = (id: ID | null | undefined) => (id ? subjectMap.get(id) ?? null : null);
  const getTeacher = (id: ID | null | undefined) => (id ? teacherMap.get(id) ?? null : null);
  const getTerm = (id: ID | null | undefined) => (id ? termMap.get(id) ?? null : null);
  const getSession = (id: ID | null | undefined) => (id ? sessionMap.get(id) ?? null : null);

  const subjectsForClass = (classId: ID) => {
    const cls = getClass(classId);
    if (!cls) return [];
    return data.subjects.filter((s) => s.levelIds.includes(cls.levelId));
  };

  return {
    classes,
    subjects: data.subjects,
    teachers: data.teachers,
    teaching: data.teaching,
    terms: data.terms,
    sessions: data.sessions,
    activeTerm: data.activeTermId ? termMap.get(data.activeTermId) ?? null : null,
    getClass,
    getSubject,
    getTeacher,
    getTerm,
    getSession,
    className: (id) => getClass(id)?.name ?? "Unassigned",
    subjectName: (id) => getSubject(id)?.name ?? "—",
    teacherName: (id) => {
      const t = getTeacher(id);
      return t ? formatTeacherName(t) : "Unassigned";
    },
    termName: (id) => getTerm(id)?.name ?? "—",
    levelName: (levelId) => CLASS_LEVELS.find((l) => l.id === levelId)?.name ?? "—",
    isSecondaryClass: (id) => {
      const levelId = getClass(id)?.levelId;
      return CLASS_LEVELS.find((l) => l.id === levelId)?.stage === "junior_secondary";
    },
    classesForTeacher: (teacherId) => {
      if (!teacherId) return [];
      const t = getTeacher(teacherId);
      return t ? classes.filter((c) => t.classIds.includes(c.id)) : [];
    },
    subjectsForTeacherInClass: (teacherId, classId) => {
      if (!teacherId) return [];
      const cls = getClass(classId);
      if (cls?.classTeacherId === teacherId) return subjectsForClass(classId);
      const ids = new Set(
        data.teaching.filter((r) => r.teacherId === teacherId && r.classId === classId).map((r) => r.subjectId),
      );
      return data.subjects.filter((s) => ids.has(s.id));
    },
    subjectsForTeacher: (teacherId) => {
      if (!teacherId) return [];
      const ids = new Set(data.teaching.filter((r) => r.teacherId === teacherId).map((r) => r.subjectId));
      return data.subjects.filter((s) => ids.has(s.id));
    },
    subjectsForClass,
    teacherFor: (classId, subjectId) => {
      const row = data.teaching.find((r) => r.classId === classId && r.subjectId === subjectId);
      return getTeacher(row?.teacherId);
    },
  };
}

async function load() {
  return await publicQuery(api.directory.get, {});
}

export const getDirectory = cache(async (): Promise<Directory> => build(await load()));

const loadForSite = siteCache(load, "directory", [SITE_TAGS.directory]);

/** The same directory for the public website, cached until an admin changes it. Portals use `getDirectory`. */
export const getPublicDirectory = cache(async (): Promise<Directory> => build(await loadForSite()));
