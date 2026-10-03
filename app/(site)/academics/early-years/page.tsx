import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Icon } from "@/components/icon";
import { Reveal, ToneImage } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { levelsForStage } from "@/lib/school/config";
import { getSubjects } from "@/lib/school/site-data";

export const metadata: Metadata = {
  title: "Creche, Pre-School & Nursery",
  description:
    "Creche, Pre-School and Nursery 1 to Nursery 3 at El-Bethel International Academy, Abuja — care, play, phonics, number work and the routines that build a confident learner.",
  alternates: { canonical: "/academics/early-years" },
};

const STRANDS = [
  { title: "Care & Wellbeing", icon: "Heart", text: "Feeding, rest, nappy changing and comfort, logged daily and shared with parents through the portal." },
  { title: "Language & Phonics", icon: "BookOpen", text: "Songs, rhymes and story time in the creche; systematic phonics from Nursery 1 upwards." },
  { title: "Early Number", icon: "ChartColumn", text: "Counting, sorting, matching and number formation, always through objects a child can hold." },
  { title: "Discovery Play", icon: "ToyBrick", text: "Sand, water, blocks and role play — how young children test what the world does." },
  { title: "Motor Skills", icon: "Activity", text: "Climbing, balancing and outdoor play for gross motor; threading, cutting and tracing for fine motor." },
  { title: "Habits & Independence", icon: "Sprout", text: "Toileting, tidying, sharing and greeting — the self-help habits Primary 1 assumes a child already has." },
];

const YEARS = [
  { level: "Creche", age: "6 months – 2 years", focus: "Settling, secure attachment, sensory play, first words and a predictable daily rhythm." },
  { level: "Pre-School", age: "2 – 3 years", focus: "Talking in short sentences, colours and shapes, sharing and turn-taking, toilet independence." },
  { level: "Nursery 1", age: "3 – 4 years", focus: "Letter sounds, number recognition to 20, holding a pencil correctly, my body and my family." },
  { level: "Nursery 2", age: "4 – 5 years", focus: "Blending simple words, writing numerals to 50, plants and animals, first computer play." },
  { level: "Nursery 3", age: "5 – 6 years", focus: "Reading three-letter words and first sentences, numbers to 100, full Primary 1 readiness." },
];

const CARE_NOTES = [
  "A maximum of six babies to each care-giver in the creche, and never fewer than two adults in the room.",
  "Nappies, feeds, naps and mood are logged through the day and visible to parents in the Parent Portal.",
  "Our resident school nurse checks the early-years rooms every morning and is on call all day.",
  "Children are released only to the adults named on the pickup list, with photo verification at the gate.",
];

export default async function EarlyYearsPage() {
  const levels = [...levelsForStage("early_years"), ...levelsForStage("nursery")];
  const subjects = (await getSubjects()).filter((s) => s.levelIds.includes("lvl-n2"));

  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="Creche, Pre-School & Nursery"
        lede="From six months to six years. The first years away from home should feel safe, warm and interesting — and quietly build the reader and counter who walks into Primary 1."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Academics", href: "/academics" },
          { label: "Creche, Pre-School & Nursery", href: "/academics/early-years" },
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
            <ToneImage tone="success" seed="early-years-stage" label="Early years classroom" className="aspect-4/5 rounded-3xl" />
          </Reveal>
          <div>
            <SectionHeading
              eyebrow="Our approach"
              title="Play is the curriculum, not a break from it"
              lede="Young children learn through repetition, movement and relationship. We plan for all three, and we write down what we see."
            />
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                Every early-years room has a lead teacher and an assistant, so a child who needs
                a lap can have one without the rest of the room stopping.
              </p>
              <p>
                There are no examinations before Primary 1. Progress is recorded through observation
                against clear milestones — speech, motor skills, phonics, number and social confidence —
                and shared with parents at the end of every term.
              </p>
              <p>
                Nursery 3 is a deliberate bridge year. By the third term, children are working in
                exercise books, following a timetable and lining up for assembly — so Primary 1
                is a step up, not a shock.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading eyebrow="What we work on" title="Six strands, every single day" align="center" />
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
                  <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{year.age}</p>
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
            <SectionHeading eyebrow="Learning areas" title="On a Nursery 2 timetable" />
            <div className="mt-8 flex flex-wrap gap-2.5">
              {subjects.map((subject) => (
                <span key={subject.id} className="rounded-full border bg-card px-4 py-2 text-sm font-bold shadow-sm">
                  {subject.name}
                </span>
              ))}
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="Care & safety" title="What parents ask us first" />
            <ul className="mt-8 space-y-3">
              {CARE_NOTES.map((note) => (
                <li key={note} className="flex items-start gap-3 rounded-xl border bg-card p-4 text-sm leading-relaxed">
                  <Icon name="ShieldCheck" className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
