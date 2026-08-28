import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Icon } from "@/components/icon";
import { Reveal, ToneImage } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAchievements, getUpcomingEvents } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = {
  title: "Sports",
  description:
    "Football, basketball, volleyball, athletics and four competing houses at Crestwood Heights Academy, Abuja.",
  alternates: { canonical: "/school-life/sports" },
};

const SPORTS = [
  { name: "Football", icon: "Goal", text: "Coached academy sessions twice a week, plus inter-house and inter-school fixtures.", levels: "Primary 1 – 6" },
  { name: "Basketball", icon: "CircleDot", text: "Adjustable hoops sized for primary pupils, with coached sessions after school.", levels: "Primary 3 – 6" },
  { name: "Volleyball", icon: "Volleyball", text: "Introduced in upper primary, with a dedicated sand and hard-court area.", levels: "Primary 4 – 6" },
  { name: "Athletics", icon: "Timer", text: "Sprints, relays, long jump and field events, building to the annual sports festival.", levels: "Primary 1 – Primary 6" },
  { name: "Physical Education", icon: "Trophy", text: "Timetabled PE for every class every week, taught by a specialist teacher.", levels: "All classes" },
  { name: "Dance & Movement", icon: "Palette", text: "Traditional and contemporary dance, performed at cultural day and prize-giving.", levels: "Primary 1 – Primary 6" },
];

const HOUSES = [
  { name: "Emerald", tone: "success", motto: "Steady and strong" },
  { name: "Sapphire", tone: "info", motto: "Bold and bright" },
  { name: "Ruby", tone: "plum", motto: "Fearless together" },
  { name: "Amber", tone: "gold", motto: "Warm and relentless" },
];

export default function SportsPage() {
  const sportEvents = getUpcomingEvents().filter((e) => e.category === "sports");
  const sportAchievements = getAchievements().filter((a) => a.category === "Sports");

  return (
    <>
      <PageHero
        eyebrow="School life"
        title="Sports"
        lede="Every child plays. Not every child will compete at district level, but every child will learn to lose well, train consistently and back a teammate."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "School Life", href: "/school-life" },
          { label: "Sports", href: "/school-life/sports" },
        ]}
      />

      <section className="cw-section">
        <div className="cw-container">
          <SectionHeading eyebrow="What we play" title="Six sports across the school" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SPORTS.map((sport, i) => (
              <Reveal key={sport.name} delay={i * 0.04}>
                <Card className="h-full gap-0 p-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-navy text-gold">
                    <Icon name={sport.icon} className="size-5" />
                  </span>
                  <h3 className="mt-4 font-heading text-base font-extrabold">{sport.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{sport.text}</p>
                  <p className="mt-4 text-xs font-bold text-gold-foreground dark:text-gold">{sport.levels}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="cw-section border-y bg-muted/40">
        <div className="cw-container">
          <SectionHeading
            eyebrow="Houses"
            title="Four houses, one very loud sports day"
            lede="Every pupil is placed in a house on their first day and stays in it for their whole time at Crestwood."
            align="center"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOUSES.map((house, i) => (
              <Reveal key={house.name} delay={i * 0.06}>
                <Card className="h-full gap-0 overflow-hidden p-0">
                  <ToneImage tone={house.tone} seed={house.name} label={`${house.name} house`} className="aspect-16/9" />
                  <div className="p-5">
                    <h3 className="font-heading text-lg font-extrabold">{house.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{house.motto}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="cw-section">
        <div className="cw-container grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Fixtures" title="Upcoming sporting events" />
            <div className="mt-8 space-y-3">
              {sportEvents.length === 0 ? (
                <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  No sporting events are scheduled at the moment. Check the school calendar for the full
                  term programme.
                </p>
              ) : (
                sportEvents.map((event) => (
                  <Card key={event.id} className="gap-0 p-5">
                    <h3 className="font-heading text-base font-extrabold">{event.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(event.date)} · {event.startTime}–{event.endTime} · {event.venue}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                    <Button variant="link" className="mt-2 w-fit px-0 font-bold" render={<Link href={`/school-life/events/${event.slug}`} />}>
                      Event details <ArrowRightIcon />
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="Our Stars" title="Sporting achievements" />
            <div className="mt-8 space-y-3">
              {sportAchievements.map((achievement) => (
                <Card key={achievement.id} className="gap-0 border-gold/20 p-5">
                  <h3 className="font-heading text-base font-extrabold">{achievement.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{achievement.description}</p>
                  <p className="mt-3 text-xs font-semibold text-muted-foreground">
                    {achievement.studentInitials} · {achievement.classLabel}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
