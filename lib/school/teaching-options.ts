import "server-only";

import { api } from "@/convex/_generated/api";
import type { TeachingOption } from "@/components/portal/assignment-form";
import { query } from "./convex";
import type { Directory } from "./directory";

/** Classes and subjects the signed-in teacher may set work in, grouped by class. */
export async function teachingOptions(dir: Directory): Promise<TeachingOption[]> {
  const pairs = await query(api.assignments.teachingOptions, {});
  const byClass = new Map<string, TeachingOption>();
  for (const { classId, subjectId } of pairs) {
    const cls = dir.getClass(classId);
    const subject = dir.getSubject(subjectId);
    if (!cls || !subject) continue;
    const entry = byClass.get(classId) ?? { classId, className: cls.name, subjects: [] };
    entry.subjects.push({ id: subject.id, name: subject.name });
    byClass.set(classId, entry);
  }
  const order = new Map(dir.classes.map((c, i) => [c.id, i] as const));
  return [...byClass.values()]
    .map((o) => ({ ...o, subjects: o.subjects.sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => (order.get(a.classId) ?? 0) - (order.get(b.classId) ?? 0));
}
