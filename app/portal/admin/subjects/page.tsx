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
import { TrashIcon } from "lucide-react";

import { SubjectDialog } from "@/components/admin/academic-dialogs";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { removeSubject } from "@/lib/school/actions/admin";
import { getDirectory } from "@/lib/school/directory";

export const metadata: Metadata = { title: "Subjects" };

export default async function AdminSubjectsPage() {
  await requireAdmin();

  const dir = await getDirectory();
  const subjects = [...dir.subjects].sort((a, b) => a.name.localeCompare(b.name));
  const levels = CLASS_LEVELS.map((l) => ({ value: l.id, label: l.name }));

  return (
    <>
      <PortalPageHeader
        title="Subjects"
        description="The full subject catalogue, which levels study each subject, and how many staff teach it."
        action={<SubjectDialog levels={levels} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Subjects" value={subjects.length} icon="Library" tone="info" />
        <StatCard label="Core subjects" value={subjects.filter((s) => s.group === "core").length} icon="BookOpen" tone="gold" />
        <StatCard label="Additional subjects" value={subjects.filter((s) => s.group === "additional").length} icon="Layers" tone="neutral" />
        <StatCard label="Teaching assignments" value={dir.teaching.length} icon="Users" tone="neutral" />
      </div>

      <Card className="mb-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Assessment weighting</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The default split. Teachers can change the CA weighting for each subject, class and term when entering
          scores; the exam takes the rest and the total is always out of 100.
        </p>
        <Separator className="my-5" />
        <div className="grid gap-4 sm:grid-cols-2">
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
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject) => {
              const subjectLevels = CLASS_LEVELS.filter((l) => subject.levelIds.includes(l.id));
              const staff = new Set(dir.teaching.filter((t) => t.subjectId === subject.id).map((t) => t.teacherId)).size;
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
                    {subjectLevels.length === CLASS_LEVELS.length
                      ? "All levels"
                      : `${subjectLevels[0]?.name} – ${subjectLevels[subjectLevels.length - 1]?.name}`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{staff}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <SubjectDialog subject={subject} levels={levels} />
                      <ConfirmAction
                        action={removeSubject.bind(null, subject.id)}
                        icon={<TrashIcon />}
                        variant="ghost"
                        className="font-bold text-destructive"
                        pendingText="Deleting…"
                        destructive
                        confirm={{ title: `Delete ${subject.name}?`, description: "Subjects with assignments or results can't be deleted.", confirmLabel: "Delete" }}
                      >
                        Delete
                      </ConfirmAction>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

    </>
  );
}
