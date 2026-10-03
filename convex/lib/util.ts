import type { GenericId } from "convex/values";

import type { Doc, Id, TableNames } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Viewer } from "./access";
import { queueEmail } from "./delivery";

type Ctx = QueryCtx | MutationCtx;

type SystemFields = "_id" | "_creationTime" | "legacyId";

export type WithId<T extends { _id: GenericId<string> }> = Omit<T, SystemFields> & { id: T["_id"] };

/** Convert a Convex document into the app's domain shape (`id` instead of `_id`). */
export function withId<T extends { _id: GenericId<string>; _creationTime: number }>(doc: T): WithId<T> {
  const { _id, _creationTime, ...rest } = doc as T & { legacyId?: string };
  void _creationTime;
  delete (rest as { legacyId?: string }).legacyId;
  return { ...(rest as Omit<T, SystemFields>), id: _id };
}

/**
 * Resolve an id that came from a URL or form. Returns null instead of throwing
 * when the string is not an id of that table.
 */
export async function getByLooseId<T extends TableNames>(
  ctx: Ctx,
  table: T,
  id: string,
): Promise<Doc<T> | null> {
  const normalized = ctx.db.normalizeId(table, id);
  return normalized ? await ctx.db.get(normalized) : null;
}

export function looseId<T extends TableNames>(ctx: Ctx, table: T, id: string | undefined | null): Id<T> | null {
  if (!id) return null;
  return ctx.db.normalizeId(table, id);
}

export const nowISO = () => new Date().toISOString();
export const todayKey = () => new Date().toISOString().slice(0, 10);

export function compact<T>(items: (T | null | undefined)[]): T[] {
  return items.filter((x): x is T => x !== null && x !== undefined);
}

export async function audit(
  ctx: MutationCtx,
  actor: Viewer | null,
  entry: { action: string; entity: string; entityId: string; previousValue?: string; newValue?: string },
) {
  await ctx.db.insert("auditLogs", {
    actorId: actor?._id,
    actorName: actor?.name ?? "System",
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    previousValue: entry.previousValue,
    newValue: entry.newValue,
    at: nowISO(),
    ip: "—",
    device: "Web portal",
  });
}

export async function notify(
  ctx: MutationCtx,
  userId: Id<"users">,
  n: { type: string; title: string; body: string; href?: string },
) {
  const id = await ctx.db.insert("notifications", { userId, ...n, createdAt: nowISO(), read: false });
  await queueEmail(ctx, userId, id, n);
}

/** Users who should hear about a pupil: the pupil's own account and their parents' accounts. */
export async function accountsForStudent(ctx: Ctx, studentId: Id<"students">): Promise<Id<"users">[]> {
  const ids: Id<"users">[] = [];
  const pupil = await ctx.db
    .query("users")
    .withIndex("by_student", (q) => q.eq("studentId", studentId))
    .first();
  if (pupil?.active) ids.push(pupil._id);
  const links = await ctx.db
    .query("guardianships")
    .withIndex("by_student", (q) => q.eq("studentId", studentId))
    .collect();
  for (const link of links) {
    const parent = await ctx.db
      .query("users")
      .withIndex("by_parent", (q) => q.eq("parentId", link.parentId))
      .first();
    if (parent?.active) ids.push(parent._id);
  }
  return ids;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
