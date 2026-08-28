import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal, ToneImage } from "@/components/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { ACADEMIC_CALENDAR, CLASS_LEVELS } from "@/lib/school/config";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = {
  title: "Curriculum",
  description:
    "The Crestwood Heights Academy curriculum — the Nigerian national curriculum, enriched and sequenced from Primary 1 to Primary 6.",
  alternates: { canonical: "/academics/curriculum" },
};

const YEAR_DETAIL: Record<string, { english: string; maths: string; wider: string }> = {
  "Primary 1": {
    english: "Reading fluency, sentence writing, punctuation, guided reading groups.",
    maths: "Number bonds to 20, place value, telling time, money.",
    wider: "Basic science observation, computer basics, first French greetings.",
  },
  "Primary 2": {
    english: "Paragraph writing, comprehension questions, spelling patterns.",
    maths: "Times tables to 5, two-digit addition and subtraction, simple fractions.",
    wider: "Plants and animals, our community, digital drawing, class presentations.",
  },
  "Primary 3": {
    english: "Comprehension strategies, story structure, dictionary skills.",
    maths: "Multiplication and division, measurement, data handling with tables.",
    wider: "Materials and matter, block coding, quantitative and verbal reasoning begin.",
  },
  "Primary 4": {
    english: "Extended composition, formal grammar, research and note-making.",
    maths: "Fractions and decimals, area and perimeter, word problems.",
    wider: "Laboratory practicals, robotics, home economics and agricultural science begin.",
  },
  "Primary 5": {
    english: "Persuasive and descriptive writing, timed comprehension, debate.",
    maths: "Percentages, ratio, geometry, multi-step problem solving.",
    wider: "Independent science projects, leadership roles, inter-school competitions.",
  },
  "Primary 6": {
    english: "Examination technique, précis, formal letters, extended reading.",
    maths: "Revision across all strands, speed and accuracy, entrance-exam style questions.",
    wider: "Transition programme, study skills, secondary-school preparation and guidance.",
  },
};

export default function CurriculumPage() {
  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="Curriculum"
        lede="We follow the Nigerian national curriculum, enriched with reasoning, digital literacy and a reading programme that runs the length of the school."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Academics", href: "/academics" },
          { label: "Curriculum", href: "/academics/curriculum" },
        ]}
      />

      <section className="cw-section">
        <div className="cw-container grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Framework"
              title="National curriculum, locally enriched"
              lede="The national curriculum sets the floor. Reasoning, coding, French, music and a structured reading programme raise it."
            />
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                Each subject has a scheme of work for every term, broken into weekly objectives. Teachers
                plan from the scheme, and heads of department review coverage at the mid-point of each term.
              </p>
              <p>
                Where a class is behind, the scheme is adjusted rather than abandoned — we would rather
                teach eight things well than twelve things thinly.
              </p>
              <p>
                Parents can see the current topic for every subject in the Parent Portal, alongside the
                assignments set from it.
              </p>
            </div>
          </div>
          <Reveal>
            <ToneImage tone="navy" seed="curriculum" label="Curriculum planning" className="aspect-4/3 rounded-3xl" />
          </Reveal>
        </div>
      </section>

      <section className="cw-section border-y bg-muted/40">
        <div className="cw-container">
          <SectionHeading
            eyebrow="Year by year"
            title="What is covered at each level"
            lede="Tap a level to see the English, mathematics and wider curriculum focus."
          />
          <Accordion className="mt-10 w-full rounded-2xl border bg-card px-4">
            {CLASS_LEVELS.map((level) => {
              const detail = YEAR_DETAIL[level.name];
              return (
                <AccordionItem key={level.id} value={level.id}>
                  <AccordionTrigger className="py-5 text-left font-heading text-base font-extrabold">
                    {level.name}
                  </AccordionTrigger>
                  <AccordionContent>
                    <dl className="grid gap-4 pb-4 sm:grid-cols-3">
                      <div>
                        <dt className="text-xs font-extrabold tracking-wide text-gold-foreground uppercase dark:text-gold">
                          English
                        </dt>
                        <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{detail.english}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-extrabold tracking-wide text-gold-foreground uppercase dark:text-gold">
                          Mathematics
                        </dt>
                        <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{detail.maths}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-extrabold tracking-wide text-gold-foreground uppercase dark:text-gold">
                          Wider curriculum
                        </dt>
                        <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{detail.wider}</dd>
                      </div>
                    </dl>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </section>

      <section className="cw-section">
        <div className="cw-container">
          <SectionHeading eyebrow="Academic year" title="How the year is structured" align="center" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ACADEMIC_CALENDAR.map((block, i) => (
              <Reveal key={block.name} delay={i * 0.04}>
                <Card
                  className={`h-full gap-0 p-6 ${block.type === "term" ? "border-gold/30 bg-gold/8" : ""}`}
                >
                  <h3 className="font-heading text-base font-extrabold">{block.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDate(block.start)} — {formatDate(block.end)}
                  </p>
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
