import Link from "next/link";

import { EmptyState, StatusPill } from "@/components/common";
import { NewMessageDialog } from "@/components/portal/new-message-dialog";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";
import { avatarTone, initials, relativeTime } from "@/lib/school/format";
import type { SessionUser } from "@/lib/school/types";
import { cn } from "@/lib/utils";

/** Shared inbox for the teacher and parent portals. Convex returns only the viewer's own threads. */
export async function MessagesInbox({
  user,
  basePath,
  description,
  emptyText,
  emptyAction,
}: {
  user: SessionUser;
  basePath: string;
  description: string;
  emptyText: string;
  emptyAction?: React.ReactNode;
}) {
  const [{ threads, names }, contacts] = await Promise.all([
    query(api.messages.myThreads, {}),
    query(api.messages.contacts, {}),
  ]);
  const nameOf = (id: string) => names[id] ?? "School Staff";

  return (
    <>
      <PortalPageHeader
        title="Messages"
        description={description}
        action={
          contacts.length > 0 ? (
            <NewMessageDialog
              basePath={basePath}
              contacts={contacts.map((c) => ({ userId: c.userId, name: c.name, label: c.label, studentId: c.studentId }))}
            />
          ) : null
        }
      />

      {threads.length === 0 ? (
        <EmptyState icon="MessagesSquare" title="No messages yet" description={emptyText} action={emptyAction} />
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => {
            const last = thread.messages[thread.messages.length - 1];
            const unread = thread.messages.some((m) => !m.readBy.includes(user.id));
            const others = thread.participantIds.filter((id) => id !== user.id);
            const firstOther = nameOf(others[0] ?? "");
            return (
              <li key={thread.id}>
                <Link href={`${basePath}/${thread.id}`} className="block">
                  <Card className={cn("gap-0 p-4 transition-colors hover:border-gold/40", unread && "border-gold/40 bg-gold/8")}>
                    <div className="flex items-start gap-3">
                      <Avatar className="size-11 shrink-0">
                        <AvatarFallback className={cn("text-xs font-bold", avatarTone(firstOther))}>
                          {initials(...firstOther.replace(/^(Mrs|Mr|Miss|Dr|Mme)\.?\s/, "").split(" "))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-sm font-extrabold">{thread.subject}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(thread.updatedAt)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">
                          {others.map(nameOf).join(", ")}
                          {thread.studentName ? ` · about ${thread.studentName}` : ""}
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
