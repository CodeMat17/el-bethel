import Link from "next/link";
import type { Metadata } from "next";

import { ClassDialog } from "@/components/admin/academic-dialogs";
import { StatCard } from "@/components/common";
import { BarChart } from "@/components/portal/charts";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { requireAdmin } from "@/lib/school/auth";
import { CLASS_LEVELS } from "@/lib/school/config";
import { query } from "@/lib/school/convex";
import { teacherName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";

export const metadata: Metadata = { title: "Classes" };

export default async function AdminClassesPage() {
  await requireAdmin();
  const [dir, sizes] = await Promise.all([getDirectory(), query(api.academics.classStats, {})]);
  const classes = dir.classes;
  const totalPupils = classes.reduce((sum, c) => sum + (sizes[c.id] ?? 0), 0);
  const averageSize = classes.length ? Math.round(totalPupils / classes.length) : 0;
  const overCapacity = classes.filter((c) => (sizes[c.id] ?? 0) > c.capacity).length;
  const levels = CLASS_LEVELS.map((l) => ({ value: l.id, label: l.name }));
  const teachers = dir.teachers.filter((t) => t.active).map((t) => ({ value: t.id, label: teacherName(t) }));

  return (
    <>
      <PortalPageHeader
        title="Classes"
        description="Every class, its class teacher and who teaches each subject. Open a class to assign subject teachers."
        action={<ClassDialog levels={levels} teachers={teachers} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Classes" value={classes.length} icon="School" tone="info" />
        <StatCard label="Pupils" value={totalPupils} icon="Backpack" tone="neutral" />
        <StatCard label="Average class size" value={averageSize} icon="Users" tone="gold" />
        <StatCard label="Over capacity" value={overCapacity} icon="CircleAlert" tone={overCapacity > 0 ? "warning" : "success"} />
      </div>

      <Card className="mb-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Enrolment by class level</h2>
        <Separator className="my-5" />
        <BarChart
          data={CLASS_LEVELS.map((l) => ({
            label: l.name,
            value: classes.filter((c) => c.levelId === l.id).reduce((n, c) => n + (sizes[c.id] ?? 0), 0),
          }))}
        />
      </Card>

      <div className="space-y-8">
        {CLASS_LEVELS.map((level) => {
          const levelClasses = classes.filter((c) => c.levelId === level.id);
          if (levelClasses.length === 0) return null;
          const subjects = dir.subjects.filter((s) => s.levelIds.includes(level.id));
          return (
            <section key={level.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-heading text-lg font-extrabold">{level.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {levelClasses.length} section{levelClasses.length === 1 ? "" : "s"} · {subjects.length} subjects
                </p>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {levelClasses.map((cls) => {
                  const roster = sizes[cls.id] ?? 0;
                  const fill = Math.round((roster / Math.max(1, cls.capacity)) * 100);
                  const assigned = dir.teaching.filter((r) => r.classId === cls.id).length;
                  return (
                    <Card key={cls.id} className="gap-0 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-heading text-base font-extrabold">{cls.name}</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">{cls.room || "No room set"}</p>
                        </div>
                        <Badge variant={roster > cls.capacity ? "destructive" : "secondary"} className="font-bold">
                          {roster}/{cls.capacity}
                        </Badge>
                      </div>
                      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${roster > cls.capacity ? "bg-destructive" : "bg-viz-3"}`} style={{ width: `${Math.min(100, fill)}%` }} />
                      </div>
                      <p className="mt-3 truncate text-xs text-muted-foreground">Class teacher: {dir.teacherName(cls.classTeacherId)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Subject teachers: {assigned} of {subjects.length} assigned
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" className="font-bold" render={<Link href={`/portal/admin/classes/${cls.id}`} />}>
                          Subject teachers
                        </Button>
                        <ClassDialog cls={cls} levels={levels} teachers={teachers} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
