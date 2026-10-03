"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { tryMutation } from "@/lib/school/convex";

export interface SimpleState {
  ok: boolean;
  message?: string;
}

/* ------------------------------ notifications ----------------------------- */

export async function markNotificationRead(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  await tryMutation(api.notifications.markRead, { id: id as Id<"notifications"> });
  revalidatePath("/portal", "layout");
}

export async function markAllNotificationsRead(): Promise<void> {
  await tryMutation(api.notifications.markAllRead, {});
  revalidatePath("/portal", "layout");
}

/* --------------------------------- messages ------------------------------- */

export async function sendMessage(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const threadId = String(formData.get("threadId") ?? "");
  const body = String(formData.get("body") ?? "");
  const result = await tryMutation(api.messages.send, { threadId: threadId as Id<"messageThreads">, body });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal", "layout");
  return { ok: true, message: "Message sent." };
}

export async function startConversation(_prev: SimpleState, formData: FormData): Promise<SimpleState & { threadId?: string }> {
  const toUserId = String(formData.get("toUserId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const result = await tryMutation(api.messages.startThread, {
    toUserId: toUserId as Id<"users">,
    subject: String(formData.get("subject") ?? ""),
    body: String(formData.get("body") ?? ""),
    studentId: studentId ? (studentId as Id<"students">) : undefined,
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal", "layout");
  return { ok: true, message: "Message sent.", threadId: result.data };
}

export async function markThreadRead(formData: FormData): Promise<void> {
  const threadId = String(formData.get("threadId") ?? "");
  await tryMutation(api.messages.markRead, { threadId: threadId as Id<"messageThreads"> });
  revalidatePath("/portal", "layout");
}

/* ------------------------------- appointments ----------------------------- */

export async function bookAppointment(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const slotId = String(formData.get("slotId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const mode = String(formData.get("mode") ?? "in_person") === "virtual" ? "virtual" : "in_person";
  if (!slotId) return { ok: false, message: "Choose an available slot." };
  const result = await tryMutation(api.appointments.book, {
    slotId: slotId as Id<"availability">,
    studentId: studentId as Id<"students">,
    mode,
    note: String(formData.get("note") ?? ""),
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal", "layout");
  return { ok: true, message: "Your appointment is confirmed." };
}

export async function cancelAppointment(formData: FormData): Promise<void> {
  await tryMutation(api.appointments.cancel, { id: String(formData.get("id") ?? "") as Id<"appointments"> });
  revalidatePath("/portal", "layout");
}

export async function rescheduleAppointment(id: string, slotId: string): Promise<SimpleState> {
  if (!slotId) return { ok: false, message: "Choose a new slot." };
  const result = await tryMutation(api.appointments.reschedule, {
    id: id as Id<"appointments">,
    slotId: slotId as Id<"availability">,
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal", "layout");
  return { ok: true, message: "Meeting moved. Your child's teacher has been told." };
}

export async function completeAppointment(id: string): Promise<SimpleState> {
  const result = await tryMutation(api.appointments.complete, { id: id as Id<"appointments"> });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/teacher/appointments");
  return { ok: true, message: "Marked as held." };
}

export async function removeAvailability(id: string): Promise<SimpleState> {
  const result = await tryMutation(api.appointments.removeSlot, { id: id as Id<"availability"> });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/teacher/appointments");
  return { ok: true, message: "Slot removed." };
}

export async function addAvailability(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const result = await tryMutation(api.appointments.addSlot, {
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/portal/teacher/appointments");
  return { ok: true, message: "Slot published. Parents can now book it." };
}

/** Record when the signed-in user was last seen (at most hourly; see Convex). */
export async function touchLastLogin(): Promise<void> {
  await tryMutation(api.users.touchLastLogin, {});
}
