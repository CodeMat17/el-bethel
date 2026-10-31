import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CalendarDaysIcon, ClockIcon, MapPinIcon, TicketIcon } from "lucide-react";

import { CtaBand, StatusPill } from "@/components/common";
import { ToneImage } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { DatedGroup, DatedItem, WhenDated } from "@/components/site/dated";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SITE_URL } from "@/lib/school/config";
import { jsonLd, pageMetadata, shareImage } from "@/lib/school/seo";
import { getSchool } from "@/lib/school/site-content";
import { getAllEvents, getEventBySlug, getUpcomingEvents } from "@/lib/school/site-data";
import { eventEnd, formatLongDate, todayISO } from "@/lib/school/format";

const CATEGORY_TONE = {
  academic: "info",
  sports: "success",
  cultural: "gold",
  parents: "neutral",
  holiday: "warning",
  assessment: "danger",
  alumni: "gold",
} as const;

export async function generateStaticParams() {
  return (await getAllEvents()).map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: PageProps<"/school-life/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return pageMetadata({
    title: event.status === "cancelled" ? `Cancelled: ${event.title}` : event.title,
    description: event.description,
    path: `/school-life/events/${event.slug}`,
    image: event.cover,
  });
}

export default async function EventPage({ params }: PageProps<"/school-life/events/[slug]">) {
  const SCHOOL = await getSchool();
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  // The browser drops events that end after this page was built (see DatedGroup).
  const related = (await getUpcomingEvents()).filter((e) => e.slug !== event.slug);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: `${event.date}T${event.startTime}:00+01:00`,
    endDate: `${event.endDate ?? event.date}T${event.endTime}:00+01:00`,
    image: [shareImage(event.cover, event.title).url],
    eventStatus: event.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: { "@type": "PostalAddress", streetAddress: SCHOOL.address, addressLocality: SCHOOL.city, addressCountry: "NG" },
    },
    organizer: { "@type": "Organization", name: SCHOOL.name, url: SITE_URL },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />

      <article>
        <div className="relative">
          <ToneImage tone="navy" seed={event.slug} media={event.cover} label={event.title} className="h-56 w-full sm:h-72 lg:h-96" />
          <div className="absolute inset-0 bg-linear-to-t from-navy via-navy/60 to-transparent" />
          <div className="eb-container absolute inset-x-0 bottom-0 pb-8 sm:pb-12">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 font-bold text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"
              render={<Link href="/school-life/events" />}
            >
              <ArrowLeftIcon />
              All events
            </Button>
            <StatusPill tone={CATEGORY_TONE[event.category]} className="bg-navy-foreground/10 ring-navy-foreground/20">
              {event.category}
            </StatusPill>
            <h1 className="mt-3 max-w-3xl text-balance font-heading text-3xl leading-tight text-navy-foreground sm:text-4xl lg:text-5xl">
              {event.title}
            </h1>
          </div>
        </div>

        <section className="eb-section">
          <div className="eb-container grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <p className="text-pretty text-lg leading-relaxed">{event.description}</p>
              <Separator className="my-8" />
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  All parents and guardians are warmly invited. Gates open thirty minutes before the
                  advertised start time, and seating is unreserved.
                </p>
                <p>
                  If your child requires any specific support to take part, please contact your class
                  teacher through the Parent Portal so that we can plan for it in advance.
                </p>
                <p>
                  Photography by families is welcome, but we ask that photographs including other
                  people&apos;s children are not shared publicly, in line with our child protection policy.
                </p>
              </div>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              <Card className="gap-0 p-6">
                <h2 className="font-heading text-base font-extrabold">Event details</h2>
                <Separator className="my-4" />
                <dl className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <CalendarDaysIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                    <div>
                      <dt className="text-xs font-bold text-muted-foreground uppercase">Date</dt>
                      <dd className="mt-0.5 font-semibold">
                        {formatLongDate(event.date)}
                        {event.endDate ? ` – ${formatLongDate(event.endDate)}` : ""}
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <ClockIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                    <div>
                      <dt className="text-xs font-bold text-muted-foreground uppercase">Time</dt>
                      <dd className="mt-0.5 font-semibold">{event.startTime} – {event.endTime}</dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MapPinIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                    <div>
                      <dt className="text-xs font-bold text-muted-foreground uppercase">Venue</dt>
                      <dd className="mt-0.5 font-semibold">{event.venue}</dd>
                    </div>
                  </div>
                  {event.requiresRegistration ? (
                    <div className="flex gap-3">
                      <TicketIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                      <div>
                        <dt className="text-xs font-bold text-muted-foreground uppercase">Registration</dt>
                        <dd className="mt-0.5 font-semibold">Required — register with the school office</dd>
                      </div>
                    </div>
                  ) : null}
                </dl>
                {event.requiresRegistration ? (
                  <Button className="mt-6 w-full font-bold" size="lg" render={<Link href="/contact" />}>
                    Contact the school office
                  </Button>
                ) : null}
              </Card>

              {related.length > 0 ? (
                <DatedGroup asOf={todayISO()} ends={related.map(eventEnd)} limit={3}>
                  <WhenDated>
                    <Card className="gap-0 p-6">
                      <h2 className="font-heading text-base font-extrabold">Also coming up</h2>
                      <Separator className="my-4" />
                      <ul className="space-y-3">
                        {related.map((item, i) => (
                          <DatedItem key={item.id} index={i}>
                            <li>
                              <Link
                                href={`/school-life/events/${item.slug}`}
                                className="block text-sm font-semibold transition-colors hover:text-primary dark:hover:text-gold"
                              >
                                {item.title}
                                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                                  {formatLongDate(item.date)}
                                </span>
                              </Link>
                            </li>
                          </DatedItem>
                        ))}
                      </ul>
                    </Card>
                  </WhenDated>
                </DatedGroup>
              ) : null}
            </aside>
          </div>
        </section>
      </article>

      <CtaBand />
    </>
  );
}
