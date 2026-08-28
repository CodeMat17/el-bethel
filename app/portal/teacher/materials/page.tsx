import type { Metadata } from "next";

import { EmptyState, StatCard } from "@/components/common";
import { MaterialForm } from "@/components/portal/material-form";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireTeacher } from "@/lib/school/auth";
import {
  classDisplayName,
  classesForTeacher,
  getMaterialsForTeacher,
  getSubject,
  subjectsForTeacher,
} from "@/lib/school/data";
import { fileSize, formatDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "Learning materials" };

export default async function TeacherMaterialsPage({
  searchParams,
}: PageProps<"/portal/teacher/materials">) {
  const user = await requireTeacher();
  const params = await searchParams;

  if (!user.teacherId) {
    return <EmptyState icon="GraduationCap" title="No teaching record" description="Contact the school administrator." />;
  }

  const classes = classesForTeacher(user.teacherId);
  const subjects = subjectsForTeacher(user.teacherId);
  const materials = getMaterialsForTeacher(user.teacherId);
  const requested = typeof params.class === "string" ? params.class : undefined;
  const defaultClassId = classes.some((c) => c.id === requested) ? requested : classes[0]?.id;

  const totalDownloads = materials.reduce((sum, m) => sum + m.downloads, 0);

  return (
    <>
      <PortalPageHeader
        title="Learning materials"
        description="Share notes, worksheets, slides and videos with a class."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Published" value={materials.length} icon="FolderOpen" tone="info" />
        <StatCard label="Total downloads" value={totalDownloads} icon="TrendingUp" tone="success" />
        <StatCard label="Classes covered" value={new Set(materials.map((m) => m.classId)).size} icon="School" tone="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Publish new material</h2>
          <Separator className="my-5" />
          {classes.length === 0 || subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You need at least one class and subject assigned before you can publish material.
            </p>
          ) : (
            <MaterialForm
              classes={classes.map((c) => ({ id: c.id, name: c.name }))}
              subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
              defaultClassId={defaultClassId}
            />
          )}
        </Card>

        <div>
          <h2 className="mb-4 font-heading text-base font-extrabold">Everything you have shared</h2>
          {materials.length === 0 ? (
            <EmptyState
              icon="FolderOpen"
              title="Nothing published yet"
              description="Materials you share with a class appear here and in the pupil portal."
            />
          ) : (
            <ul className="space-y-3">
              {materials.map((material) => (
                <li key={material.id}>
                  <Card className="gap-0 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold">{material.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {classDisplayName(material.classId)} · {getSubject(material.subjectId)?.name}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 font-bold capitalize">{material.kind}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {material.description}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {material.sizeBytes ? `${fileSize(material.sizeBytes)} · ` : ""}
                      {material.downloads} downloads · added {formatDate(material.uploadedAt)}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
