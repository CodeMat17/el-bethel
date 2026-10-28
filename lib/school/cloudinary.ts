import "server-only";

import { createHash } from "node:crypto";

/**
 * Cloudinary stores photos and videos; Convex stores only their public id and URL.
 * Uploads go straight from the browser to Cloudinary using a short-lived signature
 * minted here, so the API secret never leaves the server.
 */

export type MediaPurpose = "gallery" | "news" | "events" | "materials" | "people" | "tour" | "library" | "shop" | "alumni" | "site";

const FOLDERS: Record<MediaPurpose, string> = {
  gallery: "elbethel/gallery",
  news: "elbethel/news",
  events: "elbethel/events",
  materials: "elbethel/materials",
  people: "elbethel/people",
  tour: "elbethel/tour",
  library: "elbethel/library",
  shop: "elbethel/shop",
  alumni: "elbethel/alumni",
  site: "elbethel/site",
};

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.");
  }
  return { cloudName, apiKey, apiSecret };
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() && process.env.CLOUDINARY_API_KEY?.trim() && process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

/** Cloudinary request signature: SHA-1 of the sorted params plus the API secret. */
function sign(params: Record<string, string | number>, secret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(payload + secret).digest("hex");
}

export function signUpload(purpose: MediaPurpose) {
  const { cloudName, apiKey, apiSecret } = config();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: FOLDERS[purpose], timestamp };
  return { cloudName, apiKey, timestamp, folder: params.folder, signature: sign(params, apiSecret) };
}

/** Delete an asset after its record has been removed. Failures are logged, not thrown. */
export async function destroyAsset(publicId: string, resourceType: "image" | "video" = "image"): Promise<void> {
  if (!publicId || !isCloudinaryConfigured()) return;
  const { cloudName, apiKey, apiSecret } = config();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign({ public_id: publicId, timestamp }, apiSecret);
  const body = new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: apiKey, signature });
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, { method: "POST", body });
    if (!res.ok) console.error("Cloudinary destroy failed", publicId, await res.text());
  } catch (error) {
    console.error("Cloudinary destroy failed", publicId, error);
  }
}
