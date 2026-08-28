import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeftIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import { AssignmentForm } from "@/components/portal/assignment-form";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireTeacher } from "@/lib/school/auth";
import { classesForTeacher, subjectsForTeacher } from "@/lib/school/data";

export const metadata: Metadata = { title: "New assignment" };

export default async function CreateAssignmentPage({
  searchParams,
}: PageProps<"/portal/teacher/assignments/create">) {
  const user = await requireTeacher();
  const params = await searchParams;
  const requestedClass = typeof params.class === "string" ? params.class : undefined;

  if (!user.teacherId) {
    return <EmptyState icon="GraduationCap" title="No teaching record" description="Contact the school administrator." />;
  }

  const classes = classesForTeacher(user.teacherId);
  const subjects = subjectsForTeacher(user.teacherId);

  if (classes.length === 0 || subjects.length === 0) {
    return (
      <EmptyState
        icon="School"
        title="You have no classes or subjects assigned"
        description="The school administrator assigns classes and subjects at the start of each session."
      />
    );
  }

  // Never trust the query string: only pre-select a class this teacher actually teaches.
  const defaultClassId = classes.some((c) => c.id === requestedClass) ? requestedClass : classes[0].id;

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/teacher/assignments" />}>
        <ArrowLeftIcon />
        All assignments
      </Button>

      <PortalPageHeader
        title="New assignment"
        description="Set work for one of your classes. Pupils and parents are notified as soon as you publish."
      />

      <Card className="max-w-3xl gap-0 p-5 sm:p-8">
        <AssignmentForm
          classes={classes.map((c) => ({ id: c.id, name: c.name }))}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name, levelIds: s.levelIds }))}
          defaultClassId={defaultClassId}
        />
      </Card>
    </>
  );
}
