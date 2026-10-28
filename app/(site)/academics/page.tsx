import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal, ToneImage } from "@/components/motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  ASSESSMENT_WEIGHTING,
  CLASS_LEVELS,
  GRADE_BANDS,
  STAGES,
} from "@/lib/school/config";
import { getContent } from "@/lib/school/site-content";
import { getLevelSummary, getSubjects } from "@/lib/school/site-data";

export const metadata: Metadata = {
  title: "Academics",
  description:
    "The El-Bethel International Academy curriculum: fourteen class levels from Creche to JSS 3, thirty subjects and continuous assessment.",
  alternates: { canonical: "/academics" },
};

/** Colour and built-in photo for each stage; the photo can be replaced in the Site portal. */
const STAGE_TONES = Object.fromEntries(STAGES.map((s) => [s.key, s.tone]));
const STAGE_SEEDS = Object.fromEntries(STAGES.map((s) => [s.key, s.name]));

export default async function AcademicsPage() {
  const [subjects, page, levels] = await Promise.all([getSubjects(), getContent("academics"), getLevelSummary()]);
  const { hero, stages, assessment, grading, classes, methods, cta } = page;
  const focus = new Map(stages.levels.map((l) => [l.id, l.focus]));

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        lede={hero.lede}
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Academics", href: "/academics" }]}
      />

      {stages.visible ? (
      <section className="eb-section">
        <div className="eb-container grid gap-6 lg:grid-cols-2">
          {stages.items.map((programme, i) => (
            <Reveal key={programme.key} delay={i * 0.08}>
              <Card id={programme.key} className="h-full scroll-mt-24 gap-0 overflow-hidden p-0">
                <ToneImage tone={STAGE_TONES[programme.key]} seed={STAGE_SEEDS[programme.key]} media={programme.image ?? undefined} label={programme.name} className="aspect-21/9" />
                <CardContent className="p-7">
                  <h2 className="font-heading text-2xl font-extrabold">{programme.name}</h2>
                  <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{programme.ages}</p>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{programme.text}</p>
                  <dl className="mt-5 space-y-3">
                    {CLASS_LEVELS.filter((l) => l.stage === programme.key).map((level) => (
                      <div key={level.id} className="rounded-xl bg-muted/60 p-3">
                        <dt className="text-sm font-extrabold">{level.name}</dt>
                        <dd className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{focus.get(level.id)}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
      ) : null}

      {page.subjects.visible && subjects.length ? (
      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading eyebrow={page.subjects.eyebrow} title={page.subjects.title.replace("{count}", String(subjects.length))} />
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
      ) : null}

      {assessment.visible || grading.visible ? (
      <section id="assessment" className="eb-section scroll-mt-24">
        <div className="eb-container grid gap-12 lg:grid-cols-[1fr_1fr]">
          {assessment.visible ? (
          <div>
            <SectionHeading eyebrow={assessment.eyebrow} title={assessment.title} lede={assessment.lede} />
            <div className="mt-8 space-y-4">
              {ASSESSMENT_WEIGHTING.map((w) => (
                <div key={w.component}>
                  <div className="flex items-baseline justify-between text-sm font-bold">
                    <span>{w.label}</span>
                    <span className="tabular-nums text-muted-foreground">typically {w.weight}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${w.weight}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          ) : null}

          {grading.visible ? (
          <div>
            <SectionHeading eyebrow={grading.eyebrow} title={grading.title} />
            <div className="mt-8 overflow-hidden rounded-2xl border">
              <table className="w-full text-sm">
                <caption className="sr-only">Grade bands</caption>
                <thead className="bg-muted/70 text-xs uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-extrabold">Grade</th>
                    <th scope="col" className="px-4 py-3 text-left font-extrabold">Score range</th>
                    <th scope="col" className="px-4 py-3 text-left font-extrabold">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {GRADE_BANDS.map((band, i) => (
                    <tr key={band.grade} className="border-t">
                      <th scope="row" className="px-4 py-3 text-left font-heading text-base font-extrabold">{band.grade}</th>
                      <td className="px-4 py-3 tabular-nums">
                        {band.min}
                        {i === 0 ? "–100" : `–${GRADE_BANDS[i - 1].min - 1}`}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{band.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          ) : null}
        </div>
      </section>
      ) : null}

      {classes.visible || methods.visible ? (
      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container grid gap-12 lg:grid-cols-[1fr_1fr]">
          {classes.visible ? (
          <div>
            <SectionHeading eyebrow={classes.eyebrow} title={classes.title} lede={classes.lede} />
            <div className="mt-8 overflow-hidden rounded-2xl border bg-card">
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
                      <td className="px-4 py-3 text-right tabular-nums">{levels[level.id]?.sections ?? 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{levels[level.id]?.pupils ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          ) : null}

          {methods.visible ? (
          <div>
            <SectionHeading eyebrow={methods.eyebrow} title={methods.title} />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {methods.items.map((method, i) => (
                <div key={`${method}-${i}`} className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm font-bold">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-gold/15 text-xs font-extrabold text-gold-foreground dark:text-gold">
                    {i + 1}
                  </span>
                  {method}
                </div>
              ))}
            </div>
          </div>
          ) : null}
        </div>
      </section>
      ) : null}

      {cta.visible ? <CtaBand title={cta.title} text={cta.text} primary={cta.primary} secondary={cta.secondary} /> : null}
    </>
  );
}
