import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, MapPinIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Icon } from "@/components/icon";
import { Reveal, ToneImage } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getContent } from "@/lib/school/site-content";
import { slugify } from "@/lib/utils";
import { getClubs, getGallery, getUpcomingEvents } from "@/lib/school/site-data";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = {
  title: "School Life",
  description:
    "Clubs, sports, library, facilities, events and gallery — life beyond the classroom at El-Bethel International Academy, Abuja.",
  alternates: { canonical: "/school-life" },
};

export default async function SchoolLifePage() {
  const [clubs, upcoming, allGallery, page] = await Promise.all([getClubs(), getUpcomingEvents(), getGallery(), getContent("schoolLife")]);
  const { hero, sports, library, facilities, cta } = page;
  const jumpLinks = [
    { label: "Clubs", href: "#clubs", show: page.clubs.visible && clubs.length > 0 },
    { label: "Sports", href: "#sports", show: sports.visible },
    { label: "Library", href: "#library", show: library.visible },
    { label: "Facilities", href: "#facilities", show: facilities.visible },
    { label: "Events", href: "#events", show: page.events.visible && upcoming.length > 0 },
    { label: "Gallery", href: "#gallery", show: page.gallery.visible && allGallery.length > 0 },
  ].filter((l) => l.show);
  const events = upcoming.slice(0, 4);
  const gallery = allGallery.slice(0, 6);

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        lede={hero.lede}
        breadcrumb={[{ label: "Home", href: "/" }, { label: "School Life", href: "/school-life" }]}
      />

      <nav aria-label="On this page" className="border-b bg-muted/40 py-4">
        <div className="eb-container flex flex-wrap gap-2">
          {jumpLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full border bg-card px-3.5 py-1.5 text-xs font-bold transition-colors hover:border-gold/50 hover:bg-accent"
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      {page.clubs.visible && clubs.length ? (
      <section id="clubs" className="eb-section scroll-mt-24">
        <div className="eb-container">
          <SectionHeading eyebrow={page.clubs.eyebrow} title={page.clubs.title} lede={page.clubs.lede} />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club, i) => (
              <Reveal key={club.id} delay={i * 0.02}>
                <Card className="h-full gap-1 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-heading text-base font-extrabold">{club.name}</h3>
                    <Badge variant="secondary" className="shrink-0 font-bold">{club.memberCount}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{club.description}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {sports.visible ? (
      <section id="sports" className="eb-section scroll-mt-24 border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading eyebrow={sports.eyebrow} title={sports.title} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sports.items.map((sport, i) => (
              <Reveal key={`${sport.title}-${i}`} delay={i * 0.04}>
                <Card className="flex h-full flex-row gap-4 p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy text-gold">
                    <Icon name={sport.icon} className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-heading text-base font-extrabold">{sport.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{sport.text}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
          {sports.houses.length ? (
          <>
          <h3 className="mt-12 font-heading text-lg font-extrabold">{sports.housesTitle}</h3>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {sports.houses.map((house, i) => (
              <Card key={`${house.name}-${i}`} className="gap-0 p-5">
                <p className="font-heading text-base font-extrabold">{house.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{house.motto}</p>
              </Card>
            ))}
          </div>
          </>
          ) : null}
        </div>
      </section>
      ) : null}

      {library.visible ? (
      <section id="library" className="eb-section scroll-mt-24">
        <div className="eb-container">
          <SectionHeading eyebrow={library.eyebrow} title={library.title} lede={library.lede} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {library.items.map((item, i) => (
              <Reveal key={`${item.title}-${i}`} delay={i * 0.04}>
                <Card className="h-full gap-0 p-6">
                  <h3 className="font-heading text-base font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {facilities.visible ? (
      <section id="facilities" className="eb-section scroll-mt-24 border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading eyebrow={facilities.eyebrow} title={facilities.title} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.items.map((facility, i) => (
              <Reveal key={`${facility.name}-${i}`} delay={i * 0.02}>
                <Card id={slugify(facility.name)} className="h-full scroll-mt-24 gap-0 overflow-hidden p-0">
                  <ToneImage
                    tone={["navy", "gold", "info", "success", "plum"][i % 5]}
                    seed={slugify(facility.name)}
                    media={facility.image ?? undefined}
                    label={facility.name}
                    className="aspect-16/10"
                  />
                  <CardContent className="p-5">
                    <h3 className="font-heading text-base font-extrabold">{facility.name}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{facility.description}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {page.events.visible && events.length ? (
      <section id="events" className="eb-section scroll-mt-24">
        <div className="eb-container">
          <SectionHeading
            eyebrow={page.events.eyebrow}
            title={page.events.title}
            action={
              <Button variant="outline" size="lg" className="font-bold" render={<Link href="/school-life/events" />}>
                All events <ArrowRightIcon />
              </Button>
            }
          />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {events.map((event, i) => (
              <Reveal key={event.id} delay={i * 0.05} as="li">
                <Link href={`/school-life/events/${event.slug}`} className="group block">
                  <Card className="flex flex-row items-center gap-4 p-4 transition-colors group-hover:border-gold/40">
                    <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-navy text-navy-foreground">
                      <span className="font-heading text-lg leading-none font-extrabold text-gold">
                        {new Date(event.date).getUTCDate()}
                      </span>
                      <span className="text-[0.6rem] font-bold uppercase">
                        {new Date(event.date).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-heading text-sm font-extrabold">{event.title}</h3>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                        <MapPinIcon className="size-3.5 shrink-0" /> {event.venue} · {formatDate(event.date)}
                      </p>
                    </div>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
      ) : null}

      {page.gallery.visible && gallery.length ? (
      <section id="gallery" className="eb-section scroll-mt-24 border-t bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow={page.gallery.eyebrow}
            title={page.gallery.title}
            action={
              <Button variant="outline" size="lg" className="font-bold" render={<Link href="/school-life/gallery" />}>
                Open gallery <ArrowRightIcon />
              </Button>
            }
          />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {gallery.map((item, i) => (
              <Reveal key={item.id} delay={i * 0.03}>
                <Link href="/school-life/gallery">
                  <ToneImage tone={item.tone} seed={item.id} media={item.media} label={item.title} className="aspect-square rounded-2xl" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {cta.visible ? <CtaBand title={cta.title} text={cta.text} primary={cta.primary} secondary={cta.secondary} /> : null}
    </>
  );
}
