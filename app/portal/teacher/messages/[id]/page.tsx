import Link from "next/link";
import type { Metadata } from "next";
import { forbidden, notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { PortalPageHeader } from "@/components/portal/page-header";
import { MessageThreadView } from "@/components/portal/message-thread";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireTeacher } from "@/lib/school/auth";
import { getStudent, getThread, studentName, userDisplayName } from "@/lib/school/data";

export const metadata: Metadata = { title: "Conversation" };

export default async function TeacherThreadPage({ params }: PageProps<"/portal/teacher/messages/[id]">) {
  const user = await requireTeacher();
  const { id } = await params;
  const thread = getThread(id);
  if (!thread) notFound();
  // Authorisation: only participants may read a conversation.
  if (!thread.participantIds.includes(user.id)) forbidden();

  const others = thread.participantIds.filter((pid) => pid !== user.id);
  const child = thread.studentId ? getStudent(thread.studentId) : null;

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/teacher/messages" />}>
        <ArrowLeftIcon />
        All messages
      </Button>

      <PortalPageHeader
        eyebrow={others.map((oid) => userDisplayName(oid)).join(", ")}
        title={thread.subject}
        description={child ? `About ${studentName(child)}` : undefined}
      />

      <Card className="gap-0 p-5 sm:p-6">
        <MessageThreadView
          threadId={thread.id}
          currentUserId={user.id}
          messages={thread.messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: userDisplayName(m.senderId),
            body: m.body,
            sentAt: m.sentAt,
          }))}
        />
      </Card>
    </>
  );
}
