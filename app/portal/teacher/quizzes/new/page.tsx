import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeftIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { QuizForm } from "@/components/portal/quiz-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireTeacher } from "@/lib/school/auth";
import { getDirectory } from "@/lib/school/directory";
import { teachingOptions } from "@/lib/school/teaching-options";

export const metadata: Metadata = { title: "New quiz" };

export default async function NewQuizPage({ searchParams }: PageProps<"/portal/teacher/quizzes/new">) {
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
  // Only pre-select a class this teacher actually teaches.
  const first = options.find((o) => o.classId === requestedClass) ?? options[0];

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/teacher/quizzes" />}>
        <ArrowLeftIcon />
        All quizzes
      </Button>
      <PortalPageHeader title="New quiz" description="Multiple choice, true/false, short answer, picture and matching questions." />
      <Card className="max-w-4xl gap-0 p-5 sm:p-8">
        <QuizForm options={[first, ...options.filter((o) => o.classId !== first.classId)]} />
      </Card>
    </>
  );
}
