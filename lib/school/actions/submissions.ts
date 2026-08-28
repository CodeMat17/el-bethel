"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { z } from "zod";

import { assertStudentAccess, requirePupil, requireTeacher } from "@/lib/school/auth";
import { ACCEPTED_SUBMISSION_MIMES, MAX_UPLOAD_BYTES, gradeFor } from "@/lib/school/config";
import { DEMO_TODAY } from "@/lib/school/seed";
import { getDb } from "@/lib/school/store";
import type { Attachment, Submission } from "@/lib/school/types";

export interface SubmissionState {
  ok: boolean;
  message?: string;
}

/* ------------------------------ pupil submits ----------------------------- */

const submitSchema = z.object({
  assignmentId: z.string().min(1),
  textAnswer: z.string().trim().max(8000).optional().default(""),
});

export async function submitAssignment(
  _prev: SubmissionState,
  formData: FormData,
): Promise<SubmissionState> {
  const user = await requirePupil();
  if (!user.studentId) forbidden();

  const parsed = submitSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    textAnswer: formData.get("textAnswer"),
  });
  if (!parsed.success) {
    return { ok: false, message: "We couldn't read your submission. Please try again." };
  }

  const db = getDb();
  const assignment = db.assignments.find((a) => a.id === parsed.data.assignmentId);
  if (!assignment) return { ok: false, message: "We couldn't find that assignment." };

  const student = db.students.find((s) => s.id === user.studentId);
  // A pupil may only submit to an assignment set for their own class.
  if (!student || student.classId !== assignment.classId) forbidden();

  // Validate every uploaded file on the server — client validation is a convenience only.
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > 5) {
    return { ok: false, message: "Please upload no more than five files." };
  }
  const attachments: Attachment[] = [];
  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return { ok: false, message: `${file.name} is too large. Please choose a file smaller than 5 MB.` };
    }
    if (!ACCEPTED_SUBMISSION_MIMES.includes(file.type)) {
      return { ok: false, message: `${file.name} is not a supported file type. Use JPG, PNG, WEBP, PDF or DOCX.` };
    }
    attachments.push({
      id: `f-${Date.now().toString(36)}-${attachments.length}`,
      name: file.name,
      mime: file.type,
      sizeBytes: file.size,
      url: "#",
    });
  }

  const existing = db.submissions.find(
    (s) => s.assignmentId === assignment.id && s.studentId === student.id,
  );

  if (existing && ["graded", "returned"].includes(existing.status) && !assignment.allowResubmission) {
    return { ok: false, message: "This assignment has already been graded and cannot be resubmitted." };
  }

  if (attachments.length === 0 && !parsed.data.textAnswer) {
    return { ok: false, message: "Add a typed answer or upload a photo of your work before submitting." };
  }

  const now = DEMO_TODAY.toISOString();
  const late = new Date(assignment.dueDate) < DEMO_TODAY;

  if (existing) {
    existing.status = late ? "late" : "submitted";
    existing.textAnswer = parsed.data.textAnswer || existing.textAnswer;
    existing.files = attachments.length > 0 ? attachments : existing.files;
    existing.submittedAt = now;
    existing.version += 1;
    existing.score = undefined;
    existing.grade = undefined;
    existing.feedback = undefined;
    existing.gradedAt = undefined;
  } else {
    const submission: Submission = {
      id: `sub-${db.submissions.length + 1}-${Date.now().toString(36)}`,
      assignmentId: assignment.id,
      studentId: student.id,
      status: late ? "late" : "submitted",
      textAnswer: parsed.data.textAnswer,
      files: attachments,
      submittedAt: now,
      version: 1,
    };
    db.submissions.push(submission);
  }

  // Tell the teacher there is something to grade.
  const teacherUser = db.users.find((u) => u.teacherId === assignment.teacherId);
  if (teacherUser) {
    db.notifications.unshift({
      id: `ntf-${db.notifications.length + 1}`,
      userId: teacherUser.id,
      type: "assignment_published",
      title: "New submission to grade",
      body: `${student.firstName} ${student.lastName} submitted ${assignment.title}.`,
      href: "/portal/teacher/grading",
      createdAt: now,
      read: false,
    });
  }

  revalidatePath(`/portal/pupil/assignments/${assignment.id}`);
  revalidatePath("/portal/pupil/assignments");
  return { ok: true, message: late ? "Submitted — this was after the deadline, so it is marked late." : "Submitted. Well done!" };
}

