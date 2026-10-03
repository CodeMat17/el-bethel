import "server-only";

import { cache } from "react";

import { api } from "@/convex/_generated/api";
import { query } from "./convex";

/** The signed-in parent's children (Convex returns only their own). Cached per request. */
export const getMyChildren = cache(async () => await query(api.people.myChildren, {}));

/**
 * The "active child" for parent pages, from a query parameter. Falls back to the
 * first child; never trusts the input beyond picking from the parent's own list.
 */
export async function resolveActiveChild(requested?: string) {
  const children = await getMyChildren();
  if (children.length === 0) return null;
  return children.find((c) => c.id === requested) ?? children[0];
}
