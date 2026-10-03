import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { AssignmentForm } from "@/components/portal/assignment-form";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { requireTeacher } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { teachingOptions } from "@/lib/school/teaching-options";

export const metadata: Metadata = { title: "Edit assignment" };

export default async function EditAssignmentPage({ params }: PageProps<"/portal/teacher/assignments/[id]/edit">) {
  await requireTeacher();
  const { id } = await params;
  const dir = await getDirectory();
  const [data, options] = await Promise.all([query(api.assignments.getForStaff, { assignmentId: id }), teachingOptions(dir)]);
  if (!data) notFound();
  const { assignment, stats } = data;

  // Keep the assignment's own class and subject selectable even if teaching has changed since.
  const hasPair = options.some((o) => o.classId === assignment.classId && o.subjects.some((s) => s.id === assignment.subjectId));
  const allOptions = hasPair
    ? options
    : [
        {
          classId: assignment.classId,
          className: dir.className(assignment.classId),
          subjects: [{ id: assignment.subjectId, name: dir.subjectName(assignment.subjectId) }],
        },
        ...options,
      ];

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href={`/portal/teacher/assignments/${assignment.id}`} />}>
        <ArrowLeftIcon />
        Back to assignment
      </Button>
      <PortalPageHeader title="Edit assignment" description={assignment.title} />
      <Card className="max-w-4xl gap-0 p-5 sm:p-8">
        <AssignmentForm
          options={allOptions}
          locked={stats.submitted > 0}
          initial={{
            id: assignment.id,
            classId: assignment.classId,
            subjectId: assignment.subjectId,
            title: assignment.title,
            topic: assignment.topic,
            description: assignment.description,
            instructions: assignment.instructions,
            startDate: assignment.startDate,
            dueDate: assignment.dueDate,
            questions: assignment.questions,
            status: assignment.status,
          }}
        />
      </Card>
    </>
  );
}
