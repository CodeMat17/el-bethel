"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { destroyAsset } from "@/lib/school/cloudinary";
import { tryMutation } from "@/lib/school/convex";
import type { CloudMedia } from "@/lib/school/types";

export interface SimpleState {
  ok: boolean;
  message?: string;
}

/* ------------------------------ profile photo ----------------------------- */

/** Set or remove the signed-in teacher's or parent's own profile photo. */
export async function setMyPhoto(photo?: CloudMedia): Promise<SimpleState> {
  const result = await tryMutation(api.people.setMyPhoto, { photo });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data.previousPhoto) await destroyAsset(result.data.previousPhoto);
  revalidatePath("/portal", "layout");
  return { ok: true, message: photo ? "Photo updated." : "Photo removed." };
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

/** Record when the signed-in user was last seen (at most hourly; see Convex). */
export async function touchLastLogin(): Promise<void> {
  await tryMutation(api.users.touchLastLogin, {});
}
