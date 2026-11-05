import Link from "next/link";

import { EmptyState } from "@/components/common";
import { MidtermEntry } from "@/components/portal/midterm-entry";
import { PortalPageHeader } from "@/components/portal/page-header";
import { PublishMidterm } from "@/components/portal/publish-midterm";
import { PublishResults } from "@/components/portal/publish-results";
import { ResultsEntry, type ResultRow } from "@/components/portal/results-entry";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { query } from "@/lib/school/convex";
import { param, studentName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import type { SessionUser } from "@/lib/school/types";
import { cn } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

function Picker({ label, items, current, make }: { label: string; items: { id: string; name: string }[]; current?: string; make: (id: string) => string }) {
  return (
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
}

/**
 * The results screen, shared by two portals:
 *  - "teacher": the signed-in teacher's own classes and subjects. Subject
 *    teachers enter scores; the class teacher publishes.
 *  - "admin": every class and subject, read-only. Administrators (the super
 *    admin included) can look but not change scores or publish; they may only
 *    withdraw published results so the teacher can correct them.
 * Convex enforces the same rules, so this only decides what to show.
 */
export async function ResultsWorkspace({ user, mode, searchParams }: { user: SessionUser; mode: "teacher" | "admin"; searchParams: SearchParams }) {
  const dir = await getDirectory();
  const admin = mode === "admin";
  const basePath = admin ? "/portal/admin/results/view" : "/portal/teacher/results";

  const classes = admin ? dir.classes : dir.classesForTeacher(user.teacherId);
  if (classes.length === 0) {
    return <EmptyState icon="School" title="No classes assigned" description="Contact the school administrator." />;
  }

  // Never trust the query string: only classes on the list are selectable.
  const cls = classes.find((c) => c.id === param(searchParams.class)) ?? classes[0];
  const isClassTeacher = Boolean(user.teacherId) && cls.classTeacherId === user.teacherId;
  const canSeeSummary = admin || isClassTeacher;
  const view = param(searchParams.view) === "publish" && canSeeSummary ? "publish" : "scores";
  const assessment = param(searchParams.assessment) === "midterm" ? "midterm" : "exam";

  const subjects = admin ? dir.subjectsForClass(cls.id) : dir.subjectsForTeacherInClass(user.teacherId, cls.id);
  const subject = subjects.find((s) => s.id === param(searchParams.subject)) ?? subjects[0];
  const terms = [...dir.terms].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const term = terms.find((t) => t.id === param(searchParams.term)) ?? dir.activeTerm ?? terms[0];

  if (!term) {
    return <EmptyState icon="Trophy" title="No terms set up" description="Ask an administrator to add the school terms." />;
  }

  const buildHref = (next: Partial<{ class: string; subject: string; term: string; view: string; assessment: string }>) =>
    `${basePath}?assessment=${next.assessment ?? assessment}&class=${next.class ?? cls.id}&subject=${next.subject ?? subject?.id ?? ""}&term=${next.term ?? term.id}&view=${next.view ?? view}`;

  const viewOnlyNote = admin ? "You are viewing these scores. Only the subject teacher can enter or change them." : undefined;

  let body: React.ReactNode;
  if (view === "publish" && assessment === "midterm") {
    const summary = await query(api.midterm.classSummary, { classId: cls.id as Id<"classes">, termId: term.id as Id<"terms"> });
    body = (
      <PublishMidterm
        key={cls.id + term.id}
        classId={cls.id}
        termId={term.id}
        className={cls.name}
        termName={term.name}
        totalSubjects={summary.subjectsEntered || summary.totalSubjects}
        published={summary.published}
        canPublish={summary.canPublish}
        canUnpublish={admin}
        rows={summary.rows.map((r) => ({
          studentId: r.student.id,
          name: studentName(r.student),
          studentNo: r.student.studentNo,
          subjects: r.subjects,
          average: r.average,
          position: r.position,
        }))}
      />
    );
  } else if (view === "publish") {
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
        canUnpublish={admin}
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
    body = (
      <EmptyState
        icon="Trophy"
        title={admin ? "No subjects for this class" : "No subjects to enter"}
        description={admin ? "Add subjects for this class level first." : "You are not assigned a subject in this class."}
      />
    );
  } else if (assessment === "midterm") {
    const sheet = await query(api.midterm.subjectSheet, {
      classId: cls.id as Id<"classes">,
      subjectId: subject.id as Id<"subjects">,
      termId: term.id as Id<"terms">,
    });
    body = (
      <MidtermEntry
        key={cls.id + ":" + subject.id + ":" + term.id}
        classId={cls.id}
        subjectId={subject.id}
        termId={term.id}
        className={cls.name}
        subjectName={subject.name}
        termName={term.name}
        maxScore={sheet.maxScore}
        locked={sheet.locked}
        lockedNote={viewOnlyNote}
        rows={sheet.rows.map(({ student, score }) => ({
          id: student.id,
          name: studentName(student),
          studentNo: student.studentNo,
          score: score ? String(score.score) : "",
        }))}
      />
    );
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
        lockedNote={viewOnlyNote}
      />
    );
  }

  return (
    <>
      <PortalPageHeader
        title="Results"
        description={
          admin
            ? "View any class's mid-term and end-of-term results. Subject teachers enter the scores and the class teacher publishes them; you can withdraw published results so the teacher can correct them."
            : "Enter mid-term test scores and end-of-term CA and exam scores for your subjects. Class teachers then review each summary and publish it to pupils and parents."
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {admin ? (
          <Button variant="ghost" className="font-bold" render={<Link href={`/portal/admin/results?term=${term.id}`} />}>
            ← All classes
          </Button>
        ) : null}
        <Button variant={view === "scores" ? "default" : "outline"} className="font-bold" render={<Link href={buildHref({ view: "scores" })} />}>
          {admin ? "Subject scores" : "Enter subject scores"}
        </Button>
        {canSeeSummary ? (
          <Button variant={view === "publish" ? "default" : "outline"} className="font-bold" render={<Link href={buildHref({ view: "publish" })} />}>
            {admin ? "Class summary" : `Review & publish class ${assessment === "midterm" ? "mid-term " : ""}results`}
          </Button>
        ) : null}
      </div>

      <Card className="mb-6 gap-0 p-4">
        <div className="space-y-4">
          <Picker
            label="Assessment"
            items={[
              { id: "midterm", name: "Mid-term test" },
              { id: "exam", name: "End of term" },
            ]}
            current={assessment}
            make={(id) => buildHref({ assessment: id })}
          />
          <Picker label="Class" items={classes} current={cls.id} make={(id) => buildHref({ class: id, subject: "" })} />
          {view === "scores" ? <Picker label="Subject" items={subjects} current={subject?.id} make={(id) => buildHref({ subject: id })} /> : null}
          <Picker label="Term" items={terms} current={term.id} make={(id) => buildHref({ term: id })} />
        </div>
      </Card>

      {body}
    </>
  );
}
