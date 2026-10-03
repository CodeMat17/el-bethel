import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, TrashIcon } from "lucide-react";

import { ClassDialog, SubjectTeacherPicker } from "@/components/admin/academic-dialogs";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { removeClass } from "@/lib/school/actions/admin";
import { requireAdmin } from "@/lib/school/auth";
import { CLASS_LEVELS } from "@/lib/school/config";
import { query } from "@/lib/school/convex";
import { teacherName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";

export const metadata: Metadata = { title: "Class" };

export default async function AdminClassPage({ params }: PageProps<"/portal/admin/classes/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [dir, sizes] = await Promise.all([getDirectory(), query(api.academics.classStats, {})]);
  const cls = dir.getClass(id);
  if (!cls) notFound();

  const subjects = dir.subjectsForClass(cls.id);
  const teachers = dir.teachers.filter((t) => t.active).map((t) => ({ value: t.id, label: teacherName(t) }));
  const levels = CLASS_LEVELS.map((l) => ({ value: l.id, label: l.name }));
  const pupils = sizes[cls.id] ?? 0;

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/admin/classes" />}>
        <ArrowLeftIcon />
        All classes
      </Button>

      <PortalPageHeader
        eyebrow={`${dir.levelName(cls.levelId)} · ${pupils} pupils`}
        title={cls.name}
        description={`Class teacher: ${dir.teacherName(cls.classTeacherId)}. Subject teachers can set assignments and enter scores for their subject in this class.`}
        action={
          <div className="flex flex-wrap gap-2">
            <ClassDialog cls={cls} levels={levels} teachers={teachers} />
            {pupils === 0 ? (
              <ConfirmAction
                action={removeClass.bind(null, cls.id)}
                icon={<TrashIcon />}
                variant="ghost"
                className="font-bold text-destructive"
                pendingText="Deleting…"
                destructive
                confirm={{ title: `Delete ${cls.name}?`, description: "Only empty classes without assignments can be deleted.", confirmLabel: "Delete" }}
              >
                Delete
              </ConfirmAction>
            ) : null}
          </div>
        }
      />

      {subjects.length === 0 ? (
        <Card className="gap-0 p-6 text-sm text-muted-foreground">
          No subjects are set for {dir.levelName(cls.levelId)} yet. Add them on the Subjects page.
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Teacher</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => {
                const current = dir.teacherFor(cls.id, subject.id);
                return (
                  <TableRow key={subject.id}>
                    <TableCell>
                      <span className="font-bold">{subject.name}</span>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{subject.code}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-bold capitalize">
                        {subject.group}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <SubjectTeacherPicker classId={cls.id} subjectId={subject.id} teacherId={current?.id} teachers={teachers} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        The class teacher can always set work in any subject for their own class and publishes the term&apos;s results.
      </p>
    </>
  );
}
