import { query } from "./_generated/server";
import { teacherShapes } from "./lib/mappers";
import { withId } from "./lib/util";

/**
 * The school's reference data — classes, subjects, staff names, sessions and
 * terms. None of it is private, so it is readable without signing in (the public
 * website lists teachers and subjects too). Staff phone numbers are left out.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const [classes, subjects, teachers, teaching, terms, sessions] = await Promise.all([
      ctx.db.query("classes").collect(),
      ctx.db.query("subjects").collect(),
      ctx.db.query("teachers").collect(),
      ctx.db.query("teachingAssignments").collect(),
      ctx.db.query("terms").collect(),
      ctx.db.query("academicSessions").collect(),
    ]);
    const activeTerm = terms.find((t) => t.active) ?? null;
    return {
      classes: classes.map(withId),
      subjects: subjects.map(withId),
      teachers: teacherShapes(teachers, teaching, classes).map((t) => ({ ...t, phone: "" })),
      teaching: teaching.map(withId),
      terms: terms.map(withId).sort((a, b) => a.startDate.localeCompare(b.startDate)),
      sessions: sessions.map(withId).sort((a, b) => a.startDate.localeCompare(b.startDate)),
      activeTermId: activeTerm?._id ?? null,
    };
  },
});
