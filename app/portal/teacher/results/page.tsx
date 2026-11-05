import type { Metadata } from "next";

import { ResultsWorkspace } from "@/components/portal/results-workspace";
import { requireTeacher } from "@/lib/school/auth";

export const metadata: Metadata = { title: "Results" };

export default async function TeacherResultsPage({ searchParams }: PageProps<"/portal/teacher/results">) {
  const user = await requireTeacher();
  return <ResultsWorkspace user={user} mode="teacher" searchParams={await searchParams} />;
}
