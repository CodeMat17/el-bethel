"use server";

import { revalidatePath } from "next/cache";
import { forbidden, redirect } from "next/navigation";
import { z } from "zod";

import { assertClassAccess, requireTeacher } from "@/lib/school/auth";
import { gradeFor } from "@/lib/school/config";
import { DEMO_TODAY } from "@/lib/school/seed";
import { getDb } from "@/lib/school/store";
import type { AttendanceStatus, SubmissionType } from "@/lib/school/types";

export interface TeachingState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function collect(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

/* ---------------------------- create assignment --------------------------- */

const assignmentSchema = z.object({
  title: z.string().trim().min(4, "Give the assignment a clear title"),
  topic: z.string().trim().min(2, "Enter the topic"),
  description: z.string().trim().max(2000).optional().default(""),
  instructions: z.string().trim().min(10, "Write instructions the pupils can follow"),
  classId: z.string().min(1, "Choose a class"),
  subjectId: z.string().min(1, "Choose a subject"),
  dueDate: z.string().min(1, "Choose a due date"),
  maxScore: z.coerce.number().int().min(1, "Maximum score must be at least 1").max(100, "Maximum score cannot exceed 100"),
  allowResubmission: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

export async function createAssignment(_prev: TeachingState, formData: FormData): Promise<TeachingState> {
  const user = await requireTeacher();

  const parsed = assignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: collect(parsed.error), message: "Please check the highlighted fields." };
  }

  // A teacher may only set work for a class they teach.
  assertClassAccess(user, parsed.data.classId);

  const db = getDb();
  const submissionTypes = formData.getAll("submissionTypes").map(String) as SubmissionType[];
  const now = DEMO_TODAY.toISOString();
  const dueDate = new Date(`${parsed.data.dueDate}T18:00:00.000Z`);
  if (Number.isNaN(dueDate.getTime())) {
    return { ok: false, fieldErrors: { dueDate: "Choose a valid date" } };
  }

  const id = `asg-${db.assignments.length + 1}-${Date.now().toString(36)}`;
  db.assignments.unshift({
    id,
    title: parsed.data.title,
    topic: parsed.data.topic,
    description: parsed.data.description,
    instructions: parsed.data.instructions,
    classId: parsed.data.classId,
    subjectId: parsed.data.subjectId,
    teacherId: user.teacherId ?? "",
    termId: db.activeTermId,
    publishedAt: now,
    startDate: now,
    dueDate: dueDate.toISOString(),
    maxScore: parsed.data.maxScore,
    submissionTypes: submissionTypes.length > 0 ? submissionTypes : ["text", "image", "pdf"],
    allowResubmission: parsed.data.allowResubmission === "on",
    attachments: [],
    status: parsed.data.status,
  });

  if (parsed.data.status === "published") {
    // Notify every pupil in the class and their parents.
    const roster = db.students.filter((s) => s.classId === parsed.data.classId);
    for (const student of roster) {
      const recipients = db.users.filter(
        (u) => u.studentId === student.id || (u.parentId && student.parentIds.includes(u.parentId)),
      );
      for (const recipient of recipients) {
        db.notifications.unshift({
          id: `ntf-${db.notifications.length + 1}-${recipient.id}`,
          userId: recipient.id,
          type: "assignment_published",
          title: `New ${db.subjects.find((s) => s.id === parsed.data.subjectId)?.name ?? ""} assignment posted`,
          body: `${parsed.data.title} — due ${parsed.data.dueDate}.`,
          href: recipient.studentId ? "/portal/pupil/assignments" : "/portal/parent/assignments",
          createdAt: now,
          read: false,
        });
      }
    }
  }

  db.auditLogs.unshift({
    id: `aud-${db.auditLogs.length + 1}`,
    actorId: user.id,
    actorName: user.name,
    action: "Created assignment",
    entity: "Assignment",
    entityId: id,
    newValue: parsed.data.title,
    at: now,
    ip: "—",
    device: "Web",
  });

  revalidatePath("/portal/teacher/assignments");
  redirect(`/portal/teacher/assignments/${id}`);
}

/* ------------------------------- attendance ------------------------------- */

const VALID_STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

export async function saveAttendance(_prev: TeachingState, formData: FormData): Promise<TeachingState> {
  const user = await requireTeacher();

  const classId = String(formData.get("classId") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!classId || !date) return { ok: false, message: "Choose a class and a date." };

  assertClassAccess(user, classId);

  const db = getDb();
  const roster = db.students.filter((s) => s.classId === classId);
  let changed = 0;

  for (const student of roster) {
    const raw = String(formData.get(`status-${student.id}`) ?? "present") as AttendanceStatus;
    const status = VALID_STATUSES.includes(raw) ? raw : "present";
    const note = String(formData.get(`note-${student.id}`) ?? "").trim();

    const existing = db.attendance.find((a) => a.studentId === student.id && a.date === date);
    if (existing) {
      if (existing.status !== status || (existing.note ?? "") !== note) changed += 1;
      existing.status = status;
      existing.note = note || undefined;
      existing.recordedBy = user.teacherId ?? existing.recordedBy;
    } else {
      changed += 1;
      db.attendance.push({
        id: `att-${db.attendance.length + 1}-${student.id}`,
        studentId: student.id,
        classId,
        date,
        status,
        note: note || undefined,
        recordedBy: user.teacherId ?? "",
      });
    }

    // Notify the family when a child is marked absent.
    if (status === "absent") {
      const parents = db.users.filter((u) => u.parentId && student.parentIds.includes(u.parentId));
      for (const parent of parents) {
        db.notifications.unshift({
          id: `ntf-${db.notifications.length + 1}-${parent.id}-${date}`,
          userId: parent.id,
          type: "attendance_alert",
          title: "Attendance notice",
          body: `${student.firstName} was marked absent from school today.`,
          href: "/portal/parent/attendance",
          createdAt: DEMO_TODAY.toISOString(),
          read: false,
        });
      }
    }
  }

  db.auditLogs.unshift({
    id: `aud-${db.auditLogs.length + 1}`,
    actorId: user.id,
    actorName: user.name,
    action: "Recorded class attendance",
    entity: "Attendance",
    entityId: `${classId}:${date}`,
    newValue: `${roster.length} pupils`,
    at: DEMO_TODAY.toISOString(),
    ip: "—",
    device: "Web",
  });

  revalidatePath("/portal/teacher/attendance");
  return { ok: true, message: `Attendance saved for ${roster.length} pupils (${changed} changed).` };
}

/* --------------------------------- results -------------------------------- */

export async function saveResults(_prev: TeachingState, formData: FormData): Promise<TeachingState> {
  const user = await requireTeacher();

  const classId = String(formData.get("classId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const termId = String(formData.get("termId") ?? "");
  if (!classId || !subjectId || !termId) {
    return { ok: false, message: "Choose a class, subject and term." };
  }

  assertClassAccess(user, classId);

  const db = getDb();
  const roster = db.students.filter((s) => s.classId === classId);
  let saved = 0;

  for (const student of roster) {
    const classwork = Number(formData.get(`classwork-${student.id}`) ?? 0);
    const assignment = Number(formData.get(`assignment-${student.id}`) ?? 0);
    const test = Number(formData.get(`test-${student.id}`) ?? 0);
    const exam = Number(formData.get(`exam-${student.id}`) ?? 0);

    if ([classwork, assignment, test, exam].some((n) => Number.isNaN(n) || n < 0)) {
      return { ok: false, message: "Scores must be zero or greater." };
    }
    if (classwork > 10 || assignment > 10 || test > 20 || exam > 60) {
      return {
        ok: false,
        message: "Scores are out of range: classwork and assignments are out of 10, tests out of 20 and the examination out of 60.",
      };
    }

    const ca = classwork + assignment + test;
    const total = Math.min(100, ca + exam);
    const { grade, remark } = gradeFor(total);

    const existing = db.results.find(
      (r) => r.studentId === student.id && r.subjectId === subjectId && r.termId === termId,
    );
    if (existing) {
      existing.scores = { classwork, assignment, test, exam };
      existing.ca = ca;
      existing.exam = exam;
      existing.total = total;
      existing.grade = grade;
      existing.remark = remark;
    } else {
      db.results.push({
        id: `res-${db.results.length + 1}-${student.id}`,
        studentId: student.id,
        subjectId,
        classId,
        termId,
        scores: { classwork, assignment, test, exam },
        ca,
        exam,
        total,
        grade,
        remark,
      });
    }
    saved += 1;
  }

  db.auditLogs.unshift({
    id: `aud-${db.auditLogs.length + 1}`,
    actorId: user.id,
    actorName: user.name,
    action: "Entered subject results",
    entity: "Result",
    entityId: `${classId}:${subjectId}:${termId}`,
    newValue: `${saved} pupils`,
    at: DEMO_TODAY.toISOString(),
    ip: "—",
    device: "Web",
  });

  revalidatePath("/portal/teacher/results");
  return { ok: true, message: `Scores saved for ${saved} pupils.` };
}

/* --------------------------- learning materials --------------------------- */

const materialSchema = z.object({
  title: z.string().trim().min(4, "Give the material a title"),
  description: z.string().trim().min(10, "Add a short description"),
  classId: z.string().min(1, "Choose a class"),
  subjectId: z.string().min(1, "Choose a subject"),
  kind: z.enum(["note", "pdf", "worksheet", "video", "audio", "slides", "link", "image"]),
  url: z.string().trim().optional().default("#"),
});

export async function uploadMaterial(_prev: TeachingState, formData: FormData): Promise<TeachingState> {
  const user = await requireTeacher();

  const parsed = materialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: collect(parsed.error), message: "Please check the highlighted fields." };
  }

  assertClassAccess(user, parsed.data.classId);

  const file = formData.get("file");
  let sizeBytes = 0;
  if (file instanceof File && file.size > 0) {
    if (file.size > 20 * 1024 * 1024) {
      return { ok: false, message: "This file is too large. Please choose a file smaller than 20 MB." };
    }
    sizeBytes = file.size;
  }

  const db = getDb();
  db.materials.unshift({
    id: `mat-${db.materials.length + 1}-${Date.now().toString(36)}`,
    title: parsed.data.title,
    description: parsed.data.description,
    classId: parsed.data.classId,
    subjectId: parsed.data.subjectId,
    teacherId: user.teacherId ?? "",
    kind: parsed.data.kind,
    url: parsed.data.url || "#",
    sizeBytes,
    uploadedAt: DEMO_TODAY.toISOString(),
    downloads: 0,
  });

  revalidatePath("/portal/teacher/materials");
  return { ok: true, message: "Material published to the class." };
}

/* -------------------------- teacher availability -------------------------- */

export async function addAvailability(_prev: TeachingState, formData: FormData): Promise<TeachingState> {
  const user = await requireTeacher();
  if (!user.teacherId) forbidden();

  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  if (!date || !time) return { ok: false, message: "Choose a date and a time." };

  const db = getDb();
  const duplicate = db.availability.some(
    (a) => a.teacherId === user.teacherId && a.date === date && a.time === time,
  );
  if (duplicate) return { ok: false, message: "That slot is already published." };

  db.availability.push({
    id: `avl-${db.availability.length + 1}-${Date.now().toString(36)}`,
    teacherId: user.teacherId,
    date,
    time,
    taken: false,
  });

  revalidatePath("/portal/teacher/appointments");
  return { ok: true, message: "Slot published. Parents can now book it." };
}
