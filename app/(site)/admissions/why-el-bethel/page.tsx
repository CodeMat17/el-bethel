import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Icon } from "@/components/icon";
import { Counter, Reveal, ToneImage } from "@/components/motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SCHOOL_STATS, WHY_EL_BETHEL } from "@/lib/school/config";
import { getTestimonials } from "@/lib/school/data";
import { initials } from "@/lib/school/format";

export const metadata: Metadata = {
  title: "Why El-Bethel",
  description:
    "Seven reasons families in Abuja choose El-Bethel International Academy for their children's primary education.",
  alternates: { canonical: "/admissions/why-el-bethel" },
};

const EVIDENCE: Record<string, string> = {
  "Strong Academic Foundation": "Continuous assessment across four components, with subject-level intervention triggered inside three weeks.",
  "Caring Teachers": "One class teacher per class plus an assistant in lower primary — a pupil-to-teacher ratio of twelve to one.",
  "Technology-Enabled Learning": "A dedicated ICT and innovation lab, coding from Primary 3 and robotics from Primary 4.",
  "Character Development": "Seven conduct traits rated by the class teacher and reported on every termly report card.",
  "Safe Environment": "Controlled access, CCTV coverage, a resident school nurse and an authorised-pickup-only release policy.",
  "Parent Partnership": "A parent portal showing assignments, attendance, results and fees — the same data the school sees.",
  "Holistic Development": "Sixteen clubs, four sports, a creative arts studio and a working school garden.",
};

export default function WhyElBethelPage() {
  const testimonials = getTestimonials();

  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Why El-Bethel"
        lede="Seven reasons families choose us — each with the evidence behind it, not just the claim."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Admissions", href: "/admissions" },
          { label: "Why El-Bethel", href: "/admissions/why-el-bethel" },
        ]}
      />

      <section className="eb-section">
        <div className="eb-container space-y-5">
          {WHY_EL_BETHEL.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.04}>
              <Card className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr_1fr] lg:items-center">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-navy text-gold">
                  <Icon name={item.icon} className="size-6" />
                </span>
                <div>
                  <h2 className="font-heading text-xl font-extrabold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
                <div className="rounded-xl bg-muted/70 p-4">
                  <p className="text-[0.65rem] font-extrabold tracking-[0.14em] text-gold-foreground uppercase dark:text-gold">
                    How we deliver it
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{EVIDENCE[item.title]}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-navy py-14 text-navy-foreground sm:py-20">
        <div className="eb-container grid gap-8 md:grid-cols-4">
          {SCHOOL_STATS.slice(0, 4).map((stat, i) => (
            <Reveal key={stat.key} delay={i * 0.05}>
              <div className="border-l border-gold/25 pl-5">
                <p className="font-heading text-3xl leading-none font-extrabold text-gold sm:text-4xl">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-xs font-bold tracking-wide text-navy-foreground/60 uppercase">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="eb-section">
        <div className="eb-container grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <Reveal>
            <ToneImage tone="gold" seed="why-el-bethel" label="Pupils at El-Bethel International Academy" className="aspect-4/3 rounded-3xl" />
          </Reveal>
          <div>
            <SectionHeading eyebrow="Parent voices" title="What families tell us" />
            <div className="mt-8 space-y-4">
              {testimonials.map((t) => (
                <Card key={t.id} className="gap-0 p-6">
                  <p className="text-pretty text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-navy text-xs font-bold text-navy-foreground">
                        {initials(...t.name.replace(/^(Mrs|Mr|Miss|Dr)\.?\s/, "").split(" "))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-extrabold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.relationship}</p>
                    </div>
                  </div>
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
