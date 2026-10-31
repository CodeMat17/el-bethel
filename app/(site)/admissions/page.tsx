import Link from "next/link";
import { ArrowRightIcon, CheckCircle2Icon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading, StatusPill } from "@/components/common";
import { Icon } from "@/components/icon";
import { Reveal } from "@/components/motion";
import { FaqSearch } from "@/components/site/faq-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CLASS_LEVELS, STAGE_LABELS } from "@/lib/school/config";
import { getContent } from "@/lib/school/site-content";
import { getFaqs } from "@/lib/school/site-data";
import { money } from "@/lib/school/format";
import { jsonLd, pageMetadata } from "@/lib/school/seo";

export const generateMetadata = () =>
  pageMetadata({
    title: "Admissions",
    description:
      "Admission to El-Bethel International Academy, Abuja is open for the 2026/2027 session — Creche, Pre-School, Nursery 1–3, Primary 1–6 and JSS 1–3. Process, requirements, fees and FAQs.",
    path: "/admissions",
  });

const AGE_GUIDE = CLASS_LEVELS.map((level) => ({
  level: level.name,
  age: level.id === "lvl-cre" ? "6 months – 2 years" : `${level.entryAge} – ${level.entryAge + 1} years`,
}));

export default async function AdmissionsPage() {
  const [faqs, page, rules] = await Promise.all([getFaqs(), getContent("admissions"), getContent("fees")]);
  const { hero, availability, steps, requirements, ages, fees, cta } = page;
  const openLevels = CLASS_LEVELS.filter((l) => rules.openLevels.includes(l.id));
  const closedLevels = CLASS_LEVELS.filter((l) => !rules.openLevels.includes(l.id));
  const applicationFee = money(rules.admissionFees[0]?.amount ?? 0);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        lede={hero.lede}
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Admissions", href: "/admissions" }]}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="h-12 bg-gold font-bold text-gold-foreground hover:bg-gold/85" render={<Link href={hero.primary.href} />}>
            {hero.primary.label}
            <ArrowRightIcon />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 border-navy-foreground/25 bg-transparent font-bold text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"
            render={<Link href={hero.secondary.href} />}
          >
            {hero.secondary.label}
          </Button>
        </div>
      </PageHero>

      {availability.visible ? (
      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading eyebrow={availability.eyebrow} title={availability.title} lede={availability.lede} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openLevels.map((level, i) => (
              <Reveal key={level.id} delay={i * 0.04}>
                <Card className="flex flex-row items-center justify-between gap-3 border-success/30 bg-success/8 p-5">
                  <div>
                    <p className="font-heading text-base font-extrabold">{level.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {STAGE_LABELS[level.stage]}
                    </p>
                  </div>
                  <StatusPill tone="success">Open</StatusPill>
                </Card>
              </Reveal>
            ))}
            {closedLevels.map((level, i) => (
              <Reveal key={level.id} delay={(openLevels.length + i) * 0.04}>
                <Card className="flex flex-row items-center justify-between gap-3 p-5 opacity-70">
                  <div>
                    <p className="font-heading text-base font-extrabold">{level.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{STAGE_LABELS[level.stage]}</p>
                  </div>
                  <StatusPill tone="neutral">Waiting list</StatusPill>
                </Card>
              </Reveal>
            ))}
          </div>
          {availability.note ? (
            <p className="mt-6 rounded-xl border border-gold/30 bg-gold/10 px-5 py-4 text-sm font-semibold">{availability.note}</p>
          ) : null}
        </div>
      </section>
      ) : null}

      {steps.visible && steps.items.length ? (
      <section id="process" className="eb-section scroll-mt-24 border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading eyebrow={steps.eyebrow} title={steps.title} align="center" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.items.map((step, i) => (
              <Reveal key={`${step.title}-${i}`} delay={i * 0.05}>
                <Card className="h-full gap-0 p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-navy text-gold">
                      <Icon name={step.icon} className="size-4" />
                    </span>
                    <span className="font-heading text-2xl font-extrabold text-gold/40">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-4 font-heading text-base font-extrabold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text.replace("{applicationFee}", applicationFee)}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {requirements.visible || ages.visible ? (
      <section id="requirements" className="eb-section scroll-mt-24">
        <div className="eb-container grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          {requirements.visible ? (
          <div>
            <SectionHeading eyebrow={requirements.eyebrow} title={requirements.title} lede={requirements.lede} />
            <ul className="mt-8 grid gap-2.5">
              {rules.documents.map((doc) => (
                <li key={doc.key} className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <CheckCircle2Icon className="size-4 shrink-0 text-success" />
                    {doc.label}
                  </span>
                  <Badge variant={doc.required ? "default" : "secondary"} className="shrink-0 font-bold">
                    {doc.required ? "Required" : "If applicable"}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
          ) : null}

          {ages.visible ? (
          <div>
            <SectionHeading eyebrow={ages.eyebrow} title={ages.title} lede={ages.lede} />
            <div className="mt-8 overflow-hidden rounded-2xl border">
              {AGE_GUIDE.map((row, i) => (
                <div key={row.level} className={`flex items-center justify-between gap-3 px-5 py-3 ${i > 0 ? "border-t" : ""}`}>
                  <span className="text-sm font-bold">{row.level}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{row.age}</span>
                </div>
              ))}
            </div>
          </div>
          ) : null}
        </div>
      </section>
      ) : null}

      {fees.visible ? (
      <section id="fees" className="eb-section scroll-mt-24 border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading eyebrow={fees.eyebrow} title={fees.title} lede={fees.lede} />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {rules.bands.map((band, i) => {
              const total = band.lines.reduce((sum, l) => sum + l.amount, 0);
              const levels = CLASS_LEVELS.filter((l) => band.levelIds.includes(l.id));
              return (
                <Reveal key={`${band.band}-${i}`} delay={i * 0.06}>
                  <Card className="flex h-full flex-col gap-0 p-6">
                    <h3 className="font-heading text-lg font-extrabold">{band.band}</h3>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {levels.map((level) => (
                        <Badge key={level.id} variant="secondary" className="font-bold">{level.name}</Badge>
                      ))}
                    </div>
                    <p className="mt-6 font-heading text-3xl leading-none font-extrabold">
                      {money(total)}
                      <span className="ml-1.5 text-sm font-bold text-muted-foreground">/ term</span>
                    </p>
                    <Separator className="my-5" />
                    <ul className="flex-1 space-y-2.5 text-sm">
                      {band.lines.map((line, j) => (
                        <li key={`${line.label}-${j}`} className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">{line.label}</span>
                          <span className="font-bold tabular-nums">{money(line.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            <div>
              <h3 className="font-heading text-lg font-extrabold">{fees.admissionTitle}</h3>
              <div className="mt-5 overflow-hidden rounded-2xl border bg-card">
                {rules.admissionFees.map((fee, i) => (
                  <div key={`${fee.label}-${i}`} className={`flex items-center justify-between gap-3 px-5 py-4 ${i > 0 ? "border-t" : ""}`}>
                    <span className="text-sm font-semibold">{fee.label}</span>
                    <span className="font-heading text-base font-extrabold tabular-nums">{money(fee.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-heading text-lg font-extrabold">{fees.optionalTitle}</h3>
              <div className="mt-5 overflow-hidden rounded-2xl border bg-card">
                {rules.optionalFees.map((fee, i) => (
                  <div key={`${fee.label}-${i}`} className={`flex items-center justify-between gap-3 px-5 py-4 ${i > 0 ? "border-t" : ""}`}>
                    <span className="text-sm font-semibold">{fee.label}</span>
                    <span className="font-heading text-base font-extrabold tabular-nums">{money(fee.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {fees.notes.map((item, i) => (
              <Card key={`${item.title}-${i}`} className="h-full gap-0 p-6">
                <h3 className="font-heading text-base font-extrabold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {page.faqs.visible && faqs.length ? (
      <section id="faqs" className="eb-section scroll-mt-24">
        <div className="eb-container max-w-4xl">
          <SectionHeading eyebrow={page.faqs.eyebrow} title={page.faqs.title} className="mb-10" />
          <FaqSearch faqs={faqs} />
        </div>
      </section>
      ) : null}

      {cta.visible ? <CtaBand title={cta.title} text={cta.text} primary={cta.primary} secondary={cta.secondary} /> : null}
    </>
  );
}
