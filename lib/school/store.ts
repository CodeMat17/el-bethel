import "server-only";

import { buildDatabase, type Database } from "./seed";

/**
 * Single in-process data store.
 *
 * The specification recommends Convex + Clerk for production. This module is the
 * seam where that swap happens: every read and write in the application goes
 * through `getDb()` and the accessors in `data.ts`, never through the seed file
 * directly. Replacing the body of `getDb()` with a Convex client — and the
 * accessors with Convex queries — leaves the rest of the app untouched.
 *
 * The instance is cached on globalThis so that mutations survive Fast Refresh
 * and route-handler module reloads in development.
 */
const GLOBAL_KEY = Symbol.for("elbethel.database");

type GlobalWithDb = typeof globalThis & { [GLOBAL_KEY]?: Database };

export function getDb(): Database {
  const g = globalThis as GlobalWithDb;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = buildDatabase();
  }
  return g[GLOBAL_KEY];
}
