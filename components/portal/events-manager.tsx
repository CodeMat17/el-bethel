import Link from "next/link";
import { ArrowRightIcon, ExternalLinkIcon, TrashIcon } from "lucide-react";

import { EventDialog } from "@/components/admin/content-dialogs";
import { ConfirmAction } from "@/components/portal/confirm-action";

import { StatCard, StatusPill } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { removeEvent } from "@/lib/school/actions/admin";
import { academicCalendar } from "@/lib/school/calendar";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";
import { formatDate } from "@/lib/school/format";

const CATEGORY_TONE = {
  academic: "info",
  sports: "success",
  cultural: "gold",
  parents: "neutral",
  holiday: "warning",
  assessment: "danger",
  alumni: "gold",
} as const;

/**
 * The events table and term overview shared by the admin and Site portals.
 * Both can add, edit and delete events; term dates are edited under Sessions & terms.
 */
export async function EventsManager({ termsHref }: { termsHref?: string }) {
  const [events, dir] = await Promise.all([query(api.content.events, {}), getDirectory()]);
  const { blocks: calendar } = academicCalendar(dir.sessions, dir.terms);
  const now = new Date();
  const upcoming = events.filter((e) => e.status === "upcoming");

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Events" value={events.length} icon="CalendarDays" tone="info" />
        <StatCard label="Upcoming" value={upcoming.length} icon="Clock" tone="gold" />
        <StatCard
          label="Requiring registration"
          value={events.filter((e) => e.requiresRegistration).length}
          icon="ClipboardCheck"
          tone="neutral"
        />
        <StatCard label="Calendar blocks" value={calendar.length} icon="CalendarRange" tone="neutral" />
      </div>

      <Card className="mb-6 gap-0 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-base font-extrabold">Term structure</h2>
          {termsHref ? (
            <Button variant="link" size="sm" className="font-bold" render={<Link href={termsHref} />}>
              Edit term dates <ArrowRightIcon />
            </Button>
          ) : null}
        </div>
        <Separator className="my-5" />
        <div className="grid gap-3 sm:grid-cols-3">
          {calendar.map((block) => {
            const current = now >= new Date(`${block.start}T00:00:00Z`) && now <= new Date(`${block.end}T23:59:59Z`);
            return (
              <div
                key={block.name}
                className={`rounded-xl border p-4 ${current ? "border-gold/50 bg-gold/10" : "bg-card"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-extrabold">{block.name}</p>
                  {current ? <StatusPill tone="gold">Now</StatusPill> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(block.start)} — {formatDate(block.end)}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Registration</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-bold">{event.title}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(event.date)}
                  {event.endDate ? ` — ${formatDate(event.endDate)}` : ""}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {event.startTime}–{event.endTime}
                </TableCell>
                <TableCell className="max-w-56 truncate text-muted-foreground">{event.venue}</TableCell>
                <TableCell>
                  <StatusPill tone={CATEGORY_TONE[event.category]} dot={false}>
                    {event.category}
                  </StatusPill>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {event.requiresRegistration ? "Required" : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <StatusPill tone={event.status === "upcoming" ? "success" : event.status === "cancelled" ? "danger" : "neutral"}>
                    {event.status}
                  </StatusPill>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <EventDialog event={event} />
                    <Button variant="ghost" size="sm" className="font-bold" render={<Link href={`/school-life/events/${event.slug}`} />}>
                      <ExternalLinkIcon />
                      View
                    </Button>
                    <ConfirmAction
                      action={removeEvent.bind(null, event.id)}
                      icon={<TrashIcon />}
                      variant="ghost"
                      className="font-bold text-destructive"
                      pendingText="Deleting…"
                      destructive
                      confirm={{ title: "Delete this event?", description: "It will be removed from the calendar.", confirmLabel: "Delete" }}
                    >
                      Delete
                    </ConfirmAction>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
