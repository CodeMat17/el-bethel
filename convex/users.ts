import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import {
  fail,
  getViewer,
  isSuperAdmin,
  requireAdmin,
  requireViewer,
  type Viewer,
} from "./lib/access";
import { emailConfigured, emailFor, enqueueEmail } from "./lib/delivery";
import { audit, nowISO, withId } from "./lib/util";
import { role, type RoleValue } from "./validators";

const USERNAME = /^[a-z0-9_]{4,32}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRIVILEGED: RoleValue[] = ["super_admin", "admin", "site_admin"];

function toSessionUser(user: Doc<"users">, photoUrl?: string) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    username: user.username,
    roles: user.roles,
    avatarSeed: user.avatarSeed,
    photoUrl,
    teacherId: user.teacherId,
    parentId: user.parentId,
    studentId: user.studentId,
  };
}

/** The signed-in user, or null if they are signed out, unknown or disabled. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewer(ctx);
    if (!user) return null;
    const person = user.teacherId
      ? await ctx.db.get(user.teacherId)
      : user.parentId
        ? await ctx.db.get(user.parentId)
        : user.studentId
          ? await ctx.db.get(user.studentId)
          : null;
    return toSessionUser(user, person?.photo?.url);
  },
});

/**
 * Whether the Clerk identity has been provisioned here. Lets the app tell a
 * signed-in-but-unknown person what to do instead of looping on sign-in.
 */
export const provisioningStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { state: "signed_out" as const };
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) return { state: "unknown" as const, clerkUserId: identity.subject };
    if (!user.active) return { state: "disabled" as const };
    return { state: "ok" as const };
  },
});

/* --------------------------------- listing -------------------------------- */

export const list = query({
  args: {
    search: v.optional(v.string()),
    role: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("users").collect();
    const term = args.search?.trim().toLowerCase() ?? "";
    const filtered = all
      .filter((u) => {
        if (args.role && args.role !== "all" && !u.roles.includes(args.role as RoleValue)) return false;
        if (!term) return true;
        return `${u.name} ${u.email ?? ""} ${u.username ?? ""}`.toLowerCase().includes(term);
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const pageSize = args.pageSize ?? 12;
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const page = Math.min(Math.max(1, args.page ?? 1), pageCount);
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize).map(withId),
      total: filtered.length,
      page,
      pageSize,
      pageCount,
      counts: {
        all: all.length,
        staff: all.filter((u) => u.roles.some((r) => r === "teacher" || PRIVILEGED.includes(r))).length,
        parents: all.filter((u) => u.roles.includes("parent")).length,
        pupils: all.filter((u) => u.roles.includes("pupil")).length,
        withoutLogin: all.filter((u) => !u.clerkUserId).length,
      },
    };
  },
});

/** Accounts linked to a profile, so profile pages can show "has login" state. */
export const forProfile = query({
  args: {
    studentId: v.optional(v.id("students")),
    teacherId: v.optional(v.id("teachers")),
    parentId: v.optional(v.id("parents")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let user: Doc<"users"> | null = null;
    if (args.studentId) {
      user = await ctx.db.query("users").withIndex("by_student", (q) => q.eq("studentId", args.studentId)).first();
    } else if (args.teacherId) {
      user = await ctx.db.query("users").withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId)).first();
    } else if (args.parentId) {
      user = await ctx.db.query("users").withIndex("by_parent", (q) => q.eq("parentId", args.parentId)).first();
    }
    return user ? withId(user) : null;
  },
});

/* ------------------------------- provisioning ----------------------------- */

function assertCanGrant(viewer: Viewer, roles: RoleValue[]) {
  if (roles.some((r) => PRIVILEGED.includes(r)) && !isSuperAdmin(viewer)) {
    fail("FORBIDDEN", "Only a super administrator can create or change administrator accounts.");
  }
}

function assertCanManage(viewer: Viewer, target: Doc<"users">) {
  if (target.roles.some((r) => PRIVILEGED.includes(r)) && !isSuperAdmin(viewer)) {
    fail("FORBIDDEN", "Only a super administrator can manage administrator accounts.");
  }
}

async function assertUsernameFree(ctx: MutationCtx, username: string, except?: Id<"users">) {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", username))
    .first();
  if (existing && existing._id !== except) fail("CONFLICT", `The username "${username}" is already taken.`);
}

/** Everyone signs in with their email address, so no two accounts may share one. */
async function assertEmailFree(ctx: MutationCtx, email: string, except?: Id<"users">) {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();
  if (existing && existing._id !== except) fail("CONFLICT", `The email "${email}" is already used by ${existing.name}.`);
}

/**
 * Step 1 of creating a sign-in: validate, reserve the username and create (or
 * update) the account row. Step 2 — creating the Clerk user — happens on the
 * Next.js server, which then calls `linkClerkUser`.
 */
