import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import {
  assertStudentAccess,
  fail,
  isAdmin,
  parentStudentIds,
  requireViewer,
  teacherClassIds,
  type Viewer,
} from "./lib/access";
import { getByLooseId, notify, nowISO, withId } from "./lib/util";

async function assemble(ctx: QueryCtx, thread: Doc<"messageThreads">) {
  const messages = await ctx.db
    .query("threadMessages")
    .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
    .collect();
  const student = thread.studentId ? await ctx.db.get(thread.studentId) : null;
  return {
    ...withId(thread),
    studentName: student ? `${student.firstName} ${student.lastName}` : null,
    messages: messages.map(withId),
  };
}

async function names(ctx: QueryCtx, ids: Id<"users">[]) {
  const out: Record<string, string> = {};
  for (const id of new Set(ids)) {
    const u = await ctx.db.get(id);
    out[id] = u?.name ?? "School Staff";
  }
  return out;
}

export const myThreads = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const links = await ctx.db
      .query("threadParticipants")
      .withIndex("by_user", (q) => q.eq("userId", viewer._id))
      .collect();
    const threads = (await Promise.all(links.map((l) => ctx.db.get(l.threadId)))).filter(
      (t): t is Doc<"messageThreads"> => t !== null,
    );
    const full = await Promise.all(threads.map((t) => assemble(ctx, t)));
    full.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return { threads: full, names: await names(ctx, full.flatMap((t) => t.participantIds)) };
  },
});

export const getThread = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const thread = await getByLooseId(ctx, "messageThreads", id);
    if (!thread) return null;
    // Only participants may read a conversation.
    if (!thread.participantIds.includes(viewer._id)) fail("FORBIDDEN", "You are not part of this conversation.");
    const full = await assemble(ctx, thread);
    return { thread: full, names: await names(ctx, [...full.participantIds, ...full.messages.map((m) => m.senderId)]), me: viewer._id };
  },
});

export const send = mutation({
  args: { threadId: v.id("messageThreads"), body: v.string() },
  handler: async (ctx, { threadId, body }) => {
    const viewer = await requireViewer(ctx);
    const text = body.trim();
    if (!text) fail("INVALID", "Write a message before sending.");
    if (text.length > 4000) fail("INVALID", "Message is too long.");
    const thread = await ctx.db.get(threadId);
    if (!thread) fail("NOT_FOUND", "We couldn't find that conversation.");
    if (!thread.participantIds.includes(viewer._id)) fail("FORBIDDEN", "You are not part of this conversation.");
    const now = nowISO();
    await ctx.db.insert("threadMessages", { threadId, senderId: viewer._id, body: text, sentAt: now, readBy: [viewer._id] });
    await ctx.db.patch(threadId, { updatedAt: now });
    for (const pid of thread.participantIds) {
      if (pid === viewer._id) continue;
      const user = await ctx.db.get(pid);
      const href = user?.teacherId ? `/portal/teacher/messages/${threadId}` : `/portal/parent/messages/${threadId}`;
      await notify(ctx, pid, { type: "message", title: `New message from ${viewer.name}`, body: text.slice(0, 120), href });
    }
  },
});

export const markRead = mutation({
  args: { threadId: v.id("messageThreads") },
  handler: async (ctx, { threadId }) => {
    const viewer = await requireViewer(ctx);
    const thread = await ctx.db.get(threadId);
    if (!thread || !thread.participantIds.includes(viewer._id)) return;
    const messages = await ctx.db
      .query("threadMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
    for (const m of messages) {
      if (!m.readBy.includes(viewer._id)) await ctx.db.patch(m._id, { readBy: [...m.readBy, viewer._id] });
    }
  },
});

/** People the viewer may start a conversation with. */
export const contacts = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    return await contactsFor(ctx, viewer);
  },
});

async function contactsFor(ctx: QueryCtx, viewer: Viewer) {
  const out: { userId: Id<"users">; name: string; label: string; studentId?: Id<"students"> }[] = [];
  if (viewer.parentId) {
    // Parents may message their children's teachers and the school office.
    for (const sid of await parentStudentIds(ctx, viewer.parentId)) {
      const child = await ctx.db.get(sid);
      if (!child) continue;
      const cls = await ctx.db.get(child.classId);
      const teaching = await ctx.db
        .query("teachingAssignments")
        .withIndex("by_class", (q) => q.eq("classId", child.classId))
        .collect();
      const teacherIds = new Set<Id<"teachers">>([...teaching.map((t) => t.teacherId), ...(cls?.classTeacherId ? [cls.classTeacherId] : [])]);
      for (const tid of teacherIds) {
        const user = await ctx.db.query("users").withIndex("by_teacher", (q) => q.eq("teacherId", tid)).first();
        if (user?.active && user.clerkUserId && !out.some((o) => o.userId === user._id)) {
          out.push({ userId: user._id, name: user.name, label: tid === cls?.classTeacherId ? `${child.firstName}'s class teacher` : `Teaches ${child.firstName}`, studentId: child._id });
        }
      }
    }
    const admins = (await ctx.db.query("users").collect()).filter((u) => u.active && u.clerkUserId && u.roles.includes("admin") && !u.teacherId);
    for (const a of admins.slice(0, 3)) out.push({ userId: a._id, name: a.name, label: "School office" });
  } else if (viewer.teacherId || isAdmin(viewer)) {
    // Staff may message parents of pupils they teach (admins: any parent with an account).
    const parents = (await ctx.db.query("users").collect()).filter((u) => u.active && u.clerkUserId && u.parentId);
    const allowed = isAdmin(viewer) ? null : viewer.teacherId ? await teacherClassIds(ctx, viewer.teacherId) : new Set();
    for (const p of parents) {
      const kids = await parentStudentIds(ctx, p.parentId!);
      for (const sid of kids) {
        const child = await ctx.db.get(sid);
        if (!child) continue;
        if (allowed && !allowed.has(child.classId)) continue;
        out.push({ userId: p._id, name: p.name, label: `Parent of ${child.firstName} ${child.lastName}`, studentId: child._id });
        break;
      }
    }
  }
  return out;
}

export const startThread = mutation({
  args: { toUserId: v.id("users"), subject: v.string(), body: v.string(), studentId: v.optional(v.id("students")) },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const subject = args.subject.trim();
    const body = args.body.trim();
    if (!subject) fail("INVALID", "Add a subject.");
    if (!body) fail("INVALID", "Write a message.");
    const allowed = await contactsFor(ctx, viewer);
    if (!allowed.some((c) => c.userId === args.toUserId)) fail("FORBIDDEN", "You can't message this person.");
    if (args.studentId) await assertStudentAccess(ctx, viewer, args.studentId);
    const now = nowISO();
    const threadId = await ctx.db.insert("messageThreads", {
      subject,
      participantIds: [viewer._id, args.toUserId],
      studentId: args.studentId,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("threadParticipants", { threadId, userId: viewer._id });
    await ctx.db.insert("threadParticipants", { threadId, userId: args.toUserId });
    await ctx.db.insert("threadMessages", { threadId, senderId: viewer._id, body, sentAt: now, readBy: [viewer._id] });
    const to = await ctx.db.get(args.toUserId);
    await notify(ctx, args.toUserId, {
      type: "message",
      title: `New message from ${viewer.name}`,
      body: subject,
      href: to?.teacherId ? `/portal/teacher/messages/${threadId}` : `/portal/parent/messages/${threadId}`,
    });
    return threadId;
  },
});
