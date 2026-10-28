import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import { StatCard } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { TimetableGrid } from "@/components/portal/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { requireTeacher } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { studentName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { avatarTone, formatDate, initials } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Digital classroom" };

export default async function TeacherClassPage({ params }: PageProps<"/portal/teacher/classes/[id]">) {
  await requireTeacher();
  const { id } = await params;
  // Convex refuses unless the viewer teaches this class (or is an administrator).
  const [data, dir] = await Promise.all([query(api.classroom.overview, { classId: id }), getDirectory()]);
  if (!data) notFound();
  const { class: cls, roster, assignments, timetable } = data;
  const subjects = dir.subjectsForClass(cls.id);
  const levelName = dir.levelName(cls.levelId);

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/teacher/classes" />}>
        <ArrowLeftIcon />
        My classes
      </Button>

      <PortalPageHeader
        eyebrow={`${levelName} · ${cls.room}`}
        title={cls.name}
        description={`Class teacher: ${dir.teacherName(cls.classTeacherId)}`}
        action={
          <Button size="lg" className="font-bold" render={<Link href={`/portal/teacher/assignments/create?class=${cls.id}`} />}>
            New assignment
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pupils" value={roster.length} icon="Backpack" tone="info" />
        <StatCard label="Subjects" value={subjects.length} icon="Library" tone="neutral" />
        <StatCard label="Assignments" value={assignments.length} icon="ClipboardList" tone="gold" />
      </div>

      <Tabs defaultValue="pupils" className="mt-6">
        <TabsList className="h-auto w-full overflow-x-auto sm:w-fit">
          {[
            ["pupils", `Pupils (${roster.length})`],
            ["assignments", `Assignments (${assignments.length})`],
            ["timetable", "Timetable"],
            ["subjects", `Subjects (${subjects.length})`],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="text-xs font-bold whitespace-nowrap sm:text-sm">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="pupils" className="mt-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roster.map((student) => {
              return (
                <Card key={student.id} className="gap-0 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-11 shrink-0">
                      {student.photo ? <AvatarImage src={student.photo.url} alt="" /> : null}
                      <AvatarFallback className={cn("text-xs font-bold", avatarTone(student.avatarSeed))}>
                        {initials(student.firstName, student.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{studentName(student)}</p>
                      <p className="truncate text-xs text-muted-foreground">{student.studentNo}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="mt-5">
          <ul className="space-y-3">
            {assignments.map(({ assignment, stats }) => {
              const pct = stats.students ? Math.round((stats.submitted / stats.students) * 100) : 0;
              return (
                <li key={assignment.id}>
                  <Link href={`/portal/teacher/assignments/${assignment.id}`} className="block">
                    <Card className="gap-0 p-4 transition-colors hover:border-gold/40">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold">{assignment.title}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {dir.subjectName(assignment.subjectId)} · due {formatDate(assignment.dueDate)}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-muted-foreground">
                          {stats.submitted}/{stats.students}
                        </span>
                      </div>
                      <Progress value={pct} className="mt-3" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {stats.graded} marked · {stats.pendingGrading} to mark · {stats.notSubmitted} not submitted
                      </p>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        </TabsContent>

        <TabsContent value="timetable" className="mt-5">
          <TimetableGrid slots={timetable} dir={dir} />
        </TabsContent>

        <TabsContent value="subjects" className="mt-5">
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <span key={subject.id} className="rounded-full border bg-card px-4 py-2 text-sm font-bold shadow-sm">
                {subject.name}
              </span>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button variant="outline" size="lg" className="font-bold" render={<Link href={`/portal/teacher/results?class=${cls.id}`} />}>
          Enter results
          <ArrowRightIcon />
        </Button>
      </div>
    </>
  );
}
