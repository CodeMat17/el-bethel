import Link from "next/link";
import type { Metadata } from "next";

import { EmptyState, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { requireTeacher } from "@/lib/school/auth";
import { getStudent, getThreadsForUser, studentName, userDisplayName } from "@/lib/school/data";
import { avatarTone, initials, relativeTime } from "@/lib/school/format";
import { DEMO_TODAY } from "@/lib/school/seed";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

export default async function TeacherMessagesPage() {
  const user = await requireTeacher();
  const threads = getThreadsForUser(user.id);

  return (
    <>
      <PortalPageHeader
        title="Messages"
        description="Conversations with parents and school staff. Every message is kept on the child's record."
      />

      {threads.length === 0 ? (
        <EmptyState
          icon="MessagesSquare"
          title="No messages yet"
          description="Conversations started by a parent or by you will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => {
            const last = thread.messages[thread.messages.length - 1];
            const unread = thread.messages.some((m) => !m.readBy.includes(user.id));
            const others = thread.participantIds.filter((id) => id !== user.id);
            const child = thread.studentId ? getStudent(thread.studentId) : null;

            return (
              <li key={thread.id}>
                <Link href={`/portal/teacher/messages/${thread.id}`} className="block">
                  <Card className={cn("gap-0 p-4 transition-colors hover:border-gold/40", unread && "border-gold/40 bg-gold/8")}>
                    <div className="flex items-start gap-3">
                      <Avatar className="size-11 shrink-0">
                        <AvatarFallback className={cn("text-xs font-bold", avatarTone(userDisplayName(others[0] ?? "")))}>
                          {initials(...userDisplayName(others[0] ?? "").replace(/^(Mrs|Mr|Miss|Dr|Mme)\.?\s/, "").split(" "))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-sm font-extrabold">{thread.subject}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {relativeTime(thread.updatedAt, DEMO_TODAY)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">
                          {others.map((id) => userDisplayName(id)).join(", ")}
                          {child ? ` · about ${studentName(child)}` : ""}
                        </p>
                        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{last?.body}</p>
                      </div>
                      {unread ? <StatusPill tone="gold">New</StatusPill> : null}
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
