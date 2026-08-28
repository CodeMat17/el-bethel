import type { Metadata } from "next";

import { StatCard } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/school/auth";
import { ASSESSMENT_WEIGHTING, CLASS_LEVELS } from "@/lib/school/config";
import { getSubjects, getTeachers } from "@/lib/school/data";
import { getDb } from "@/lib/school/store";

export const metadata: Metadata = { title: "Subjects" };

export default async function AdminSubjectsPage() {
  await requireAdmin();

  const subjects = getSubjects();
  const teachers = getTeachers();
  const db = getDb();

  return (
    <>
      <PortalPageHeader
        title="Subjects"
        description="The full subject catalogue, which levels study each subject, and how many staff teach it."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Subjects" value={subjects.length} icon="Library" tone="info" />
        <StatCard label="Core subjects" value={subjects.filter((s) => s.group === "core").length} icon="BookOpen" tone="gold" />
        <StatCard label="Additional subjects" value={subjects.filter((s) => s.group === "additional").length} icon="Layers" tone="neutral" />
        <StatCard label="Lessons a week" value={db.timetable.filter((s) => s.subjectId).length} icon="Clock" tone="neutral" />
      </div>

      <Card className="mb-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Assessment weighting</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Applied to every subject. Configurable per session by a school administrator.
        </p>
        <Separator className="my-5" />
        <div className="grid gap-4 sm:grid-cols-4">
          {ASSESSMENT_WEIGHTING.map((weighting) => (
            <div key={weighting.component} className="rounded-xl border bg-card p-4 text-center">
              <p className="font-heading text-2xl font-extrabold">{weighting.weight}%</p>
              <p className="mt-1 text-xs font-bold text-muted-foreground uppercase">{weighting.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">max {weighting.maxScore}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Levels</TableHead>
              <TableHead className="text-right">Teachers</TableHead>
              <TableHead className="text-right">Lessons / week</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject) => {
              const levels = CLASS_LEVELS.filter((l) => subject.levelIds.includes(l.id));
              const staff = teachers.filter((t) => t.subjectIds.includes(subject.id)).length;
              const lessons = db.timetable.filter((s) => s.subjectId === subject.id).length;
              return (
                <TableRow key={subject.id}>
                  <TableCell className="font-bold">{subject.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{subject.code}</TableCell>
                  <TableCell>
                    <Badge variant={subject.group === "core" ? "default" : "secondary"} className="font-bold capitalize">
                      {subject.group}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-72 text-muted-foreground">
                    {levels.length === CLASS_LEVELS.length
                      ? "All levels"
                      : `${levels[0]?.name} – ${levels[levels.length - 1]?.name}`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{staff}</TableCell>
                  <TableCell className="text-right tabular-nums">{lessons}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Subjects are configurable: a school administrator can add, retire or re-scope any subject
        without a code change. Editing is disabled in this demonstration environment.
      </p>
    </>
  );
}
