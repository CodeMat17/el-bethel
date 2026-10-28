/**
 * Give every seeded demo account a Clerk sign-in and link it in Convex, so the
 * portals can be used with real email/password sign-in. Development only.
 *
 *   node scripts/link-clerk.mjs [password]
 *
 * All demo accounts share one password (random unless given). Accounts that are
 * already linked are left alone; an existing Clerk user with the same email
 * is reused rather than duplicated.
 */

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value.replace(/^["']|["']$/g, "")]),
);
const secret = env.CLERK_SECRET_KEY;
if (!secret) throw new Error("Set CLERK_SECRET_KEY in .env.local.");

const password = process.argv[2] ?? `Elb-${randomBytes(6).toString("base64url")}-26`;

function convex(fn, args) {
  const out = execFileSync(process.execPath, [join(root, "node_modules/convex/bin/main.js"), "run", fn, JSON.stringify(args ?? {})], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  return JSON.parse(out);
}

async function clerk(path, init = {}) {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.map((e) => e.long_message ?? e.message).join("; ") ?? `Clerk ${res.status}`);
  return data;
}

// Seeded before sign-in moved to email; give them the address the README lists.
const FALLBACK_EMAILS = { david_chukwu: "pupil@ebia.com.ng" };

async function clerkUserFor(user) {
  const [existing] = await clerk(`/users?email_address=${encodeURIComponent(user.email)}`);
  if (existing) return { id: existing.id, created: false };
  const [firstName, ...rest] = user.name.replace(/^(Mrs|Mr|Miss|Dr|Mme|Prof)\.?\s+/i, "").split(/\s+/);
  const body = {
    username: user.username,
    password,
    first_name: firstName,
    last_name: rest.join(" ") || undefined,
    external_id: user._id,
  };
  return { id: (await clerk("/users", { method: "POST", body: JSON.stringify({ ...body, email_address: [user.email] }) })).id, created: true };
}

const users = convex("seed:demoAccounts");
const rows = [];
for (const user of users) {
  if (user.clerkUserId) {
    rows.push({ username: user.username, roles: user.roles.join(", "), status: "already linked" });
    continue;
  }
  user.email ??= FALLBACK_EMAILS[user.username];
  if (!user.email) {
    rows.push({ username: user.username, roles: user.roles.join(", "), status: "skipped: no email" });
    continue;
  }
  try {
    const { id, created } = await clerkUserFor(user);
    convex("seed:linkDemoAccount", { username: user.username, clerkUserId: id, email: user.email });
    rows.push({ username: user.username, roles: user.roles.join(", "), status: created ? "created + linked" : "existing Clerk user linked" });
  } catch (error) {
    rows.push({ username: user.username, roles: user.roles.join(", "), status: `failed: ${error.message}` });
  }
}
console.table(rows);
if (rows.some((r) => r.status.startsWith("created"))) console.log(`Password for new accounts: ${password}`);
