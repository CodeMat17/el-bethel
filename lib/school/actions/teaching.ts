"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { destroyAsset } from "@/lib/school/cloudinary";
import { tryMutation } from "@/lib/school/convex";
import type { AttendanceStatus, CloudMedia, LearningMaterial } from "@/lib/school/types";

/**
 * Teacher actions. Convex checks that the caller teaches the class or subject;
 * these only translate form input and shape results for the UI.
 */

export interface TeachingState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

/* ------------------------------- attendance ------------------------------- */

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

export async function saveAttendance(_prev: TeachingState, formData: FormData): Promise<TeachingState> {
  const classId = String(formData.get("classId") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!classId || !date) return { ok: false, message: "Choose a class and a date." };

  const entries: { studentId: Id<"students">; status: AttendanceStatus; note?: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("status-") || typeof value !== "string") continue;
    const studentId = key.slice("status-".length);
    const status = STATUSES.includes(value as AttendanceStatus) ? (value as AttendanceStatus) : "present";
    const note = String(formData.get(`note-${studentId}`) ?? "").trim();
    entries.push({ studentId: studentId as Id<"students">, status, note: note || undefined });
  }

  const result = await tryMutation(api.attendance.save, { classId: classId as Id<"classes">, date, entries });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/teacher/attendance");
  return { ok: true, message: `Attendance saved for ${result.data.saved} pupils (${result.data.changed} changed).` };
}

/* --------------------------------- results -------------------------------- */

export async function saveSubjectScores(input: {
  classId: string;
  subjectId: string;
  termId: string;
  caMax: number;
  rows: { studentId: string; ca?: number; exam?: number }[];
}): Promise<TeachingState> {
  const result = await tryMutation(api.results.saveSubjectScores, {
    classId: input.classId as Id<"classes">,
    subjectId: input.subjectId as Id<"subjects">,
    termId: input.termId as Id<"terms">,
    caMax: input.caMax,
    rows: input.rows.map((r) => ({ studentId: r.studentId as Id<"students">, ca: r.ca, exam: r.exam })),
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/teacher/results");
  return { ok: true, message: `Scores saved for ${result.data.saved} pupils.` };
}

export async function publishClassResults(input: {
  classId: string;
  termId: string;
  comments: { studentId: string; teacherComment: string }[];
}): Promise<TeachingState> {
  const result = await tryMutation(api.results.publishClass, {
    classId: input.classId as Id<"classes">,
    termId: input.termId as Id<"terms">,
    comments: input.comments
      .filter((c) => c.teacherComment.trim())
      .map((c) => ({ studentId: c.studentId as Id<"students">, teacherComment: c.teacherComment })),
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal", "layout");
  return { ok: true, message: `Results published for ${result.data.published} pupils. Pupils and parents can see them now.` };
}

export async function unpublishClassResults(input: { classId: string; termId: string }): Promise<TeachingState> {
  const result = await tryMutation(api.results.unpublishClass, {
    classId: input.classId as Id<"classes">,
    termId: input.termId as Id<"terms">,
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal", "layout");
  return { ok: true, message: "Results withdrawn. Pupils and parents can no longer see them." };
}

/* --------------------------- learning materials --------------------------- */

export async function addMaterial(input: {
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  kind: LearningMaterial["kind"];
  url?: string;
  media?: CloudMedia;
}): Promise<TeachingState> {
  const result = await tryMutation(api.learning.addMaterial, {
    ...input,
    classId: input.classId as Id<"classes">,
    subjectId: input.subjectId as Id<"subjects">,
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/teacher/materials");
  return { ok: true, message: "Material published to the class." };
}

export async function removeMaterial(materialId: string): Promise<TeachingState> {
  const result = await tryMutation(api.learning.removeMaterial, { id: materialId as Id<"materials"> });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data?.publicId) await destroyAsset(result.data.publicId, result.data.resourceType ?? "image");
  revalidatePath("/portal/teacher/materials");
  return { ok: true, message: "Material removed." };
}
