import Link from "next/link";
import type { Metadata } from "next";

import { MessagesInbox } from "@/components/portal/messages-inbox";
import { Button } from "@/components/ui/button";
import { requireParent } from "@/lib/school/auth";

export const metadata: Metadata = { title: "Messages" };

export default async function ParentMessagesPage() {
  const user = await requireParent();
  return (
    <MessagesInbox
      user={user}
      basePath="/portal/parent/messages"
      description="Conversations with your children's teachers and the school office."
      emptyText="When you or a teacher starts a conversation it will appear here."
      emptyAction={
        <Button size="lg" className="font-bold" render={<Link href="/portal/parent/appointments" />}>
          Book a parent-teacher meeting
        </Button>
      }
    />
  );
}
