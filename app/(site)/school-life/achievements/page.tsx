import type { Metadata } from "next";
import { ShieldCheckIcon, StarIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getAchievements } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = {
  title: "Our Stars — Pupil Achievements",
  description:
    "Pupil achievements at El-Bethel International Academy across academics, STEM, sport, music, arts, reading, leadership and community service.",
  alternates: { canonical: "/school-life/achievements" },
};

export default function AchievementsPage() {
  const achievements = getAchievements();
  const categories = Array.from(new Set(achievements.map((a) => a.category)));

  return (
    <>
      <PageHero
        eyebrow="School life"
        title="Our Stars"
        lede="Pupil achievements worth celebrating — across academics, STEM, sport, the arts, reading, leadership and service."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "School Life", href: "/school-life" },
          { label: "Achievements", href: "/school-life/achievements" },
        ]}
      />

      <section className="border-b bg-muted/40 py-6">
        <div className="eb-container flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
            Categories
          </span>
          {categories.map((category) => (
            <Badge key={category} variant="outline" className="h-7 px-3 font-bold">
              {category}
            </Badge>
          ))}
        </div>
      </section>

      <section className="eb-section">
        <div className="eb-container">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement, i) => (
              <Reveal key={achievement.id} delay={i * 0.03}>
                <Card className="h-full gap-0 border-gold/20 p-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-[0.65rem] font-extrabold text-gold-foreground uppercase dark:text-gold">
                      <StarIcon className="size-3" /> {achievement.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(achievement.date)}</span>
                  </div>
                  <h2 className="mt-4 font-heading text-base leading-snug font-extrabold">
                    {achievement.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {achievement.description}
                  </p>
                  <Separator className="my-4" />
                  <p className="text-xs font-bold text-muted-foreground">
                    {achievement.studentInitials} · {achievement.classLabel}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="eb-section border-t bg-muted/40">
        <div className="eb-container max-w-3xl">
          <SectionHeading eyebrow="Child privacy" title="Why we only publish initials" align="center" />
          <Card className="mt-8 gap-0 border-info/30 bg-info/10 p-6">
            <p className="flex items-start gap-3 text-sm leading-relaxed">
              <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-info" />
              <span>
                We celebrate our pupils publicly, but we do not publish children&apos;s full names, class
                sections, photographs or any personal details on the public website. Full recognition —
                including certificates and photographs — is shared privately with families through the
                Parent Portal, and only where consent has been given. This is a deliberate safeguarding
                decision, not an oversight.
              </span>
            </p>
          </Card>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
