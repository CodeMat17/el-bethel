import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Icon } from "@/components/icon";
import { Reveal, ToneImage } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PERIODS, levelsForStage } from "@/lib/school/config";
import { getSubjects } from "@/lib/school/data";

export const metadata: Metadata = {
  title: "Junior Secondary School",
  description:
    "JSS 1 to JSS 3 at El-Bethel International Academy, Abuja — the Nigerian junior secondary curriculum, subject specialists, laboratory science and full BECE preparation.",
  alternates: { canonical: "/academics/junior-secondary" },
};

const STRANDS = [
  { title: "Core Academics", icon: "BookOpen", text: "English Studies, Mathematics, Basic Science and National Values, taught by subject specialists every week." },
  { title: "Basic Technology", icon: "Wrench", text: "Technical drawing, materials, simple machines and workshop safety in our technology room." },
  { title: "Laboratory Science", icon: "FlaskConical", text: "Weekly practicals with proper apparatus, lab reports and the habits an examiner looks for." },
  { title: "Business & Enterprise", icon: "Briefcase", text: "Business studies, book-keeping and a termly enterprise project run by the pupils themselves." },
  { title: "Digital & Coding", icon: "Cpu", text: "Computer studies, spreadsheets, presentation and coding in our ICT and Innovation Lab." },
  { title: "Guidance & Character", icon: "Compass", text: "Form tutors, subject-choice counselling and a pastoral programme built for early teenagers." },
];

const YEARS = [
  { level: "JSS 1", age: "12 – 13 years", focus: "Settling into subject teaching, study routines, note-making and the full junior syllabus foundation." },
  { level: "JSS 2", age: "13 – 14 years", focus: "Algebra, laboratory technique, extended writing and the first internal mock examinations." },
  { level: "JSS 3", age: "14 – 15 years", focus: "BECE preparation, past-question practice, subject-choice counselling and senior secondary guidance." },
];

const OUTCOMES = [
  "Every JSS 3 pupil is entered for the Basic Education Certificate Examination (BECE) and the FCT junior certificate.",
  "Continuous assessment carries 40 percent of every subject score, exactly as it does across the school.",
  "Mock examinations run in the first and second terms of JSS 3, with results reviewed subject by subject with parents.",
  "Subject-choice counselling in the third term helps each family plan the senior secondary route that fits the pupil.",
];

export default function JuniorSecondaryPage() {
  const levels = levelsForStage("junior_secondary");
  const subjects = getSubjects().filter((s) => s.levelIds.includes("lvl-j2"));

  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="Junior Secondary School"
        lede="JSS 1 to JSS 3. Subject specialists, real laboratory work and the study discipline the BECE — and senior secondary — will demand."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Academics", href: "/academics" },
          { label: "Junior Secondary", href: "/academics/junior-secondary" },
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
            <ToneImage tone="info" seed="jss-stage" label="Junior secondary classroom" className="aspect-4/5 rounded-3xl" />
          </Reveal>
          <div>
            <SectionHeading
              eyebrow="Our approach"
              title="Independence, with someone still watching"
              lede="Junior secondary is the year a pupil is asked to manage their own work — and the year they most need an adult who notices when they do not."
            />
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                Every subject is taught by a specialist, but each class keeps a form teacher who tracks
                attendance, behaviour and grades across all subjects and speaks to parents directly.
              </p>
              <p>
                Assignments, materials and quizzes are set through the digital classroom, so a pupil
                learns to plan a week of deadlines rather than a single night of homework.
              </p>
              <p>
                Pupils who complete Primary 6 with us move up automatically. Pupils joining from other
                schools take a placement assessment in English and mathematics before a place is confirmed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading eyebrow="Programme strands" title="Six strands across the junior years" align="center" />
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
        <div className="eb-container grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading eyebrow="Year by year" title="What each year focuses on" />
            <div className="mt-10 grid gap-4">
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
          <div>
            <SectionHeading eyebrow="Examinations" title="How the junior years are certified" />
            <ul className="mt-10 space-y-3">
              {OUTCOMES.map((note) => (
                <li key={note} className="flex items-start gap-3 rounded-xl border bg-card p-4 text-sm leading-relaxed">
                  <Icon name="BadgeCheck" className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Subjects" title="On a JSS 2 timetable" />
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
