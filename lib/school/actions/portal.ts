"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/school/auth";
import { DEMO_TODAY } from "@/lib/school/seed";
import { getDb } from "@/lib/school/store";

export interface SimpleState {
  ok: boolean;
  message?: string;
}

/* ------------------------------ notifications ----------------------------- */

export async function markNotificationRead(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const notification = getDb().notifications.find((n) => n.id === id);
  // A user may only ever mark their own notification as read.
  if (notification && notification.userId === user.id) notification.read = true;
  revalidatePath("/portal");
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireUser();
  for (const notification of getDb().notifications) {
    if (notification.userId === user.id) notification.read = true;
  }
  revalidatePath("/portal");
}

/* --------------------------------- messages ------------------------------- */

const replySchema = z.object({
  threadId: z.string().min(1),
  body: z.string().trim().min(1, "Write a message before sending").max(4000, "Message is too long"),
});

export async function sendMessage(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const user = await requireUser();
  const parsed = replySchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your message." };
  }

  const db = getDb();
  const thread = db.messageThreads.find((t) => t.id === parsed.data.threadId);
  if (!thread) return { ok: false, message: "We couldn't find that conversation." };
  // Only a participant may post into a thread.
  if (!thread.participantIds.includes(user.id)) forbidden();

  const now = DEMO_TODAY.toISOString();
  thread.messages.push({
    id: `msg-${db.messageThreads.reduce((n, t) => n + t.messages.length, 0) + 1}`,
    senderId: user.id,
    body: parsed.data.body,
    sentAt: now,
    readBy: [user.id],
  });
  thread.updatedAt = now;

  for (const participantId of thread.participantIds) {
    if (participantId === user.id) continue;
    db.notifications.unshift({
      id: `ntf-${db.notifications.length + 1}`,
      userId: participantId,
      type: "message",
      title: `New message from ${user.name}`,
      body: parsed.data.body.slice(0, 120),
      href: "/portal",
      createdAt: now,
      read: false,
    });
  }

  revalidatePath(`/portal/parent/messages/${thread.id}`);
  revalidatePath(`/portal/teacher/messages/${thread.id}`);
  return { ok: true, message: "Message sent." };
}

export async function markThreadRead(formData: FormData): Promise<void> {
  const user = await requireUser();
  const thread = getDb().messageThreads.find((t) => t.id === String(formData.get("threadId") ?? ""));
  if (!thread || !thread.participantIds.includes(user.id)) return;
  for (const message of thread.messages) {
    if (!message.readBy.includes(user.id)) message.readBy.push(user.id);
  }
  revalidatePath("/portal");
}

/* ------------------------------- appointments ----------------------------- */

const bookingSchema = z.object({
  slotId: z.string().min(1, "Choose an available slot"),
  studentId: z.string().min(1),
  mode: z.enum(["in_person", "virtual"]),
  note: z.string().trim().max(500).optional().default(""),
});

export async function bookAppointment(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const user = await requireUser();
  if (!user.parentId) forbidden();

  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the booking details." };
  }

  const db = getDb();
  const slot = db.availability.find((a) => a.id === parsed.data.slotId);
  if (!slot) return { ok: false, message: "That slot is no longer available." };
  if (slot.taken) return { ok: false, message: "Someone has just taken that slot. Please choose another." };

  const parent = db.parents.find((p) => p.id === user.parentId);
  if (!parent || !parent.studentIds.includes(parsed.data.studentId)) forbidden();

  slot.taken = true;
  db.appointments.unshift({
    id: `apt-${db.appointments.length + 1}-${Date.now().toString(36)}`,
    teacherId: slot.teacherId,
    parentId: parent.id,
    studentId: parsed.data.studentId,
    date: slot.date,
    time: slot.time,
    mode: parsed.data.mode,
    status: "confirmed",
    note: parsed.data.note,
  });

  db.notifications.unshift({
    id: `ntf-${db.notifications.length + 1}`,
    userId: user.id,
    type: "appointment",
    title: "Parent-teacher appointment confirmed",
    body: `Your meeting is confirmed for ${slot.date} at ${slot.time}.`,
    href: "/portal/parent/appointments",
    createdAt: DEMO_TODAY.toISOString(),
    read: false,
  });

  revalidatePath("/portal/parent/appointments");
  return { ok: true, message: "Your appointment is confirmed." };
}

export async function cancelAppointment(formData: FormData): Promise<void> {
  const user = await requireUser();
  const db = getDb();
  const appointment = db.appointments.find((a) => a.id === String(formData.get("id") ?? ""));
  if (!appointment) return;
  // Only the parent who booked it, or the teacher it is with, may cancel.
  const allowed = appointment.parentId === user.parentId || appointment.teacherId === user.teacherId;
  if (!allowed) forbidden();

  appointment.status = "cancelled";
  const slot = db.availability.find(
    (a) => a.teacherId === appointment.teacherId && a.date === appointment.date && a.time === appointment.time,
  );
  if (slot) slot.taken = false;

  revalidatePath("/portal/parent/appointments");
  revalidatePath("/portal/teacher/appointments");
}
