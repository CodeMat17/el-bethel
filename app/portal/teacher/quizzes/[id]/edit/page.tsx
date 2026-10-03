import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { PortalPageHeader } from "@/components/portal/page-header";
import { QuizForm } from "@/components/portal/quiz-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { requireTeacher } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { teachingOptions } from "@/lib/school/teaching-options";

export const metadata: Metadata = { title: "Edit quiz" };

export default async function EditQuizPage({ params }: PageProps<"/portal/teacher/quizzes/[id]/edit">) {
  await requireTeacher();
  const { id } = await params;
  const dir = await getDirectory();
  const [data, options] = await Promise.all([query(api.quizzes.getForTeacher, { id }), teachingOptions(dir)]);
  if (!data) notFound();
  const { quiz } = data;
  const locked = data.attempts.length > 0;
  // Keep the quiz's own class selectable even if it isn't in this teacher's options (an admin editing).
  const opts = options.some((o) => o.classId === quiz.classId)
    ? options
    : [{ classId: quiz.classId, className: dir.className(quiz.classId), subjects: [{ id: quiz.subjectId, name: dir.subjectName(quiz.subjectId) }] }, ...options];

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href={`/portal/teacher/quizzes/${quiz.id}`} />}>
        <ArrowLeftIcon />
        Back to the quiz
      </Button>
      <PortalPageHeader title="Edit quiz" description={quiz.title} />
      <Card className="max-w-4xl gap-0 p-5 sm:p-8">
        <QuizForm
          options={opts}
          locked={locked}
          initial={{
            id: quiz.id,
            classId: quiz.classId,
            subjectId: quiz.subjectId,
            title: quiz.title,
            description: quiz.description,
            durationMinutes: quiz.durationMinutes,
            attemptsAllowed: quiz.attemptsAllowed,
            randomize: quiz.randomize,
            showResultsImmediately: quiz.showResultsImmediately,
            opensAt: quiz.opensAt,
            closesAt: quiz.closesAt,
            questions: quiz.questions,
            status: quiz.status,
          }}
        />
      </Card>
    </>
  );
}