export const prepareAccount = mutation({
  args: {
    userId: v.optional(v.id("users")),
    name: v.string(),
    username: v.string(),
    email: v.string(),
    roles: v.array(role),
    studentId: v.optional(v.id("students")),
    teacherId: v.optional(v.id("teachers")),
    parentId: v.optional(v.id("parents")),
  },
  handler: async (ctx, args) => {
    const viewer = await requireAdmin(ctx);
    const username = args.username.trim().toLowerCase();
    if (!USERNAME.test(username)) {
      fail("INVALID", "Usernames use 4–32 lowercase letters, numbers or underscores.");
    }
    if (args.roles.length === 0) fail("INVALID", "Choose at least one role.");
    assertCanGrant(viewer, args.roles);
    if (args.roles.includes("pupil") && !args.studentId) fail("INVALID", "A pupil account must be linked to a pupil.");
    if (args.roles.includes("parent") && !args.parentId) fail("INVALID", "A parent account must be linked to a parent.");
    if (args.roles.includes("teacher") && !args.teacherId) fail("INVALID", "A teacher account must be linked to a teacher.");

    const email = args.email.trim().toLowerCase();
    if (!EMAIL.test(email)) fail("INVALID", "Enter a valid email address to sign in with.");

    // One account per profile.
    const linkedRows = await Promise.all([
      args.studentId
        ? ctx.db.query("users").withIndex("by_student", (q) => q.eq("studentId", args.studentId)).first()
        : null,
      args.teacherId
        ? ctx.db.query("users").withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId)).first()
        : null,
      args.parentId
        ? ctx.db.query("users").withIndex("by_parent", (q) => q.eq("parentId", args.parentId)).first()
        : null,
    ]);
    for (const linked of linkedRows) {
      if (linked && linked._id !== args.userId) {
        if (linked.clerkUserId) fail("CONFLICT", `${linked.name} already has a sign-in (${linked.username}).`);
        // An unlinked placeholder for the same profile: reuse it.
        args.userId = linked._id;
      }
    }

    if (args.userId) {
      const existing = await ctx.db.get(args.userId);
      if (!existing) fail("NOT_FOUND", "That account no longer exists.");
      assertCanManage(viewer, existing);
      if (existing.clerkUserId) fail("CONFLICT", `${existing.name} already has a sign-in.`);
      await assertUsernameFree(ctx, username, existing._id);
      await assertEmailFree(ctx, email, existing._id);
      await ctx.db.patch(existing._id, {
        name: args.name.trim(),
        username,
        email,
        roles: args.roles,
        studentId: args.studentId,
        teacherId: args.teacherId,
        parentId: args.parentId,
        active: true,
      });
      return { userId: existing._id, created: false };
    }

    await assertUsernameFree(ctx, username);
    await assertEmailFree(ctx, email);
    const userId = await ctx.db.insert("users", {
      name: args.name.trim(),
      username,
      email,
      roles: args.roles,
      active: true,
      avatarSeed: args.name.trim(),
      studentId: args.studentId,
      teacherId: args.teacherId,
      parentId: args.parentId,
      createdAt: nowISO(),
    });
    return { userId, created: true };
  },
});

/** Step 3: remember which Clerk user signs in as this account. */
export const linkClerkUser = mutation({
  args: { userId: v.id("users"), clerkUserId: v.string() },
  handler: async (ctx, { userId, clerkUserId }) => {
    const viewer = await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    if (!user) fail("NOT_FOUND", "That account no longer exists.");
    assertCanManage(viewer, user);
    const clash = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", clerkUserId))
      .first();
    if (clash && clash._id !== userId) fail("CONFLICT", "That Clerk user is already linked to another account.");
    await ctx.db.patch(userId, { clerkUserId });
    await audit(ctx, viewer, {
      action: "Created sign-in",
      entity: "User",
      entityId: userId,
      newValue: `${user.username} (${user.roles.join(", ")})`,
    });
  },
});

/** Undo step 1 when creating the Clerk user failed. */
export const discardPreparedAccount = mutation({
  args: { userId: v.id("users"), created: v.boolean() },
  handler: async (ctx, { userId, created }) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    if (!user || user.clerkUserId) return;
    if (created) await ctx.db.delete(userId);
  },
});

/** Details the server needs before changing a sign-in in Clerk. */
export const managedAccount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const viewer = await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    if (!user) fail("NOT_FOUND", "That account no longer exists.");
    assertCanManage(viewer, user);
    return { id: user._id, name: user.name, username: user.username, clerkUserId: user.clerkUserId };
  },
});

