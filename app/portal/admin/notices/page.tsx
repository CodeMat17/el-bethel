import type { Metadata } from "next";
import { MegaphoneIcon, PlusIcon, TriangleAlertIcon } from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAdmin } from "@/lib/school/auth";
import { formatDateTime } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";
import { DEMO_TODAY } from "@/lib/school/seed";

export const metadata: Metadata = { title: "Emergency notices" };

const CHANNELS = [
  { name: "In-app banner", detail: "Shown at the top of every page on the public site and in the portals." },
  { name: "Email", detail: "Sent to every address in the chosen audience within minutes." },
  { name: "SMS", detail: "Sent through a Nigerian SMS provider for critical notices only." },
  { name: "Push notification", detail: "Delivered to families who have installed the app to their home screen." },
];

export default async function AdminNoticesPage() {
  await requireAdmin();
  const db = getDb();
  const notices = db.emergencyNotices;
  const active = notices.filter(
    (n) => n.active && new Date(n.startsAt) <= DEMO_TODAY && new Date(n.endsAt) >= DEMO_TODAY,
  );

  return (
    <>
      <PortalPageHeader
        title="Emergency notices"
        description="High-visibility notices shown across the website and portals, with a defined audience and window."
        action={
          <Button size="lg" className="font-bold" disabled>
            <PlusIcon />
            Publish notice
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Notices on record" value={notices.length} icon="Megaphone" tone="neutral" />
        <StatCard
          label="Currently showing"
          value={active.length}
          icon="TriangleAlert"
          tone={active.length > 0 ? "warning" : "success"}
        />
        <StatCard label="Delivery channels" value={CHANNELS.length} icon="Send" tone="info" />
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
              new Date(notice.startsAt) <= DEMO_TODAY &&
              new Date(notice.endsAt) >= DEMO_TODAY;
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

                  <p className="text-xs text-muted-foreground">
                    Shows from {formatDateTime(notice.startsAt)} until {formatDateTime(notice.endsAt)}
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Card className="mt-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Delivery channels</h2>
        <Separator className="my-5" />
        <ul className="grid gap-3 sm:grid-cols-2">
          {CHANNELS.map((channel) => (
            <li key={channel.name} className="rounded-xl border bg-card p-4">
              <p className="text-sm font-extrabold">{channel.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{channel.detail}</p>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
