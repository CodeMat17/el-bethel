"use server";

import { getSessionUser, hasRole } from "@/lib/school/auth";
import { signUpload, type MediaPurpose } from "@/lib/school/cloudinary";

export type UploadTicket =
  | { ok: true; cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string }
  | { ok: false; message: string };

/** Who may upload what. The record that references the upload is re-checked by Convex. */
const ALLOWED: Record<MediaPurpose, ("super_admin" | "admin" | "teacher")[]> = {
  gallery: ["super_admin", "admin"],
  news: ["super_admin", "admin"],
  events: ["super_admin", "admin"],
  people: ["super_admin", "admin"],
  materials: ["super_admin", "admin", "teacher"],
  tour: ["super_admin", "admin"],
  library: ["super_admin", "admin"],
  shop: ["super_admin", "admin"],
  alumni: ["super_admin", "admin"],
};

export async function requestUploadTicket(purpose: MediaPurpose): Promise<UploadTicket> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Please sign in again." };
  if (!(purpose in ALLOWED) || !hasRole(user, ...ALLOWED[purpose])) {
    return { ok: false, message: "You don't have permission to upload here." };
  }
  try {
    return { ok: true, ...signUpload(purpose) };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Photo and video uploads are not configured yet." };
  }
}
