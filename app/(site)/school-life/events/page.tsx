import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, ClockIcon, MapPinIcon } from "lucide-react";

import { CtaBand, EmptyState, PageHero, SectionHeading, StatusPill } from "@/components/common";
import { Reveal, ToneImage } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { DatedCount, DatedGroup, DatedItem, WhenDated, WhenNotDated } from "@/components/site/dated";
import { Card, CardContent } from "@/components/ui/card";
import { getAllEvents } from "@/lib/school/site-data";
import { eventEnd, formatDate, todayISO } from "@/lib/school/format";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming and past events at El-Bethel International Academy, Abuja — sports day, cultural day, open days, excursions and examinations.",
  alternates: { canonical: "/school-life/events" },
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

const TONES = ["navy", "gold", "info", "success", "plum"];

export default async function EventsPage() {
  const all = await getAllEvents();
  // Events move from upcoming to past as days go by; the browser does that (see DatedGroup).
  const asOf = todayISO();
  const upcoming = all.filter((e) => e.status === "upcoming");
  const past = all.filter((e) => e.status !== "cancelled").reverse();

  return (
    <>
      <PageHero
        eyebrow="School life"
        title="Events"
        lede="Sports festivals, cultural days, open days, excursions and the everyday milestones of a school year."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "School Life", href: "/school-life" },
          { label: "Events", href: "/school-life/events" },
        ]}
      >
        <Button
          size="lg"
          variant="outline"
          className="h-11 border-navy-foreground/25 bg-transparent font-bold text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"
          render={<Link href="/calendar" />}
        >
          View the full school calendar
          <ArrowRightIcon />
        </Button>
      </PageHero>

      <DatedGroup asOf={asOf} ends={upcoming.map(eventEnd)}>
        <section className="eb-section">
          <div className="eb-container">
            <SectionHeading eyebrow="Upcoming" title={<><DatedCount /> events coming up</>} />
            <WhenNotDated>
              <EmptyState
                className="mt-10"
                icon="CalendarDays"
                title="No events are scheduled right now"
                description="Check back soon, or view the school calendar for term dates and holidays."
              />
            </WhenNotDated>
            <WhenDated>
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((event, i) => (
                  <DatedItem key={event.id} index={i}>
                    <Reveal delay={i * 0.04}>
                      <Link href={`/school-life/events/${event.slug}`} className="group block h-full">
                        <Card className="h-full gap-0 overflow-hidden p-0 transition-all group-hover:-translate-y-1 group-hover:shadow-lg">
                          <div className="relative">
                            <ToneImage tone={TONES[i % TONES.length]} seed={event.slug} media={event.cover} label={event.title} className="aspect-16/9" />
                            <div className="absolute top-3 left-3 grid size-14 place-items-center rounded-xl bg-background/92 backdrop-blur">
                              <span className="font-heading text-lg leading-none font-extrabold">
                                {new Date(event.date).getUTCDate()}
                              </span>
                              <span className="text-[0.6rem] font-bold uppercase">
                                {new Date(event.date).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
                              </span>
                            </div>
                          </div>
                          <CardContent className="p-5">
                            <StatusPill tone={CATEGORY_TONE[event.category]} dot={false}>
                              {event.category}
                            </StatusPill>
                            <h2 className="mt-3 font-heading text-base leading-snug font-extrabold group-hover:text-primary dark:group-hover:text-gold">
                              {event.title}
                            </h2>
                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                              {event.description}
                            </p>
                            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                              <p className="flex items-center gap-1.5">
                                <ClockIcon className="size-3.5 shrink-0" />
                                {formatDate(event.date)} · {event.startTime}–{event.endTime}
                              </p>
                              <p className="flex items-center gap-1.5">
                                <MapPinIcon className="size-3.5 shrink-0" />
                                {event.venue}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </Reveal>
                  </DatedItem>
                ))}
              </div>
            </WhenDated>
          </div>
        </section>
      </DatedGroup>

      <DatedGroup asOf={asOf} ends={past.map(eventEnd)} mode="past">
        <WhenDated>
          <section className="eb-section border-t bg-muted/40">
            <div className="eb-container">
              <SectionHeading eyebrow="Archive" title="Earlier this session" />
              <ul className="mt-10 grid gap-3 sm:grid-cols-2">
                {past.map((event, i) => (
                  <DatedItem key={event.id} index={i}>
                    <li>
                      <Link href={`/school-life/events/${event.slug}`} className="group block">
                        <Card className="flex flex-row items-center gap-4 p-4 transition-colors group-hover:border-gold/40">
                          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted">
                            <span className="font-heading text-sm leading-none font-extrabold">
                              {new Date(event.date).getUTCDate()}
                            </span>
                            <span className="text-[0.6rem] font-bold uppercase">
                              {new Date(event.date).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-heading text-sm font-extrabold">{event.title}</h3>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{event.venue}</p>
                          </div>
                        </Card>
                      </Link>
                    </li>
                  </DatedItem>
                ))}
              </ul>
            </div>
          </section>
        </WhenDated>
      </DatedGroup>

      <CtaBand />
    </>
  );
}
