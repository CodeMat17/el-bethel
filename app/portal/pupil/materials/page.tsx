import type { Metadata } from "next";
import { DownloadIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import { Icon } from "@/components/icon";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePupil } from "@/lib/school/auth";
import {
  classDisplayName,
  getMaterialsForClass,
  getStudent,
  getSubject,
  teacherNameById,
} from "@/lib/school/data";
import { fileSize, formatDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "Learning materials" };

const KIND_ICON: Record<string, string> = {
  note: "BookOpen",
  pdf: "FileText",
  worksheet: "ClipboardPen",
  video: "MonitorPlay",
  audio: "Activity",
  slides: "Layers",
  link: "Signal",
  image: "Images",
};

export default async function PupilMaterialsPage() {
  const user = await requirePupil();
  const student = user.studentId ? getStudent(user.studentId) : null;
  if (!student) {
    return <EmptyState icon="Backpack" title="No pupil record" description="Please ask your class teacher." />;
  }

  const materials = getMaterialsForClass(student.classId);

  return (
    <>
      <PortalPageHeader
        eyebrow={classDisplayName(student.classId)}
        title="Learning materials"
        description="Notes, worksheets, slides and videos your teachers have shared with your class."
      />

      {materials.length === 0 ? (
        <EmptyState
          icon="FolderOpen"
          title="No materials yet"
          description="When your teacher uploads notes or worksheets, they will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <Card key={material.id} className="flex h-full flex-col gap-0 p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-info/12 text-info">
                  <Icon name={KIND_ICON[material.kind] ?? "FileText"} className="size-5" />
                </span>
                <Badge variant="secondary" className="font-bold capitalize">{material.kind}</Badge>
              </div>

              <h2 className="mt-4 font-heading text-base leading-snug font-extrabold">{material.title}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                {material.description}
              </p>

              <p className="mt-4 text-xs text-muted-foreground">
                {getSubject(material.subjectId)?.name} · {teacherNameById(material.teacherId)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {fileSize(material.sizeBytes)} · added {formatDate(material.uploadedAt)}
              </p>

              <Button variant="outline" size="lg" className="mt-4 w-full font-bold" disabled>
                <DownloadIcon />
                Open
              </Button>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Downloads are disabled in this demonstration environment. In a live deployment each file is
        served from private storage through a short-lived signed link.
      </p>
    </>
  );
}
