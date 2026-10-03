import type { Metadata } from "next";

import { MessagesInbox } from "@/components/portal/messages-inbox";
import { requireTeacher } from "@/lib/school/auth";

export const metadata: Metadata = { title: "Messages" };

export default async function TeacherMessagesPage() {
  const user = await requireTeacher();
  return (
    <MessagesInbox
      user={user}
      basePath="/portal/teacher/messages"
      description="Conversations with parents of pupils you teach and with school staff."
      emptyText="Conversations started by a parent or by you will appear here."
    />
  );
}
