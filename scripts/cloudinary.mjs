/** Shared helpers for the development upload scripts: Cloudinary credentials and signed uploads. */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const root = join(import.meta.dirname, "..");

const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value.replace(/^["']|["']$/g, "")]),
);
export const cloudName = env.CLOUDINARY_CLOUD_NAME;
const apiKey = env.CLOUDINARY_API_KEY;
const apiSecret = env.CLOUDINARY_API_SECRET;
if (!cloudName || !apiKey || !apiSecret) throw new Error("Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local.");

function sign(params) {
  const payload = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return createHash("sha1").update(payload + apiSecret).digest("hex");
}

/** A photo source (remote URL or /public path) as a data URI. */
async function fileFor(src) {
  if (src.startsWith("/")) {
    const ext = src.split(".").pop().toLowerCase();
    return `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${readFileSync(join(root, "public", src)).toString("base64")}`;
  }
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Download failed (${res.status}) ${src}`);
  const type = res.headers.get("content-type") ?? "image/jpeg";
  return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
}

/**
 * Upload an image to a fixed public id ("elbethel/site/hero-a"), replacing any
 * earlier copy, and return it in the shape Convex stores (validators.cloudMedia).
 */
export async function upload(src, publicId) {
  // Folder and name are sent separately so the Media Library shows the folder too.
  const slash = publicId.lastIndexOf("/");
  const params = {
    folder: publicId.slice(0, slash),
    invalidate: "true",
    overwrite: "true",
    public_id: publicId.slice(slash + 1),
    timestamp: Math.floor(Date.now() / 1000),
  };
  const body = new FormData();
  for (const [k, value] of Object.entries(params)) body.append(k, String(value));
  body.append("api_key", apiKey);
  body.append("signature", sign(params));
  body.append("file", await fileFor(src));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body });
  const data = await res.json();
  if (!res.ok) throw new Error(`Cloudinary upload failed for ${publicId}: ${data.error?.message ?? res.status}`);
  return {
    publicId: data.public_id,
    url: data.secure_url,
    resourceType: "image",
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes,
  };
}

/** Run uploads a few at a time. */
export async function eachLimit(items, limit, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: limit }, async () => {
    while (queue.length) await fn(queue.shift());
  }));
}
