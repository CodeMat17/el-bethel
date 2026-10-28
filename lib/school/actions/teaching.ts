"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { tryMutation } from "@/lib/school/convex";

/**
 * Teacher actions. Convex checks that the caller teaches the class or subject;
 * these only translate form input and shape results for the UI.
 */

export interface TeachingState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
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