export const setActive = mutation({
  args: { userId: v.id("users"), active: v.boolean() },
  handler: async (ctx, { userId, active }) => {
    const viewer = await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    if (!user) fail("NOT_FOUND", "That account no longer exists.");
    assertCanManage(viewer, user);
    if (user._id === viewer._id) fail("INVALID", "You cannot disable your own account.");
    await ctx.db.patch(userId, { active });
    await audit(ctx, viewer, {
      action: active ? "Enabled account" : "Disabled account",
      entity: "User",
      entityId: userId,
      previousValue: user.active ? "active" : "disabled",
      newValue: active ? "active" : "disabled",
    });
    return { clerkUserId: user.clerkUserId };
  },
});

export const updateRoles = mutation({
  args: { userId: v.id("users"), roles: v.array(role) },
  handler: async (ctx, { userId, roles }) => {
    const viewer = await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    if (!user) fail("NOT_FOUND", "That account no longer exists.");
    assertCanManage(viewer, user);
    assertCanGrant(viewer, roles);
    if (roles.length === 0) fail("INVALID", "Choose at least one role.");
    if (user._id === viewer._id && !roles.includes("super_admin") && isSuperAdmin(viewer)) {
      fail("INVALID", "You cannot remove your own super administrator role.");
    }
    if (roles.includes("teacher") && !user.teacherId) fail("INVALID", "Link this account to a teacher first.");
    if (roles.includes("parent") && !user.parentId) fail("INVALID", "Link this account to a parent first.");
    if (roles.includes("pupil") && !user.studentId) fail("INVALID", "Link this account to a pupil first.");
    await ctx.db.patch(userId, { roles });
    await audit(ctx, viewer, {
      action: "Changed roles",
      entity: "User",
      entityId: userId,
      previousValue: user.roles.join(", "),
      newValue: roles.join(", "),
    });
  },
});

export const recordPasswordReset = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const viewer = await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    if (!user) fail("NOT_FOUND", "That account no longer exists.");
    assertCanManage(viewer, user);
    await audit(ctx, viewer, { action: "Reset password", entity: "User", entityId: userId, newValue: user.username });
  },
});

/**
 * Email a new account holder a link to set their own password. Pupil-only
 * accounts never get email, so the school sets their password instead.
 */
export const sendInvite = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const viewer = await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    if (!user) fail("NOT_FOUND", "That account no longer exists.");
    assertCanManage(viewer, user);
    if (!user.clerkUserId) fail("INVALID", "This account has no sign-in yet.");
    const to = await emailFor(ctx, user);
    if (!to) fail("INVALID", "This account has no email address the school can write to.");
    if (!emailConfigured()) return { sent: false, to };
    await enqueueEmail(ctx, user, to, {
      title: "Your school portal account is ready",
      body: `Hello ${user.name}, the school has created your portal account. Open the link, enter ${to} and we'll email you a code to set your own password. You can then sign in at any time.`,
      href: `/login?setup=1&email=${encodeURIComponent(to)}`,
      cta: "Set your password",
    });
    await audit(ctx, viewer, { action: "Sent sign-in invite", entity: "User", entityId: userId, newValue: to });
    return { sent: true, to };
  },
});

export const touchLastLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireViewer(ctx);
    const last = user.lastLoginAt ? Date.parse(user.lastLoginAt) : 0;
    // At most once an hour, so page loads don't churn the document.
    if (Date.now() - last > 60 * 60 * 1000) await ctx.db.patch(user._id, { lastLoginAt: nowISO() });
  },
});

/* -------------------------------- bootstrap ------------------------------- */

/**
 * Make the first super administrator. Create the person in the Clerk dashboard
 * (with a username), copy their user id, then run:
 *
 *   npx convex run users:bootstrapSuperAdmin '{"clerkUserId":"user_…","name":"Your Name","username":"your_name"}'
 *
 * Refuses once any super administrator can sign in.
 */
export const bootstrapSuperAdmin = internalMutation({
  args: { clerkUserId: v.string(), name: v.string(), username: v.string(), email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = (await ctx.db.query("users").collect()).find(
      (u) => u.roles.includes("super_admin") && u.clerkUserId && u.active,
    );
    if (existing) throw new Error(`A super administrator already exists (${existing.username ?? existing.name}).`);
    const username = args.username.trim().toLowerCase();
    if (!USERNAME.test(username)) throw new Error("Usernames use 4–32 lowercase letters, numbers or underscores.");

    const byClerk = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    const byUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    const target = byClerk ?? byUsername;
    if (target) {
      await ctx.db.patch(target._id, {
        clerkUserId: args.clerkUserId,
        username,
        name: args.name,
        email: args.email ?? target.email,
        roles: Array.from(new Set<RoleValue>([...target.roles, "super_admin"])),
        active: true,
      });
      return target._id;
    }
    return await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      username,
      name: args.name,
      email: args.email,
      roles: ["super_admin"],
      active: true,
      avatarSeed: args.name,
      createdAt: nowISO(),
    });
  },
});
