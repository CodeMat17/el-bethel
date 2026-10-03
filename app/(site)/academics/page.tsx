import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Icon } from "@/components/icon";
import { Reveal, ToneImage } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ASSESSMENT_WEIGHTING,
  CLASS_LEVELS,
  STAGES,
  LEVEL_POPULATION,
  LEVEL_SECTIONS,
  TEACHING_METHODS,
} from "@/lib/school/config";
import { getSubjects } from "@/lib/school/site-data";

export const metadata: Metadata = {
  title: "Academics",
  description:
    "The El-Bethel International Academy curriculum: fourteen class levels from Creche to JSS 3, thirty subjects and continuous assessment.",
  alternates: { canonical: "/academics" },
};

const PILLARS = [
  { title: "Curriculum", icon: "BookOpen", href: "/academics/curriculum", text: "The Nigerian national curriculum, enriched and sequenced year by year." },
  { title: "Subjects", icon: "Library", href: "/academics/subjects", text: "Seventeen subjects across core and additional strands." },
  { title: "Learning Approach", icon: "Lightbulb", href: "/academics/approach", text: "Child-centred, activity-based and unapologetically practical." },
  { title: "Assessment & Reports", icon: "ClipboardCheck", href: "/academics/assessment", text: "Continuous assessment, published results and termly report cards." },
];

export default async function AcademicsPage() {
  const subjects = await getSubjects();

  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="A curriculum children can actually use"
        lede="Fourteen class levels from creche to JSS 3, thirty subjects and an assessment rhythm designed to catch a struggling child in week three — not at the end of term."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Academics", href: "/academics" }]}
      />

      <section className="eb-section">
        <div className="eb-container grid gap-6 lg:grid-cols-2">
          {STAGES.map((programme, i) => (
            <Reveal key={programme.key} delay={i * 0.08}>
              <Card className="h-full gap-0 overflow-hidden p-0">
                <ToneImage tone={programme.tone} seed={programme.name} label={programme.name} className="aspect-21/9" />
                <CardContent className="p-7">
                  <h2 className="font-heading text-2xl font-extrabold">{programme.name}</h2>
                  <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{programme.ages}</p>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{programme.text}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {CLASS_LEVELS.filter((l) => l.stage === programme.key).map((level) => (
                      <Badge key={level.id} variant="secondary" className="h-7 px-3 font-bold">
                        {level.name}
                      </Badge>
                    ))}
                  </div>
                  <Button className="mt-6 font-bold" size="lg" render={<Link href={programme.href} />}>
                    Explore the programme
                    <ArrowRightIcon />
                  </Button>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading eyebrow="Explore" title="Four ways into our academic programme" align="center" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((pillar, i) => (
              <Reveal key={pillar.title} delay={i * 0.05}>
                <Link href={pillar.href} className="group block h-full">
                  <Card className="h-full gap-0 p-6 transition-all group-hover:-translate-y-1 group-hover:border-gold/40 group-hover:shadow-lg">
                    <span className="grid size-11 place-items-center rounded-2xl bg-navy text-gold">
                      <Icon name={pillar.icon} className="size-5" />
                    </span>
                    <h3 className="mt-4 font-heading text-base font-extrabold">{pillar.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{pillar.text}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary dark:text-gold">
                      Read more <ArrowRightIcon className="size-3.5" />
                    </span>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="eb-section">
        <div className="eb-container grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="Class structure"
              title="Twenty-nine classes across fourteen levels"
              lede="Sections are kept deliberately small. Our average class size is 24 pupils."
            />
            <div className="mt-8 overflow-hidden rounded-2xl border">
              <table className="w-full text-sm">
                <caption className="sr-only">Class structure by level</caption>
                <thead className="bg-muted/70 text-xs uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-extrabold">Level</th>
                    <th scope="col" className="px-4 py-3 text-right font-extrabold">Sections</th>
                    <th scope="col" className="px-4 py-3 text-right font-extrabold">Pupils</th>
                  </tr>
                </thead>
                <tbody>
                  {CLASS_LEVELS.map((level) => (
                    <tr key={level.id} className="border-t">
                      <th scope="row" className="px-4 py-3 text-left font-bold">{level.name}</th>
                      <td className="px-4 py-3 text-right tabular-nums">{LEVEL_SECTIONS[level.id].length}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{LEVEL_POPULATION[level.id]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow="Assessment"
              title="How a term score is built"
              lede="Every subject score is out of 100, split between continuous assessment and the examination. The usual split is 40/60; each subject teacher sets the exact weighting for the term."
            />
            <div className="mt-8 space-y-4">
              {ASSESSMENT_WEIGHTING.map((w) => (
                <div key={w.component}>
                  <div className="flex items-baseline justify-between text-sm font-bold">
                    <span>{w.label}</span>
                    <span className="tabular-nums text-muted-foreground">typically {w.weight}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${w.weight}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="lg" className="mt-8 font-bold" render={<Link href="/academics/assessment" />}>
              How assessment works
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Subjects"
            title={`${subjects.length} subjects across the school`}
            action={
              <Button variant="outline" size="lg" className="font-bold" render={<Link href="/academics/subjects" />}>
                Subject details
                <ArrowRightIcon />
              </Button>
            }
          />
          <div className="mt-10 flex flex-wrap gap-2.5">
            {subjects.map((subject) => (
              <span
                key={subject.id}
                className="rounded-full border bg-card px-4 py-2 text-sm font-bold shadow-sm"
              >
                {subject.name}
                <span className="ml-2 text-xs font-semibold text-muted-foreground">{subject.code}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading eyebrow="Teaching methods" title="Eleven ways we teach" align="center" />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEACHING_METHODS.map((method, i) => (
              <Reveal key={method} delay={i * 0.03}>
                <div className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm font-bold">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-gold/15 text-xs font-extrabold text-gold-foreground dark:text-gold">
                    {i + 1}
                  </span>
                  {method}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
