import type { Metadata } from "next";

import { EmptyState, StatCard } from "@/components/common";
import { MaterialForm } from "@/components/portal/material-form";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TrashIcon } from "lucide-react";

import { ConfirmAction } from "@/components/portal/confirm-action";
import { api } from "@/convex/_generated/api";
import { removeMaterial } from "@/lib/school/actions/teaching";
import { requireTeacher } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { teachingOptions } from "@/lib/school/teaching-options";
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

  const dir = await getDirectory();
  const [options, materials] = await Promise.all([teachingOptions(dir), query(api.learning.myMaterials, {})]);
  const requested = typeof params.class === "string" ? params.class : undefined;
  const videos = materials.filter((m) => m.kind === "video").length;

  return (
    <>
      <PortalPageHeader
        title="Learning materials"
        description="Share notes, worksheets, slides and videos with a class."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Published" value={materials.length} icon="FolderOpen" tone="info" />
        <StatCard label="Videos" value={videos} icon="MonitorPlay" tone="success" />
        <StatCard label="Classes covered" value={new Set(materials.map((m) => m.classId)).size} icon="School" tone="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Publish new material</h2>
          <Separator className="my-5" />
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You need at least one class and subject assigned before you can publish material.
            </p>
          ) : (
            <MaterialForm options={options} defaultClassId={requested} />
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
                          {dir.className(material.classId)} · {dir.subjectName(material.subjectId)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 font-bold capitalize">{material.kind}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {material.description}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {material.sizeBytes ? `${fileSize(material.sizeBytes)} · ` : ""}
                      added {formatDate(material.uploadedAt)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {material.url ? (
                        <a href={material.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary underline-offset-4 hover:underline dark:text-gold">
                          Open
                        </a>
                      ) : null}
                      <ConfirmAction
                        action={removeMaterial.bind(null, material.id)}
                        icon={<TrashIcon />}
                        variant="ghost"
                        className="h-7 px-2 text-xs font-bold text-destructive"
                        pendingText="Removing…"
                        destructive
                        confirm={{ title: "Remove this material?", description: "Pupils will no longer see it.", confirmLabel: "Remove" }}
                      >
                        Remove
                      </ConfirmAction>
                    </div>
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
