import { v } from "convex/values";

import { buildDatabase } from "../lib/school/seed";
import { internalAction, internalMutation } from "./_generated/server";
import { cloudMedia } from "./validators";

/**
 * Demo photography importer (development only), driven by scripts/seed-media.mjs:
 *
 *   node scripts/seed-media.mjs
 *
 * The script asks `targets` which seeded records want a photo, uploads the
 * matching built-in photo (lib/school/photos.ts) to Cloudinary, then calls
 * `attach` to store the Cloudinary reference on each record.
 */

/** Records from the demo dataset that can carry a photo, keyed by their photo seed. */
export const targets = internalAction({
  args: {},
  handler: async () => {
    const db = buildDatabase();
    return [
      ...db.news.map((n) => ({ table: "news" as const, seed: n.slug, match: n.slug })),
      ...db.events.map((e) => ({ table: "events" as const, seed: e.slug, match: e.slug })),
      // Gallery photos are keyed by the demo id ("gal-1"), which Convex does not keep; match on title.
      ...db.gallery.map((g) => ({ table: "gallery" as const, seed: g.id, match: g.title })),
    ];
  },
});

export const attach = internalMutation({
  args: {
    items: v.array(
      v.object({
        table: v.union(v.literal("news"), v.literal("events"), v.literal("gallery")),
        match: v.string(),
        media: cloudMedia,
      }),
    ),
  },
  handler: async (ctx, { items }) => {
    let attached = 0;
    const missing: string[] = [];
    for (const { table, match, media } of items) {
      if (table === "gallery") {
        const rows = (await ctx.db.query("gallery").collect()).filter((g) => g.title === match);
        for (const row of rows) await ctx.db.patch(row._id, { media });
        attached += rows.length;
        if (!rows.length) missing.push(`${table}:${match}`);
        continue;
      }
      const row = await ctx.db.query(table).withIndex("by_slug", (q) => q.eq("slug", match)).first();
      if (!row) {
        missing.push(`${table}:${match}`);
        continue;
      }
      await ctx.db.patch(row._id, { cover: media });
      attached++;
    }
    return { attached, missing };
  },
});
