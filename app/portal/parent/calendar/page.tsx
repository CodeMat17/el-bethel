import type { Metadata } from "next";
import { MapPinIcon } from "lucide-react";

import { StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireParent } from "@/lib/school/auth";
import { ACADEMIC_CALENDAR } from "@/lib/school/config";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";
import { formatDate, formatLongDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "School calendar" };

const CATEGORY_TONE = {
  academic: "info",
  sports: "success",
  cultural: "gold",
  parents: "neutral",
  holiday: "warning",
  assessment: "danger",
  alumni: "gold",
} as const;

export default async function ParentCalendarPage() {
  await requireParent();
  const events = await query(api.content.events, {});
  const upcoming = events.filter((e) => e.status === "upcoming");

  return (
    <>
      <PortalPageHeader
        eyebrow={formatLongDate(new Date())}
        title="School calendar"
        description="Term dates, breaks, examinations and every event in the school year."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Upcoming events</h2>
          <Separator className="my-4" />
          <ul className="space-y-2.5">
            {upcoming.map((event) => (
              <li key={event.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
                <div className="flex w-full items-center gap-4 sm:w-44 sm:shrink-0">
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-navy text-navy-foreground">
                    <span className="font-heading text-sm leading-none font-extrabold text-gold">
                      {new Date(event.date).getUTCDate()}
                    </span>
                    <span className="text-[0.58rem] font-bold uppercase">
                      {new Date(event.date).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
                    </span>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {event.startTime}–{event.endTime}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-extrabold">{event.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPinIcon className="size-3.5 shrink-0" /> {event.venue}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <StatusPill tone={CATEGORY_TONE[event.category]} dot={false}>
                    {event.category}
                  </StatusPill>
                  {event.requiresRegistration ? (
                    <StatusPill tone="warning">Registration required</StatusPill>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Terms and breaks</h2>
          <Separator className="my-4" />
          <ul className="space-y-2.5">
            {ACADEMIC_CALENDAR.map((block) => {
              const current = new Date() >= new Date(block.start) && new Date() <= new Date(block.end);
              return (
                <li
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
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
