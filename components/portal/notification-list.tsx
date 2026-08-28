import Link from "next/link";
import { CheckCheckIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/school/actions/portal";
import { relativeTime } from "@/lib/school/format";
import { DEMO_TODAY } from "@/lib/school/seed";
import type { AppNotification, NotificationType } from "@/lib/school/types";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<NotificationType, string> = {
  assignment_published: "ClipboardList",
  assignment_due: "Clock",
  assignment_graded: "Trophy",
  attendance_alert: "CalendarX",
  result_published: "ChartColumn",
  fee_reminder: "Receipt",
  payment_confirmation: "CircleCheck",
  admission_update: "FileCheck",
  announcement: "Megaphone",
  event_reminder: "CalendarDays",
  message: "MessagesSquare",
  appointment: "CalendarPlus",
};

export function NotificationList({ notifications }: { notifications: AppNotification[] }) {
  const unread = notifications.filter((n) => !n.read).length;

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon="Bell"
        title="You're up to date"
        description="New notifications will appear here."
      />
    );
  }

  return (
    <div>
      {unread > 0 ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-muted-foreground">
            {unread} unread notification{unread === 1 ? "" : "s"}
          </p>
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="outline" size="sm" className="font-bold">
              <CheckCheckIcon />
              Mark all as read
            </Button>
          </form>
        </div>
      ) : null}

      <ul className="space-y-2">
        {notifications.map((n) => (
          <li key={n.id}>
            <Card
              className={cn(
                "gap-0 p-4 transition-colors",
                n.read ? "" : "border-gold/40 bg-gold/8",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl",
                    n.read ? "bg-muted text-muted-foreground" : "bg-gold/20 text-gold-foreground dark:text-gold",
                  )}
                >
                  <Icon name={TYPE_ICON[n.type]} className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">{n.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(n.createdAt, DEMO_TODAY)}
                    </span>
                    {n.href ? (
                      <Link
                        href={n.href}
                        className="text-xs font-bold text-primary underline-offset-4 hover:underline dark:text-gold"
                      >
                        Open
                      </Link>
                    ) : null}
                    {!n.read ? (
                      <form action={markNotificationRead}>
                        <input type="hidden" name="id" value={n.id} />
                        <button
                          type="submit"
                          className="text-xs font-bold text-muted-foreground underline-offset-4 hover:underline"
                        >
                          Mark as read
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
