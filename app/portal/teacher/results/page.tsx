import Link from "next/link";
import type { Metadata } from "next";

import { EmptyState } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { ResultsEntry, type ResultRow } from "@/components/portal/results-entry";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireTeacher } from "@/lib/school/auth";
import {
  classesForTeacher,
  getLevel,
  getResultsForStudent,
  getStudentsByClass,
  getSubjects,
  subjectsForTeacher,
  studentName,
} from "@/lib/school/data";
import { getDb } from "@/lib/school/store";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Results" };

export default async function TeacherResultsPage({ searchParams }: PageProps<"/portal/teacher/results">) {
  const user = await requireTeacher();
  const params = await searchParams;

  if (!user.teacherId) {
    return <EmptyState icon="GraduationCap" title="No teaching record" description="Contact the school administrator." />;
  }

  const classes = classesForTeacher(user.teacherId);
  if (classes.length === 0) {
    return <EmptyState icon="School" title="No classes assigned" description="Contact the school administrator." />;
  }

  const cls = classes.find((c) => c.id === (typeof params.class === "string" ? params.class : "")) ?? classes[0];
  const level = getLevel(cls.levelId);
  // Only subjects this teacher is assigned, and that the class actually studies.
  const mySubjectIds = new Set(subjectsForTeacher(user.teacherId).map((s) => s.id));
  const levelSubjects = getSubjects().filter((s) => level && s.levelIds.includes(level.id));
  const taughtSubjects = levelSubjects.filter((s) => mySubjectIds.has(s.id));
  const availableSubjects = taughtSubjects.length > 0 ? taughtSubjects : levelSubjects;
  const subject =
    availableSubjects.find((s) => s.id === (typeof params.subject === "string" ? params.subject : "")) ??
    availableSubjects[0];

  const db = getDb();
  const terms = db.terms.filter((t) => t.sessionId === "ses-2026");
  const term = terms.find((t) => t.id === (typeof params.term === "string" ? params.term : "")) ?? terms[0];

  if (!subject || !term) {
    return <EmptyState icon="Trophy" title="Nothing to enter" description="No subjects or terms are configured for this class." />;
  }

  const roster = getStudentsByClass(cls.id);
  const rows: ResultRow[] = roster.map((student) => {
    const existing = getResultsForStudent(student.id, term.id).find((r) => r.subjectId === subject.id);
    return {
      id: student.id,
      name: studentName(student),
      studentNo: student.studentNo,
      classwork: existing?.scores.classwork ?? 0,
      assignment: existing?.scores.assignment ?? 0,
      test: existing?.scores.test ?? 0,
      exam: existing?.scores.exam ?? 0,
    };
  });

  const buildHref = (next: Partial<{ class: string; subject: string; term: string }>) =>
    `/portal/teacher/results?class=${next.class ?? cls.id}&subject=${next.subject ?? subject.id}&term=${next.term ?? term.id}`;

  return (
    <>
      <PortalPageHeader
        title="Enter results"
        description="Record continuous assessment and examination scores. Totals and grades are calculated on save."
      />

      <Card className="mb-6 gap-0 p-4">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Class</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {classes.map((option) => (
                <Button
                  key={option.id}
                  variant={option.id === cls.id ? "default" : "outline"}
                  size="sm"
                  className={cn("font-bold", option.id === cls.id && "pointer-events-none")}
                  render={<Link href={buildHref({ class: option.id })} />}
                >
                  {option.name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Subject</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableSubjects.map((option) => (
                <Button
                  key={option.id}
                  variant={option.id === subject.id ? "default" : "outline"}
                  size="sm"
                  className={cn("font-bold", option.id === subject.id && "pointer-events-none")}
                  render={<Link href={buildHref({ subject: option.id })} />}
                >
                  {option.name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Term</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {terms.map((option) => (
                <Button
                  key={option.id}
                  variant={option.id === term.id ? "default" : "outline"}
                  size="sm"
                  className={cn("font-bold", option.id === term.id && "pointer-events-none")}
                  render={<Link href={buildHref({ term: option.id })} />}
                >
                  {option.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* key remounts the grid when the selection changes, so its local state reseeds. */}
      <ResultsEntry
        key={cls.id + ":" + subject.id + ":" + term.id}
        classId={cls.id}
        subjectId={subject.id}
        termId={term.id}
        className={cls.name}
        subjectName={subject.name}
        termName={term.name}
        rows={rows}
      />
    </>
  );
}
