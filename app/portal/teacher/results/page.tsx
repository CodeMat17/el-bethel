import Link from "next/link";
import type { Metadata } from "next";

import { EmptyState } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { PublishResults } from "@/components/portal/publish-results";
import { ResultsEntry, type ResultRow } from "@/components/portal/results-entry";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isAdmin, requireTeacher } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { param, studentName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Results" };

export default async function TeacherResultsPage({ searchParams }: PageProps<"/portal/teacher/results">) {
  const user = await requireTeacher();
  const params = await searchParams;
  const dir = await getDirectory();

  const classes = isAdmin(user) ? dir.classes : dir.classesForTeacher(user.teacherId);
  if (classes.length === 0) {
    return <EmptyState icon="School" title="No classes assigned" description="Contact the school administrator." />;
  }

  // Never trust the query string: only classes this teacher teaches are selectable.
  const cls = classes.find((c) => c.id === param(params.class)) ?? classes[0];
  const isClassTeacher = cls.classTeacherId === user.teacherId;
  const view = param(params.view) === "publish" && (isClassTeacher || isAdmin(user)) ? "publish" : "scores";

  const subjects = isAdmin(user) ? dir.subjectsForClass(cls.id) : dir.subjectsForTeacherInClass(user.teacherId, cls.id);
  const subject = subjects.find((s) => s.id === param(params.subject)) ?? subjects[0];
  const terms = [...dir.terms].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const term = terms.find((t) => t.id === param(params.term)) ?? dir.activeTerm ?? terms[0];

  if (!term) {
    return <EmptyState icon="Trophy" title="No terms set up" description="Ask an administrator to add the school terms." />;
  }

  const buildHref = (next: Partial<{ class: string; subject: string; term: string; view: string }>) =>
    `/portal/teacher/results?class=${next.class ?? cls.id}&subject=${next.subject ?? subject?.id ?? ""}&term=${next.term ?? term.id}&view=${next.view ?? view}`;

  const Picker = ({ label, items, current, make }: { label: string; items: { id: string; name: string }[]; current?: string; make: (id: string) => string }) => (
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((option) => (
          <Button
            key={option.id}
            variant={option.id === current ? "default" : "outline"}
            size="sm"
            className={cn("font-bold", option.id === current && "pointer-events-none")}
            render={<Link href={make(option.id)} />}
          >
            {option.name}
          </Button>
        ))}
      </div>
    </div>
  );

  let body: React.ReactNode;
  if (view === "publish") {
    const summary = await query(api.results.classSummary, { classId: cls.id as Id<"classes">, termId: term.id as Id<"terms"> });
    body = (
      <PublishResults
        key={cls.id + term.id}
        classId={cls.id}
        termId={term.id}
        className={cls.name}
        termName={term.name}
        totalSubjects={summary.subjects.filter((s) => s.entered).length || summary.subjects.length}
        published={summary.published}
        canPublish={summary.canPublish}
        canUnpublish={isAdmin(user)}
        rows={summary.rows.map((r) => ({
          studentId: r.student.id,
          name: studentName(r.student),
          studentNo: r.student.studentNo,
          subjects: r.subjects,
          average: r.average,
          position: r.position,
          teacherComment: r.teacherComment,
        }))}
      />
    );
  } else if (!subject) {
    body = <EmptyState icon="Trophy" title="No subjects to enter" description="You are not assigned a subject in this class." />;
  } else {
    const sheet = await query(api.results.subjectSheet, {
      classId: cls.id as Id<"classes">,
      subjectId: subject.id as Id<"subjects">,
      termId: term.id as Id<"terms">,
    });
    const rows: ResultRow[] = sheet.rows.map(({ student, result }) => ({
      id: student.id,
      name: studentName(student),
      studentNo: student.studentNo,
      ca: result ? String(result.ca) : "",
      exam: result ? String(result.exam) : "",
    }));
    body = (
      <ResultsEntry
        key={cls.id + ":" + subject.id + ":" + term.id}
        classId={cls.id}
        subjectId={subject.id}
        termId={term.id}
        className={cls.name}
        subjectName={subject.name}
        termName={term.name}
        rows={rows}
        caMax={sheet.caMax}
        locked={sheet.locked}
      />
    );
  }

  return (
    <>
      <PortalPageHeader
        title="Exam results"
        description="Enter CA and exam scores for your subjects. Class teachers then review the term summary and publish it to pupils and parents."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={view === "scores" ? "default" : "outline"} className="font-bold" render={<Link href={buildHref({ view: "scores" })} />}>
          Enter subject scores
        </Button>
        {isClassTeacher || isAdmin(user) ? (
          <Button variant={view === "publish" ? "default" : "outline"} className="font-bold" render={<Link href={buildHref({ view: "publish" })} />}>
            Review &amp; publish class results
          </Button>
        ) : null}
      </div>

      <Card className="mb-6 gap-0 p-4">
        <div className="space-y-4">
          <Picker label="Class" items={classes} current={cls.id} make={(id) => buildHref({ class: id, subject: "" })} />
          {view === "scores" ? <Picker label="Subject" items={subjects} current={subject?.id} make={(id) => buildHref({ subject: id })} /> : null}
          <Picker label="Term" items={terms} current={term.id} make={(id) => buildHref({ term: id })} />
        </div>
      </Card>

      {body}
    </>
  );
}
