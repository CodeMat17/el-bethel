/**
 * Copy the public site's photography (lib/school/photos.ts) to Cloudinary.
 * Development/deployment helper; safe to re-run — each photo keeps its public id.
 *
 *   node scripts/upload-photos.mjs
 */

import { cloudName, eachLimit, upload } from "./cloudinary.mjs";
import {
  CLOUDINARY_CLOUD_NAME,
  PHOTO_SOURCES,
  PORTRAIT_SOURCES,
  photoPublicId,
  portraitPublicId,
} from "../lib/school/photos.ts";

if (cloudName !== CLOUDINARY_CLOUD_NAME) {
  throw new Error(`.env.local uses cloud "${cloudName}" but lib/school/photos.ts serves from "${CLOUDINARY_CLOUD_NAME}".`);
}

const jobs = [
  ...Object.entries(PHOTO_SOURCES).map(([seed, src]) => ({ src, publicId: photoPublicId(seed) })),
  ...PORTRAIT_SOURCES.map((src, i) => ({ src, publicId: portraitPublicId(i) })),
];

let failed = 0;
await eachLimit(jobs, 6, async ({ src, publicId }) => {
  try {
    await upload(src, publicId);
    console.log(`uploaded ${publicId}`);
  } catch (error) {
    failed++;
    console.error(String(error));
  }
});
console.log(`\nUploaded ${jobs.length - failed} of ${jobs.length} photos.`);
if (failed) process.exitCode = 1;
