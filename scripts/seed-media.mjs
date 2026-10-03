/**
 * Upload the demo photography to Cloudinary and attach it to the seeded Convex
 * records (news covers, event covers, gallery items). Development only.
 *
 *   npx convex run seed:demo      # first, so the records exist
 *   node scripts/seed-media.mjs
 *
 * Each record gets its own copy (elbethel/news/…), separate from the site's
 * photography (elbethel/site/…), because deleting a record deletes its media.
 * Uploads use fixed public ids with overwrite, so re-running replaces them.
 */

import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { eachLimit, root, upload } from "./cloudinary.mjs";
import { PHOTO_SOURCES } from "../lib/school/photos.ts";

const FOLDERS = { news: "elbethel/news", events: "elbethel/events", gallery: "elbethel/gallery" };

function convex(fn, args) {
  const out = execFileSync(process.execPath, [join(root, "node_modules/convex/bin/main.js"), "run", fn, JSON.stringify(args ?? {})], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    maxBuffer: 16 * 1024 * 1024,
  });
  return JSON.parse(out);
}

const targets = convex("seedMedia:targets");
const items = [];
await eachLimit(targets, 6, async (t) => {
  const src = PHOTO_SOURCES[t.seed];
  if (!src) {
    console.warn(`skip ${t.table}:${t.seed} (no built-in photo)`);
    return;
  }
  try {
    const media = await upload(src, `${FOLDERS[t.table]}/${t.seed}`);
    items.push({ table: t.table, match: t.match, media });
    console.log(`uploaded ${media.publicId}`);
  } catch (error) {
    console.error(String(error));
  }
});

let attached = 0;
const missing = [];
for (let i = 0; i < items.length; i += 25) {
  const result = convex("seedMedia:attach", { items: items.slice(i, i + 25) });
  attached += result.attached;
  missing.push(...result.missing);
}
console.log(`\nUploaded ${items.length} of ${targets.length} photos; attached to ${attached} records.`);
if (missing.length) console.log(`No record found for: ${missing.join(", ")}`);
