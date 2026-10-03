import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { compact, withId } from "./util";

type Ctx = QueryCtx | MutationCtx;

/**
 * Domain mappers for the documents whose app shape includes derived links.
 * Everything else is converted with plain `withId`.
 */

export async function toStudent(ctx: Ctx, doc: Doc<"students">) {
  const links = await ctx.db
    .query("guardianships")
    .withIndex("by_student", (q) => q.eq("studentId", doc._id))
    .collect();
  return { ...withId(doc), parentIds: links.map((l) => l.parentId) };
}

export async function toStudents(ctx: Ctx, docs: Doc<"students">[]) {
  return Promise.all(docs.map((d) => toStudent(ctx, d)));
}

export async function toParent(ctx: Ctx, doc: Doc<"parents">) {
  const links = await ctx.db
    .query("guardianships")
    .withIndex("by_parent", (q) => q.eq("parentId", doc._id))
    .collect();
  return { ...withId(doc), studentIds: links.map((l) => l.studentId) };
}

/**
 * Build teacher shapes from preloaded rows, so listing every teacher costs two
 * table reads instead of two reads per teacher.
 */
export function teacherShapes(
  teachers: Doc<"teachers">[],
  teaching: Doc<"teachingAssignments">[],
  classes: Doc<"classes">[],
) {
  return teachers.map((t) => {
    const rows = teaching.filter((r) => r.teacherId === t._id);
    const classTeacherOf = classes.filter((c) => c.classTeacherId === t._id).map((c) => c._id);
    return {
      ...withId(t),
      subjectIds: [...new Set(rows.map((r) => r.subjectId))],
      classIds: [...new Set<Id<"classes">>([...rows.map((r) => r.classId), ...classTeacherOf])],
      isClassTeacher: classTeacherOf.length > 0,
    };
  });
}

export async function toTeacher(ctx: Ctx, doc: Doc<"teachers">) {
  const [teaching, classTeacherOf] = await Promise.all([
    ctx.db
      .query("teachingAssignments")
      .withIndex("by_teacher", (q) => q.eq("teacherId", doc._id))
      .collect(),
    ctx.db
      .query("classes")
      .withIndex("by_class_teacher", (q) => q.eq("classTeacherId", doc._id))
      .collect(),
  ]);
  return teacherShapes([doc], teaching, classTeacherOf)[0];
}

export async function getStudentsByIds(ctx: Ctx, ids: Id<"students">[]) {
  return compact(await Promise.all(ids.map((id) => ctx.db.get(id))));
}
