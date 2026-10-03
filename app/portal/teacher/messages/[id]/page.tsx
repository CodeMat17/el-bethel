import type { Metadata } from "next";

import { ThreadPage } from "@/components/portal/thread-page";
import { requireTeacher } from "@/lib/school/auth";

export const metadata: Metadata = { title: "Conversation" };

export default async function TeacherThreadPage({ params }: PageProps<"/portal/teacher/messages/[id]">) {
  await requireTeacher();
  const { id } = await params;
  return <ThreadPage id={id} basePath="/portal/teacher/messages" />;
}
