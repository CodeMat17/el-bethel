import type { Metadata } from "next";

import { StatCard } from "@/components/common";
import { BarChart } from "@/components/portal/charts";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAdmin } from "@/lib/school/auth";
import { CLASS_LEVELS } from "@/lib/school/config";
import {
  getClasses,
  getEnrolmentByLevel,
  getStudentsByClass,
  getSubjects,
  teacherNameById,
} from "@/lib/school/data";

export const metadata: Metadata = { title: "Classes" };

export default async function AdminClassesPage() {
  await requireAdmin();

  const classes = getClasses();
  const enrolment = getEnrolmentByLevel();
  const totalPupils = classes.reduce((sum, c) => sum + getStudentsByClass(c.id).length, 0);
  const averageSize = classes.length ? Math.round(totalPupils / classes.length) : 0;
  const overCapacity = classes.filter((c) => getStudentsByClass(c.id).length > c.capacity).length;

  return (
    <>
      <PortalPageHeader
        title="Classes"
        description="Every class section, its class teacher, roster size and room."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Classes" value={classes.length} icon="School" tone="info" />
        <StatCard label="Class levels" value={CLASS_LEVELS.length} icon="Layers" tone="neutral" />
        <StatCard label="Average class size" value={averageSize} icon="Users" tone="gold" />
        <StatCard
          label="Over capacity"
          value={overCapacity}
          icon="CircleAlert"
          tone={overCapacity > 0 ? "warning" : "success"}
        />
      </div>

      <Card className="mb-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Enrolment by class level</h2>
        <Separator className="my-5" />
        <BarChart data={enrolment.map((row) => ({ label: row.level, value: row.count }))} />
      </Card>

      <div className="space-y-8">
        {CLASS_LEVELS.map((level) => {
          const levelClasses = classes.filter((c) => c.levelId === level.id);
          const subjects = getSubjects().filter((s) => s.levelIds.includes(level.id));
          return (
            <section key={level.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-heading text-lg font-extrabold">{level.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {levelClasses.length} section{levelClasses.length === 1 ? "" : "s"} ·{" "}
                  {subjects.length} subjects
                </p>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {levelClasses.map((cls) => {
                  const roster = getStudentsByClass(cls.id).length;
                  const fill = Math.round((roster / cls.capacity) * 100);
                  return (
                    <Card key={cls.id} className="gap-0 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-heading text-base font-extrabold">{cls.name}</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">{cls.room}</p>
                        </div>
                        <Badge variant={roster > cls.capacity ? "destructive" : "secondary"} className="font-bold">
                          {roster}/{cls.capacity}
                        </Badge>
                      </div>
                      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${roster > cls.capacity ? "bg-destructive" : "bg-viz-3"}`}
                          style={{ width: `${Math.min(100, fill)}%` }}
                        />
                      </div>
                      <p className="mt-3 truncate text-xs text-muted-foreground">
                        Class teacher: {teacherNameById(cls.classTeacherId)}
                      </p>
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
