import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";

import { EmptyState, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireTeacher } from "@/lib/school/auth";
import {
  classesForTeacher,
  getAssignmentsForClass,
  getLevel,
  getStudentsByClass,
  getSubjects,
  teacherNameById,
} from "@/lib/school/data";

export const metadata: Metadata = { title: "My classes" };

export default async function TeacherClassesPage() {
  const user = await requireTeacher();
  if (!user.teacherId) {
    return <EmptyState icon="GraduationCap" title="No teaching record" description="Contact the school administrator." />;
  }

  const classes = classesForTeacher(user.teacherId);

  return (
    <>
      <PortalPageHeader
        title="My classes"
        description="Every class you teach, with its roster, subjects and digital classroom."
      />

      {classes.length === 0 ? (
        <EmptyState
          icon="School"
          title="No classes assigned"
          description="The school administrator assigns classes at the start of each session."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const roster = getStudentsByClass(cls.id);
            const level = getLevel(cls.levelId);
            const subjects = getSubjects().filter((s) => level && s.levelIds.includes(level.id));
            const assignments = getAssignmentsForClass(cls.id);
            const isClassTeacher = cls.classTeacherId === user.teacherId;

            return (
              <Card key={cls.id} className="flex h-full flex-col gap-0 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-extrabold">{cls.name}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{cls.room}</p>
                  </div>
                  {isClassTeacher ? <StatusPill tone="gold">Class teacher</StatusPill> : null}
                </div>

                <Separator className="my-4" />

                <dl className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/70 p-2.5">
                    <dt className="text-[0.6rem] font-bold text-muted-foreground uppercase">Pupils</dt>
                    <dd className="mt-0.5 font-heading text-base font-extrabold">{roster.length}</dd>
                  </div>
                  <div className="rounded-lg bg-muted/70 p-2.5">
                    <dt className="text-[0.6rem] font-bold text-muted-foreground uppercase">Subjects</dt>
                    <dd className="mt-0.5 font-heading text-base font-extrabold">{subjects.length}</dd>
                  </div>
                  <div className="rounded-lg bg-muted/70 p-2.5">
                    <dt className="text-[0.6rem] font-bold text-muted-foreground uppercase">Work set</dt>
                    <dd className="mt-0.5 font-heading text-base font-extrabold">{assignments.length}</dd>
                  </div>
                </dl>

                <p className="mt-4 text-xs text-muted-foreground">
                  Class teacher: {teacherNameById(cls.classTeacherId)}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="font-bold">{level?.name}</Badge>
                  <Badge variant="secondary" className="font-bold">Section {cls.section}</Badge>
                </div>

                <Button
                  className="mt-5 w-full font-bold"
                  size="lg"
                  render={<Link href={`/portal/teacher/classes/${cls.id}`} />}
                >
                  Open digital classroom
                  <ArrowRightIcon />
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
