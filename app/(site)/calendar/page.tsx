import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, MapPinIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading, StatusPill } from "@/components/common";
import { Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ACADEMIC_CALENDAR, SCHOOL } from "@/lib/school/config";
import { getAllEvents } from "@/lib/school/site-data";
import { formatDate, formatLongDate } from "@/lib/school/format";
import { DEMO_TODAY } from "@/lib/school/seed";

export const metadata: Metadata = {
  title: "School Calendar",
  description:
    "Term dates, breaks, examinations and key events for the 2026/2027 academic session at El-Bethel International Academy, Abuja.",
  alternates: { canonical: "/calendar" },
};

const CATEGORY_TONE = {
  academic: "info",
  sports: "success",
  cultural: "gold",
  parents: "neutral",
  holiday: "warning",
  assessment: "danger",
  alumni: "gold",
} as const;

export default async function CalendarPage() {
  const events = await getAllEvents();
  const months = events.reduce<Record<string, typeof events>>((acc, event) => {
    const key = new Date(event.date).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    (acc[key] ??= []).push(event);
    return acc;
  }, {});

  return (
    <>
      <PageHero
        eyebrow={`${SCHOOL.session} session`}
        title="School Calendar"
        lede="Term dates, breaks, examination windows and every event in the school year — all in one place."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Calendar", href: "/calendar" }]}
      />

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading eyebrow="Terms and breaks" title="How the year is divided" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ACADEMIC_CALENDAR.map((block, i) => {
              const start = new Date(block.start);
              const end = new Date(block.end);
              const current = DEMO_TODAY >= start && DEMO_TODAY <= end;
              return (
                <Reveal key={block.name} delay={i * 0.04}>
                  <Card
                    className={`h-full gap-0 p-6 ${
                      current ? "border-gold/50 bg-gold/10 shadow-md" : block.type === "term" ? "" : "opacity-80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-heading text-base font-extrabold">{block.name}</h3>
                      {current ? <StatusPill tone="gold">Current</StatusPill> : null}
                    </div>
                    <p className="mt-3 text-sm font-semibold">{formatDate(block.start)}</p>
                    <p className="text-sm text-muted-foreground">to {formatDate(block.end)}</p>
                    <p className="mt-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      {block.type === "term" ? "Teaching term" : "School closed"}
                    </p>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="eb-section border-t bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Events"
            title="Key dates, month by month"
            action={
              <Button variant="outline" size="lg" className="font-bold" render={<Link href="/school-life/events" />}>
                Event details
                <ArrowRightIcon />
              </Button>
            }
          />
          <div className="mt-10 space-y-10">
            {Object.entries(months).map(([month, list]) => (
              <div key={month}>
                <h3 className="font-heading text-lg font-extrabold text-gold-foreground dark:text-gold">{month}</h3>
                <ul className="mt-4 space-y-2.5">
                  {list.map((event) => (
                    <li key={event.id}>
                      <Link href={`/school-life/events/${event.slug}`} className="group block">
                        <Card className="flex flex-col gap-3 p-4 transition-colors group-hover:border-gold/40 sm:flex-row sm:items-center">
                          <div className="flex w-full items-center gap-4 sm:w-56 sm:shrink-0">
                            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-navy text-navy-foreground">
                              <span className="font-heading text-sm leading-none font-extrabold text-gold">
                                {new Date(event.date).getUTCDate()}
                              </span>
                              <span className="text-[0.58rem] font-bold uppercase">
                                {new Date(event.date).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {event.startTime}–{event.endTime}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-heading text-sm font-extrabold">{event.title}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPinIcon className="size-3.5 shrink-0" /> {event.venue}
                            </p>
                          </div>
                          <StatusPill tone={CATEGORY_TONE[event.category]} dot={false} className="w-fit shrink-0">
                            {event.category}
                          </StatusPill>
                        </Card>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="eb-section">
        <div className="eb-container max-w-3xl">
          <Card className="gap-0 border-info/30 bg-info/10 p-6">
            <h2 className="font-heading text-base font-extrabold">Today</h2>
            <p className="mt-2 text-sm leading-relaxed">
              {formatLongDate(DEMO_TODAY)} — First Term is in progress. Signed-in parents and pupils see
              their own class timetable and personalised calendar in the portals.
            </p>
          </Card>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
