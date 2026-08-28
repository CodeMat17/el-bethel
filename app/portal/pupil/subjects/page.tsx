import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import { Icon } from "@/components/icon";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePupil } from "@/lib/school/auth";
import {
  classDisplayName,
  getClass,
  getLevel,
  getStudent,
  getStudentAssignments,
  getSubjects,
  getTimetableForClass,
  teacherNameById,
} from "@/lib/school/data";
import { getDb } from "@/lib/school/store";

export const metadata: Metadata = { title: "My subjects" };

const SUBJECT_ICON: Record<string, string> = {
  "sub-eng": "BookOpen",
  "sub-mth": "ChartColumn",
  "sub-bsc": "FlaskConical",
  "sub-sst": "Users",
  "sub-civ": "ShieldCheck",
  "sub-cmp": "Cpu",
  "sub-qr": "Percent",
  "sub-vr": "MessageCircle",
  "sub-fre": "Landmark",
  "sub-crs": "Heart",
  "sub-irs": "Heart",
  "sub-art": "Palette",
  "sub-mus": "Activity",
  "sub-phe": "Goal",
  "sub-hec": "UtensilsCrossed",
  "sub-agr": "Sprout",
  "sub-lit": "BookMarked",
  "sub-num": "Layers",
};

export default async function PupilSubjectsPage() {
  const user = await requirePupil();
  const student = user.studentId ? getStudent(user.studentId) : null;
  if (!student) {
    return <EmptyState icon="Backpack" title="No pupil record" description="Please ask your class teacher." />;
  }

  const cls = getClass(student.classId);
  const level = cls ? getLevel(cls.levelId) : null;
  const subjects = level ? getSubjects().filter((s) => s.levelIds.includes(level.id)) : [];
  const assignments = getStudentAssignments(student.id);
  const timetable = getTimetableForClass(student.classId);
  const materials = getDb().materials.filter((m) => m.classId === student.classId);

  return (
    <>
      <PortalPageHeader
        eyebrow={classDisplayName(student.classId)}
        title="My subjects"
        description={`The ${subjects.length} subjects you study, and who teaches each one.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => {
          const teacherId = timetable.find((s) => s.subjectId === subject.id)?.teacherId;
          const subjectAssignments = assignments.filter((a) => a.assignment.subjectId === subject.id);
          const todo = subjectAssignments.filter((a) =>
            ["not_started", "in_progress", "resubmission_required"].includes(
              a.submission?.status ?? "not_started",
            ),
          ).length;
          const subjectMaterials = materials.filter((m) => m.subjectId === subject.id).length;
          const lessonsPerWeek = timetable.filter((s) => s.subjectId === subject.id).length;

          return (
            <Card key={subject.id} className="flex h-full flex-col gap-0 p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-navy text-gold">
                  <Icon name={SUBJECT_ICON[subject.id] ?? "BookOpen"} className="size-5" />
                </span>
                {todo > 0 ? (
                  <Badge className="font-bold">{todo} to do</Badge>
                ) : (
                  <Badge variant="secondary" className="font-bold">Up to date</Badge>
                )}
              </div>

              <h2 className="mt-4 font-heading text-base font-extrabold">{subject.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{teacherNameById(teacherId)}</p>

              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/70 p-2">
                  <dt className="text-[0.6rem] font-bold text-muted-foreground uppercase">Lessons</dt>
                  <dd className="mt-0.5 text-sm font-extrabold">{lessonsPerWeek}</dd>
                </div>
                <div className="rounded-lg bg-muted/70 p-2">
                  <dt className="text-[0.6rem] font-bold text-muted-foreground uppercase">Work</dt>
                  <dd className="mt-0.5 text-sm font-extrabold">{subjectAssignments.length}</dd>
                </div>
                <div className="rounded-lg bg-muted/70 p-2">
                  <dt className="text-[0.6rem] font-bold text-muted-foreground uppercase">Files</dt>
                  <dd className="mt-0.5 text-sm font-extrabold">{subjectMaterials}</dd>
                </div>
              </dl>

              <Button
                variant="outline"
                size="lg"
                className="mt-5 w-full font-bold"
                render={<Link href="/portal/pupil/materials" />}
              >
                Learning materials
                <ArrowRightIcon />
              </Button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
