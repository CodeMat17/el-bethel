import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, MapPinIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Icon } from "@/components/icon";
import { Reveal, ToneImage } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FACILITIES } from "@/lib/school/config";
import { getAchievements, getClubs, getGallery, getUpcomingEvents } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = {
  title: "School Life",
  description:
    "Clubs, sports, achievements, facilities, events and gallery — life beyond the classroom at El-Bethel International Academy, Abuja.",
  alternates: { canonical: "/school-life" },
};

const SECTIONS = [
  { title: "Clubs & Activities", href: "/school-life/clubs", icon: "Puzzle", text: "Sixteen clubs across STEM, arts, sport, literature and service." },
  { title: "Sports", href: "/school-life/sports", icon: "Trophy", text: "Football, basketball, volleyball and athletics, plus four competing houses." },
  { title: "Achievements", href: "/school-life/achievements", icon: "Star", text: "Our Stars — pupil achievements across academics, sport and the arts." },
  { title: "Facilities", href: "/school-life/facilities", icon: "Building2", text: "Fourteen spaces designed around small people." },
  { title: "Events", href: "/school-life/events", icon: "CalendarDays", text: "Sports day, cultural day, open days and excursions." },
  { title: "Gallery", href: "/school-life/gallery", icon: "Images", text: "A term in pictures, updated throughout the year." },
  { title: "Library", href: "/school-life/library", icon: "BookOpenCheck", text: "Our catalogue, borrowing system and reading challenge." },
  { title: "Transport", href: "/school-life/transport", icon: "Bus", text: "Four routes across Abuja, with a trained attendant on every bus." },
];

export default function SchoolLifePage() {
  const clubs = getClubs().slice(0, 6);
  const events = getUpcomingEvents().slice(0, 3);
  const achievements = getAchievements().slice(0, 3);
  const gallery = getGallery().slice(0, 6);

  return (
    <>
      <PageHero
        eyebrow="School life"
        title="What happens between the lessons"
        lede="Clubs, sport, exhibitions, excursions, competitions and four fiercely competitive houses. This is where a lot of the learning actually sticks."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "School Life", href: "/school-life" }]}
      />

      <section className="eb-section">
        <div className="eb-container">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECTIONS.map((section, i) => (
              <Reveal key={section.href} delay={i * 0.04}>
                <Link href={section.href} className="group block h-full">
                  <Card className="h-full gap-0 p-6 transition-all group-hover:-translate-y-1 group-hover:border-gold/40 group-hover:shadow-lg">
                    <span className="grid size-11 place-items-center rounded-2xl bg-navy text-gold">
                      <Icon name={section.icon} className="size-5" />
                    </span>
                    <h2 className="mt-4 font-heading text-base font-extrabold">{section.title}</h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{section.text}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary dark:text-gold">
                      Explore <ArrowRightIcon className="size-3.5" />
                    </span>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Clubs"
            title="Find what you love"
            action={
              <Button variant="outline" size="lg" className="font-bold" render={<Link href="/school-life/clubs" />}>
                All clubs <ArrowRightIcon />
              </Button>
            }
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club, i) => (
              <Reveal key={club.id} delay={i * 0.04}>
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

      <section className="eb-section">
        <div className="eb-container grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading eyebrow="Upcoming" title="What's coming up" />
            <ul className="mt-8 space-y-3">
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

          <div>
            <SectionHeading eyebrow="Our Stars" title="Recent achievements" />
            <div className="mt-8 space-y-3">
              {achievements.map((achievement, i) => (
                <Reveal key={achievement.id} delay={i * 0.05}>
                  <Card className="gap-0 border-gold/20 p-5">
                    <Badge className="w-fit bg-gold/15 font-bold text-gold-foreground dark:text-gold">
                      {achievement.category}
                    </Badge>
                    <h3 className="mt-3 font-heading text-base font-extrabold">{achievement.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{achievement.description}</p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Facilities"
            title="Where it all happens"
            action={
              <Button variant="outline" size="lg" className="font-bold" render={<Link href="/school-life/facilities" />}>
                All facilities <ArrowRightIcon />
              </Button>
            }
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FACILITIES.slice(0, 8).map((facility, i) => (
              <Reveal key={facility.id} delay={i * 0.03}>
                <Link href={`/school-life/facilities#${facility.slug}`} className="group block h-full">
                  <Card className="h-full gap-0 overflow-hidden p-0 transition-all group-hover:-translate-y-1">
                    <ToneImage
                      tone={["navy", "gold", "info", "success", "plum"][i % 5]}
                      seed={facility.slug}
                      label={facility.name}
                      className="aspect-16/10"
                    />
                    <CardContent className="p-4">
                      <h3 className="font-heading text-sm font-extrabold">{facility.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Gallery"
            title="A term in pictures"
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
                  <ToneImage tone={item.tone} seed={item.id} label={item.title} className="aspect-square rounded-2xl" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
