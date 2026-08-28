import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Icon } from "@/components/icon";
import { Reveal } from "@/components/motion";
import { Card } from "@/components/ui/card";
import { CONDUCT_TRAITS, CORE_VALUES } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "Core Values",
  description:
    "Excellence, integrity, respect, curiosity, creativity, responsibility and compassion — the seven values that shape life at Crestwood Heights Academy.",
  alternates: { canonical: "/about/core-values" },
};

const IN_PRACTICE: Record<string, string> = {
  Excellence: "Work is redone until it is right, and effort is praised as loudly as talent.",
  Integrity: "Pupils mark their own practice work before a teacher sees it — honesty is the lesson.",
  Respect: "Every child greets and is greeted. Adults model the tone they expect.",
  Curiosity: "Classrooms keep a question wall. Unanswered questions become the next project.",
  Creativity: "Every pupil exhibits work at the termly art exhibition, whatever their level.",
  Responsibility: "Pupils run the library desk, the garden and the pupil council.",
  Compassion: "Buddy systems pair older and younger pupils from the first week of term.",
};

export default function CoreValuesPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Core Values"
        lede="Seven values, taught explicitly, modelled daily and reported on every term."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Core Values", href: "/about/core-values" },
        ]}
      />

      <section className="cw-section">
        <div className="cw-container grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CORE_VALUES.map((value, i) => (
            <Reveal key={value.name} delay={i * 0.05}>
              <Card className="h-full gap-0 p-7 transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg">
                <span className="grid size-12 place-items-center rounded-2xl bg-navy text-gold">
                  <Icon name={value.icon} className="size-5" />
                </span>
                <h2 className="mt-5 font-heading text-xl font-extrabold">{value.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.text}</p>
                <p className="mt-4 rounded-xl bg-muted/70 p-3 text-xs leading-relaxed">
                  <span className="font-extrabold">In practice · </span>
                  {IN_PRACTICE[value.name]}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="cw-section border-t bg-muted/40">
        <div className="cw-container">
          <SectionHeading
            eyebrow="On the report card"
            title="Values we actually measure"
            lede="Every termly report card carries a conduct section rated by the class teacher. Character is assessed alongside academics — not instead of it."
            align="center"
          />
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
            {CONDUCT_TRAITS.map((trait) => (
              <span key={trait} className="rounded-full border bg-card px-4 py-2 text-sm font-bold shadow-sm">
                {trait}
              </span>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
