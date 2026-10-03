import type { Metadata } from "next";
import { MailIcon } from "lucide-react";

import { StatCard, StatusPill } from "@/components/common";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { NotificationsScreen } from "@/components/portal/notifications-screen";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { sendTestEmail } from "@/lib/school/actions/operations";
import { requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { EMAILED_TYPES } from "@/lib/school/email-notifications";
import { formatDateTime } from "@/lib/school/format";

export const metadata: Metadata = { title: "Notifications" };

const TONE = { sent: "success", failed: "danger", queued: "info", skipped: "neutral" } as const;

export default async function AdminNotificationsPage() {
  await requireAdmin();
  const log = await query(api.delivery.adminLog, {});

  return (
    <NotificationsScreen showEmailNote={false}>
      <Card className="mb-8 gap-0 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-extrabold">Email notifications</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Every notice appears in the portal. Parents and staff are also emailed (through Resend) about:{" "}
              {Object.values(EMAILED_TYPES).join(", ").toLowerCase()}. Pupils are never emailed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill tone={log.configured ? "success" : "warning"}>{log.configured ? "Resend connected" : "Not configured"}</StatusPill>
            {log.configured ? (
              <ConfirmAction action={sendTestEmail} icon={<MailIcon />} pendingText="Sending…">
                Send me a test
              </ConfirmAction>
            ) : null}
          </div>
        </div>
        {!log.configured ? (
          <p className="mt-3 rounded-xl bg-muted/70 p-3.5 text-xs leading-relaxed text-muted-foreground">
            Set RESEND_API_KEY and RESEND_FROM (a sender on a domain verified in Resend) in the Convex dashboard under Settings → Environment
            Variables. Until then, notices stay in the portal only.
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <StatCard label="Emails sent (recent)" value={log.totals.sent} icon="Mail" tone="success" />
          <StatCard label="Failed" value={log.totals.failed} icon="CircleAlert" tone={log.totals.failed > 0 ? "danger" : "neutral"} />
          <StatCard label="Waiting to send" value={log.totals.queued} icon="Clock" tone="info" />
        </div>

        {log.recent.length > 0 ? (
          <>
            <Separator className="my-5" />
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {log.recent.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(d.createdAt)}</TableCell>
                      <TableCell>
                        <span className="font-semibold">{d.userName}</span>
                        <span className="block text-xs text-muted-foreground">{d.to}</span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">{d.title}</TableCell>
                      <TableCell>
                        <StatusPill tone={TONE[d.status]}>{d.status}</StatusPill>
                        {d.detail ? <span className="block max-w-52 truncate text-xs text-muted-foreground">{d.detail}</span> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : null}
      </Card>
    </NotificationsScreen>
  );
}
