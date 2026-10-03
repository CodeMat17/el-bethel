import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { MessageThreadView } from "@/components/portal/message-thread";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";

/** One conversation. Convex refuses anyone who is not a participant. */
export async function ThreadPage({ id, basePath }: { id: string; basePath: string }) {
  const data = await query(api.messages.getThread, { id });
  if (!data) notFound();
  const { thread, names, me } = data;
  const nameOf = (uid: string) => names[uid] ?? "School Staff";
  const others = thread.participantIds.filter((pid) => pid !== me);

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href={basePath} />}>
        <ArrowLeftIcon />
        All messages
      </Button>

      <PortalPageHeader
        eyebrow={others.map(nameOf).join(", ")}
        title={thread.subject}
        description={thread.studentName ? `About ${thread.studentName}` : undefined}
      />

      <Card className="gap-0 p-5 sm:p-6">
        <MessageThreadView
          threadId={thread.id}
          currentUserId={me}
          messages={thread.messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: nameOf(m.senderId),
            body: m.body,
            sentAt: m.sentAt,
          }))}
        />
      </Card>
    </>
  );
}