/* ----------------------------- teacher grades ----------------------------- */

const gradeSchema = z.object({
  submissionId: z.string().min(1),
  score: z.coerce.number().min(0, "Score cannot be negative"),
  feedback: z.string().trim().max(2000).optional().default(""),
  outcome: z.enum(["graded", "resubmission_required"]),
});

export async function gradeSubmission(
  _prev: SubmissionState,
  formData: FormData,
): Promise<SubmissionState> {
  const user = await requireTeacher();

  const parsed = gradeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the grade you entered." };
  }

  const db = getDb();
  const submission = db.submissions.find((s) => s.id === parsed.data.submissionId);
  if (!submission) return { ok: false, message: "We couldn't find that submission." };

  const assignment = db.assignments.find((a) => a.id === submission.assignmentId);
  if (!assignment) return { ok: false, message: "We couldn't find that assignment." };

  // A teacher may only grade pupils in a class they teach.
  assertStudentAccess(user, submission.studentId);

  if (parsed.data.score > assignment.maxScore) {
    return { ok: false, message: `The maximum score for this assignment is ${assignment.maxScore}.` };
  }

  const now = DEMO_TODAY.toISOString();

  if (parsed.data.outcome === "resubmission_required") {
    submission.status = "resubmission_required";
    submission.feedback = parsed.data.feedback || "Please review your work and submit again.";
    submission.score = undefined;
    submission.grade = undefined;
  } else {
    const percentage = (parsed.data.score / assignment.maxScore) * 100;
    submission.status = "graded";
    submission.score = parsed.data.score;
    submission.grade = gradeFor(percentage).grade;
    submission.feedback = parsed.data.feedback;
    submission.gradedAt = now;
    submission.gradedBy = user.teacherId;
  }

  // Notify the pupil and every parent linked to them.
  const student = db.students.find((s) => s.id === submission.studentId);
  if (student) {
    const recipients = db.users.filter(
      (u) => u.studentId === student.id || (u.parentId && student.parentIds.includes(u.parentId)),
    );
    for (const recipient of recipients) {
      db.notifications.unshift({
        id: `ntf-${db.notifications.length + 1}-${recipient.id}`,
        userId: recipient.id,
        type: "assignment_graded",
        title:
          parsed.data.outcome === "graded"
            ? `${assignment.title} has been graded`
            : `${assignment.title} needs to be resubmitted`,
        body:
          parsed.data.outcome === "graded"
            ? `Score: ${parsed.data.score}/${assignment.maxScore}. ${parsed.data.feedback}`.trim()
            : submission.feedback ?? "",
        href: recipient.studentId ? "/portal/pupil/assignments" : "/portal/parent/assignments",
        createdAt: now,
        read: false,
      });
    }
  }

  db.auditLogs.unshift({
    id: `aud-${db.auditLogs.length + 1}`,
    actorId: user.id,
    actorName: user.name,
    action: parsed.data.outcome === "graded" ? "Graded a submission" : "Requested a resubmission",
    entity: "Submission",
    entityId: submission.id,
    newValue: parsed.data.outcome === "graded" ? `${parsed.data.score}/${assignment.maxScore}` : "resubmission_required",
    at: now,
    ip: "—",
    device: "Web",
  });

  revalidatePath("/portal/teacher/grading");
  revalidatePath(`/portal/teacher/assignments/${assignment.id}`);
  return {
    ok: true,
    message: parsed.data.outcome === "graded" ? "Grade saved and the family notified." : "Resubmission requested.",
  };
}
