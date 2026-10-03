import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeftIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import { AssignmentForm } from "@/components/portal/assignment-form";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireTeacher } from "@/lib/school/auth";
import { getDirectory } from "@/lib/school/directory";
import { teachingOptions } from "@/lib/school/teaching-options";

export const metadata: Metadata = { title: "New assignment" };

export default async function CreateAssignmentPage({
  searchParams,
}: PageProps<"/portal/teacher/assignments/create">) {
  await requireTeacher();
  const params = await searchParams;
  const requestedClass = typeof params.class === "string" ? params.class : undefined;

  const options = await teachingOptions(await getDirectory());
  if (options.length === 0) {
    return (
      <EmptyState
        icon="School"
        title="You have no classes or subjects assigned"
        description="The school administrator assigns classes and subjects. Ask them to add you as a subject teacher."
      />
    );
  }

  // Never trust the query string: only pre-select a class this teacher actually teaches.
  const first = options.find((o) => o.classId === requestedClass) ?? options[0];

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/teacher/assignments" />}>
        <ArrowLeftIcon />
        All assignments
      </Button>

      <PortalPageHeader
        title="New assignment"
        description="Write the questions and choose how pupils answer each one: typed answer, one choice or several choices."
      />

      <Card className="max-w-4xl gap-0 p-5 sm:p-8">
        <AssignmentForm
          options={[first, ...options.filter((o) => o.classId !== first.classId)]}
        />
      </Card>
    </>
  );
}
