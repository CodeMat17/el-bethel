import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Icon } from "@/components/icon";
import { Reveal, ToneImage } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PERIODS, levelsForStage } from "@/lib/school/config";
import { getSubjects } from "@/lib/school/data";

export const metadata: Metadata = {
  title: "Primary School",
  description:
    "Primary 1 to Primary 6 at El-Bethel International Academy, Abuja — literacy, numeracy, science, reasoning, technology and the arts.",
  alternates: { canonical: "/academics/primary" },
};

const STRANDS = [
  { title: "Literacy", icon: "BookOpen", text: "Guided reading, comprehension, grammar, composition and handwriting, with a termly reading challenge." },
  { title: "Numeracy", icon: "ChartColumn", text: "Number, measurement, geometry and data — with reasoning taught as a discipline of its own." },
  { title: "Science & Discovery", icon: "FlaskConical", text: "Weekly practicals in our child-safe laboratory from Primary 4 upwards." },
  { title: "Technology", icon: "Cpu", text: "Computer literacy from Primary 1, coding from Primary 3, robotics from Primary 4." },
  { title: "Society & Values", icon: "Users", text: "Social studies, civic education and religious studies, taught with respect for every family." },
  { title: "Arts & Physical", icon: "Palette", text: "Creative arts, music and PE every week, plus sixteen clubs after school." },
];

const YEARS = [
  { level: "Primary 1", focus: "Reading fluency, number bonds to 20, structured routines and independence." },
  { level: "Primary 2", focus: "Extended writing, times tables to 5, first science investigations." },
  { level: "Primary 3", focus: "Comprehension strategies, multiplication and division, coding begins." },
  { level: "Primary 4", focus: "Fractions and decimals, laboratory practicals, robotics, longer projects." },
  { level: "Primary 5", focus: "Reasoning under time, research skills, leadership roles across the school." },
  { level: "Primary 6", focus: "Secondary-school readiness: study skills, revision technique and transition support." },
];

export default function PrimaryPage() {
  const levels = [...levelsForStage("lower_primary"), ...levelsForStage("upper_primary")];
  const subjects = getSubjects().filter((s) => s.levelIds.includes("lvl-p4"));

  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="Primary School"
        lede="Primary 1 to Primary 6. Six years to build the reading, reasoning and self-belief a child will carry into secondary school."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Academics", href: "/academics" },
          { label: "Primary School", href: "/academics/primary" },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          {levels.map((level) => (
            <Badge key={level.id} className="h-7 bg-gold/20 px-3 font-bold text-gold">
              {level.name}
            </Badge>
          ))}
        </div>
      </PageHero>

      <section className="eb-section">
        <div className="eb-container grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <ToneImage tone="info" seed="primary-stage" label="Primary classroom" className="aspect-4/5 rounded-3xl" />
          </Reveal>
          <div>
            <SectionHeading
              eyebrow="Our approach"
              title="Rigour and warmth are not opposites"
              lede="Primary pupils are old enough to be stretched and young enough to need someone in their corner. We plan for both."
            />
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                Each class has a class teacher who teaches the core subjects and knows every pupil closely.
                Specialist teachers deliver computer studies, French, creative arts, music and physical
                education from Primary 1, and mathematics and English from Primary 4.
              </p>
              <p>
                Assignments are set through the digital classroom, so parents can see what has been set,
                when it is due and how their child performed — without having to ask.
              </p>
              <p>
                Every pupil belongs to a house — Emerald, Sapphire, Ruby or Amber — which gives them a
                team beyond their class and a reason to turn up to sports day.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading eyebrow="Curriculum strands" title="Six strands, taught every week" align="center" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STRANDS.map((strand, i) => (
              <Reveal key={strand.title} delay={i * 0.04}>
                <Card className="h-full gap-0 p-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-navy text-gold">
                    <Icon name={strand.icon} className="size-5" />
                  </span>
                  <h3 className="mt-4 font-heading text-base font-extrabold">{strand.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{strand.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading eyebrow="Year by year" title="What each year focuses on" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {YEARS.map((year, i) => (
              <Reveal key={year.level} delay={i * 0.04}>
                <Card className="h-full gap-0 border-l-4 border-l-gold p-6">
                  <h3 className="font-heading text-base font-extrabold">{year.level}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{year.focus}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Subjects" title="On a Primary 4 timetable" />
            <div className="mt-8 flex flex-wrap gap-2.5">
              {subjects.map((subject) => (
                <span key={subject.id} className="rounded-full border bg-card px-4 py-2 text-sm font-bold shadow-sm">
                  {subject.name}
                </span>
              ))}
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="The school day" title="Ten periods, two breaks" />
            <ol className="mt-8 space-y-2">
              {PERIODS.map((period) => (
                <li
                  key={period.period}
                  className={`flex items-center gap-4 rounded-xl border p-3 text-sm ${
                    period.label ? "border-gold/30 bg-gold/10 font-bold" : "bg-card"
                  }`}
                >
                  <span className="w-24 shrink-0 font-semibold tabular-nums text-muted-foreground">
                    {period.startTime}–{period.endTime}
                  </span>
                  <span>{period.label ?? `Period ${period.period}`}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
