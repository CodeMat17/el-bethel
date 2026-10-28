import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import { Icon } from "@/components/icon";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { requirePupil } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";

export const metadata: Metadata = { title: "My subjects" };

const SUBJECT_ICON: Record<string, string> = {
  ENG: "BookOpen",
  MTH: "ChartColumn",
  BSC: "FlaskConical",
  SST: "Users",
  CIV: "ShieldCheck",
  CMP: "Cpu",
  QNR: "Percent",
  VBR: "MessageCircle",
  FRE: "Landmark",
  CRS: "Heart",
  IRS: "Heart",
  ART: "Palette",
  MUS: "Activity",
  PHE: "Goal",
  HEC: "UtensilsCrossed",
  AGR: "Sprout",
  LIT: "BookMarked",
  NUM: "Layers",
};

export default async function PupilSubjectsPage() {
  const user = await requirePupil();
  const student = user.studentId ? await query(api.people.myStudent, {}) : null;
  if (!student) {
    return <EmptyState icon="Backpack" title="No school record" description="Please ask your class teacher." />;
  }

  const [assignments, timetable, dir] = await Promise.all([
    query(api.assignments.forStudent, { studentId: student.id }),
    query(api.timetable.forClass, { classId: student.classId }),
    getDirectory(),
  ]);
  const subjects = dir.subjectsForClass(student.classId);

  return (
    <>
      <PortalPageHeader
        eyebrow={dir.className(student.classId)}
        title="My subjects"
        description={`The ${subjects.length} subjects you study, and who teaches each one.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => {
          const teacherId = dir.teacherFor(student.classId, subject.id)?.id ?? timetable.find((s) => s.subjectId === subject.id)?.teacherId;
          const subjectAssignments = assignments.filter((a) => a.assignment.subjectId === subject.id);
          const todo = subjectAssignments.filter((a) => a.progress === "not_started").length;
          const lessonsPerWeek = timetable.filter((s) => s.subjectId === subject.id).length;

          return (
            <Card key={subject.id} className="flex h-full flex-col gap-0 p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-navy text-gold">
                  <Icon name={SUBJECT_ICON[subject.code] ?? "BookOpen"} className="size-5" />
                </span>
                {todo > 0 ? (
                  <Badge className="font-bold">{todo} to do</Badge>
                ) : (
                  <Badge variant="secondary" className="font-bold">Up to date</Badge>
                )}
              </div>

              <h2 className="mt-4 font-heading text-base font-extrabold">{subject.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{dir.teacherName(teacherId)}</p>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-muted/70 p-2">
                  <dt className="text-[0.6rem] font-bold text-muted-foreground uppercase">Lessons</dt>
                  <dd className="mt-0.5 text-sm font-extrabold">{lessonsPerWeek}</dd>
                </div>
                <div className="rounded-lg bg-muted/70 p-2">
                  <dt className="text-[0.6rem] font-bold text-muted-foreground uppercase">Work</dt>
                  <dd className="mt-0.5 text-sm font-extrabold">{subjectAssignments.length}</dd>
                </div>
              </dl>

              <Button
                variant="outline"
                size="lg"
                className="mt-5 w-full font-bold"
                render={<Link href="/portal/pupil/assignments" />}
              >
                My assignments
                <ArrowRightIcon />
              </Button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
