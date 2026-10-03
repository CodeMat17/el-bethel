import type { Metadata } from "next";
import { MegaphoneIcon, TrashIcon, TriangleAlertIcon } from "lucide-react";

import { NoticeDialog } from "@/components/admin/content-dialogs";
import { ConfirmAction } from "@/components/portal/confirm-action";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAdmin } from "@/lib/school/auth";
import { formatDateTime } from "@/lib/school/format";
import { api } from "@/convex/_generated/api";
import { removeNotice } from "@/lib/school/actions/admin";
import { query } from "@/lib/school/convex";

export const metadata: Metadata = { title: "Emergency notices" };

export default async function AdminNoticesPage() {
  await requireAdmin();
  const notices = await query(api.content.adminNotices, {});
  const now = new Date();
  const active = notices.filter(
    (n) => n.active && new Date(n.startsAt) <= now && new Date(n.endsAt) >= now,
  );

  return (
    <>
      <PortalPageHeader
        title="Emergency notices"
        description="High-visibility notices shown as a banner across the website while they are active."
        action={<NoticeDialog />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Notices on record" value={notices.length} icon="Megaphone" tone="neutral" />
        <StatCard
          label="Currently showing"
          value={active.length}
          icon="TriangleAlert"
          tone={active.length > 0 ? "warning" : "success"}
        />
        <StatCard label="Notices on record" value={notices.length} icon="Megaphone" tone="info" />
      </div>

      {notices.length === 0 ? (
        <EmptyState
          icon="Megaphone"
          title="No notices published"
          description="Emergency notices appear here once published. Use them sparingly, so they keep their weight."
        />
      ) : (
        <ul className="space-y-3">
          {notices.map((notice) => {
            const live =
              notice.active &&
              new Date(notice.startsAt) <= now &&
              new Date(notice.endsAt) >= now;
            return (
              <li key={notice.id}>
                <Card className={`gap-0 p-5 ${live ? "border-destructive/40 bg-destructive/8" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="flex items-center gap-2 font-heading text-base font-extrabold">
                        {live ? <TriangleAlertIcon className="size-4 text-destructive" /> : <MegaphoneIcon className="size-4 text-muted-foreground" />}
                        {notice.title}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed">{notice.body}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <StatusPill tone={live ? "danger" : "neutral"}>{live ? "Live" : "Scheduled or expired"}</StatusPill>
                      <Badge variant="secondary" className="font-bold capitalize">{notice.priority}</Badge>
                      <Badge variant="outline" className="font-bold capitalize">{notice.audience}</Badge>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Shows from {formatDateTime(notice.startsAt)} until {formatDateTime(notice.endsAt)}
                    </p>
                    <div className="flex gap-1">
                      <NoticeDialog notice={notice} />
                      <ConfirmAction
                        action={removeNotice.bind(null, notice.id)}
                        icon={<TrashIcon />}
                        variant="ghost"
                        className="font-bold text-destructive"
                        pendingText="Deleting…"
                        destructive
                        confirm={{ title: "Delete this notice?", description: "It will disappear from the website straight away.", confirmLabel: "Delete" }}
                      >
                        Delete
                      </ConfirmAction>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

    </>
  );
}
