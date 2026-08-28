import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal, ToneImage } from "@/components/motion";
import { Card } from "@/components/ui/card";
import { TEACHING_METHODS } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "Learning Approach",
  description:
    "Crestwood Heights Academy uses a child-centred, activity-based approach: pupils should understand, question, solve and apply — not simply memorise.",
  alternates: { canonical: "/academics/approach" },
};

const PRINCIPLES = [
  {
    title: "Understanding before memorising",
    text: "A child who can explain why a method works can rebuild it when they forget it. We teach for that, and our assessments reward it.",
  },
  {
    title: "Questions are the curriculum",
    text: "Every classroom keeps a question wall. Unanswered questions become the next investigation, project or trip.",
  },
  {
    title: "Do it, then name it",
    text: "Concrete first, pictorial second, abstract third. Children handle the materials before they meet the notation.",
  },
  {
    title: "Feedback within the week",
    text: "Work is marked and returned quickly, with a comment a child can act on — not just a score.",
  },
  {
    title: "Talk is not off-task",
    text: "Structured pair and group work is planned into lessons. Explaining to a peer is one of the strongest ways to learn.",
  },
  {
    title: "Struggle, supported",
    text: "Difficulty is where learning happens. Teachers scaffold rather than rescue, and celebrate the second attempt.",
  },
];

export default function ApproachPage() {
  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="Learning Approach"
        lede="Child-centred and activity-based. Our pupils should understand concepts, ask questions, solve problems and apply what they learn — rather than simply memorise information."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Academics", href: "/academics" },
          { label: "Learning Approach", href: "/academics/approach" },
        ]}
      />

      <section className="cw-section">
        <div className="cw-container">
          <SectionHeading eyebrow="Principles" title="Six principles behind every lesson" align="center" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((principle, i) => (
              <Reveal key={principle.title} delay={i * 0.04}>
                <Card className="h-full gap-0 p-6">
                  <span className="font-heading text-3xl leading-none font-extrabold text-gold/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-heading text-base font-extrabold">{principle.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{principle.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="cw-section border-y bg-muted/40">
        <div className="cw-container grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <ToneImage tone="success" seed="approach" label="Pupils working together" className="aspect-square rounded-3xl" />
          </Reveal>
          <div>
            <SectionHeading
              eyebrow="Teaching methods"
              title="Eleven methods, chosen deliberately"
              lede="No single method carries a whole curriculum. Teachers select from these based on the objective, not on habit."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {TEACHING_METHODS.map((method, i) => (
                <div key={method} className="flex items-center gap-3 rounded-xl border bg-card p-3.5 text-sm font-bold">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-gold/15 text-xs font-extrabold text-gold-foreground dark:text-gold">
                    {i + 1}
                  </span>
                  {method}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cw-section">
        <div className="cw-container">
          <SectionHeading
            eyebrow="Support"
            title="When a child needs something different"
            align="center"
            lede="Not every child moves at the same pace, and that is neither a crisis nor a secret."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { title: "Early identification", text: "Weekly low-stakes checks flag a struggling pupil within the first three weeks of a topic." },
              { title: "Targeted intervention", text: "Small-group support runs during the school day, led by learning support teachers." },
              { title: "Parent partnership", text: "Parents are told early, given a specific plan and invited to review progress each half term." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.06}>
                <Card className="h-full gap-0 border-gold/25 p-6">
                  <h3 className="font-heading text-base font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
