import type { Metadata } from "next";
import { ClockIcon, UsersIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getClubs, teacherNameById } from "@/lib/school/data";

export const metadata: Metadata = {
  title: "Clubs & Activities",
  description:
    "Sixteen clubs at El-Bethel International Academy, Abuja — coding, robotics, chess, reading, art, music, drama, sport and more.",
  alternates: { canonical: "/school-life/clubs" },
};

const CATEGORY_LABEL: Record<string, string> = {
  stem: "STEM",
  arts: "Arts",
  sports: "Sport",
  literary: "Literary",
  service: "Service",
};

const CATEGORY_TONE: Record<string, string> = {
  stem: "bg-info/12 text-info ring-info/25",
  arts: "bg-gold/15 text-gold-foreground ring-gold/30 dark:text-gold",
  sports: "bg-success/12 text-success ring-success/25",
  literary: "bg-primary/10 text-primary ring-primary/20 dark:text-gold",
  service: "bg-muted text-muted-foreground ring-border",
};

export default function ClubsPage() {
  const clubs = getClubs();
  const grouped = Object.entries(
    clubs.reduce<Record<string, typeof clubs>>((acc, club) => {
      (acc[club.category] ??= []).push(club);
      return acc;
    }, {}),
  );

  return (
    <>
      <PageHero
        eyebrow="School life"
        title="Clubs & Activities"
        lede="Every pupil joins at least one club. Some find a hobby; a few find a calling. All of them find people who like what they like."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "School Life", href: "/school-life" },
          { label: "Clubs", href: "/school-life/clubs" },
        ]}
      >
        <div className="flex flex-wrap gap-4 text-sm text-navy-foreground/80">
          <span className="flex items-center gap-2">
            <UsersIcon className="size-4 text-gold" /> {clubs.reduce((s, c) => s + c.memberCount, 0)} memberships
          </span>
          <span className="flex items-center gap-2">
            <ClockIcon className="size-4 text-gold" /> Weekly, during and after school
          </span>
        </div>
      </PageHero>

      <section className="eb-section">
        <div className="eb-container space-y-14">
          {grouped.map(([category, list]) => (
            <div key={category}>
              <SectionHeading eyebrow={CATEGORY_LABEL[category]} title={`${CATEGORY_LABEL[category]} clubs`} />
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((club, i) => (
                  <Reveal key={club.id} delay={i * 0.04}>
                    <Card className="h-full gap-0 p-6 transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-heading text-lg font-extrabold">{club.name}</h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-extrabold ring-1 ring-inset ${CATEGORY_TONE[club.category]}`}
                        >
                          {CATEGORY_LABEL[club.category]}
                        </span>
                      </div>
                      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {club.description}
                      </p>
                      <Separator className="my-5" />
                      <dl className="space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-muted-foreground">Coordinator</dt>
                          <dd className="truncate font-bold">{teacherNameById(club.coordinatorId)}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-muted-foreground">Meets</dt>
                          <dd className="font-bold">{club.meetingDay}s · {club.meetingTime}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-muted-foreground">Members</dt>
                          <dd><Badge variant="secondary" className="font-bold">{club.memberCount}</Badge></dd>
                        </div>
                      </dl>
                    </Card>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <CtaBand
        title="Clubs are included in your child's activities fee"
        text="There is no separate charge to join a club. Pupils choose their clubs in the first two weeks of each term."
      />
    </>
  );
}
