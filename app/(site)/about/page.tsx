import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, CheckCircle2Icon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Icon } from "@/components/icon";
import { Counter, Reveal, ToneImage } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getContent } from "@/lib/school/site-content";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "El-Bethel International Academy is a private creche, nursery, primary and junior secondary school in Ushafa, Abuja, built around how children actually learn.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const { hero, story, timeline, vision, stats, values, anthem, accreditations, cta } = await getContent("about");

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        lede={hero.lede}
        breadcrumb={[{ label: "Home", href: "/" }, { label: "About", href: "/about" }]}
      />

      {story.visible ? (
        <section className="eb-section">
          <div className="eb-container grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <SectionHeading eyebrow={story.eyebrow} title={story.title} lede={story.lede} />
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {story.paragraphs.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" className="h-11 font-bold" render={<Link href={story.primary.href} />}>
                  {story.primary.label}
                  <ArrowRightIcon />
                </Button>
                <Button size="lg" variant="outline" className="h-11 font-bold" render={<Link href={story.secondary.href} />}>
                  {story.secondary.label}
                </Button>
              </div>
            </div>
            <Reveal>
              <ToneImage tone="navy" seed="about-story" media={story.image ?? undefined} label="El-Bethel International Academy campus" className="aspect-4/5 rounded-3xl" />
            </Reveal>
          </div>
        </section>
      ) : null}

      {timeline.visible && timeline.items.length ? (
        <section className="eb-section border-y bg-muted/40">
          <div className="eb-container">
            <SectionHeading eyebrow={timeline.eyebrow} title={timeline.title} lede={timeline.lede || undefined} align="center" />
            <ol className="relative mt-12 space-y-8 before:absolute before:top-2 before:bottom-2 before:left-[0.6875rem] before:w-px before:bg-border sm:before:left-1/2">
              {timeline.items.map((item, i) => (
                <Reveal key={`${item.label}-${i}`} delay={i * 0.05} as="li">
                  <div className={`relative pl-10 sm:w-1/2 sm:pl-0 ${i % 2 === 0 ? "sm:pr-12 sm:text-right" : "sm:ml-auto sm:pl-12"}`}>
                    <span
                      className={`absolute top-2 left-[0.3125rem] size-3.5 rounded-full bg-gold ring-4 ring-background sm:left-auto ${
                        i % 2 === 0 ? "sm:-right-[0.4375rem]" : "sm:-left-[0.4375rem]"
                      }`}
                    />
                    <p className="font-heading text-sm font-extrabold text-gold-foreground dark:text-gold">{item.label}</p>
                    <h3 className="mt-1 font-heading text-lg font-extrabold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {vision.visible ? (
        <section className="eb-section">
          <div className="eb-container grid gap-6 lg:grid-cols-2">
            <Reveal>
              <Card className="h-full gap-0 border-gold/25 p-8">
                <span className="eb-eyebrow">Our vision</span>
                <p className="mt-5 text-pretty font-heading text-xl leading-snug sm:text-2xl">{vision.vision}</p>
              </Card>
            </Reveal>
            <Reveal delay={0.08}>
              <Card className="h-full gap-0 bg-navy p-8 text-navy-foreground">
                <span className="inline-flex w-fit items-center rounded-full border border-gold/40 bg-gold/12 px-3 py-1 text-[0.68rem] font-extrabold tracking-[0.16em] text-gold uppercase">
                  Our mission
                </span>
                <p className="mt-5 text-pretty font-heading text-xl leading-snug sm:text-2xl">{vision.mission}</p>
              </Card>
            </Reveal>
          </div>
        </section>
      ) : null}

      {stats.visible && stats.items.length ? (
        <section className="bg-navy py-14 text-navy-foreground sm:py-20">
          <div className="eb-container grid gap-8 md:grid-cols-4">
            {stats.items.map((stat, i) => (
              <Reveal key={`${stat.label}-${i}`} delay={i * 0.05}>
                <div className="border-l border-gold/25 pl-5">
                  <p className="font-heading text-3xl leading-none font-extrabold text-gold sm:text-4xl">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-xs font-bold tracking-wide text-navy-foreground/60 uppercase">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {values.visible ? (
        <section className="eb-section">
          <div className="eb-container">
            <SectionHeading eyebrow={values.eyebrow} title={values.title} align="center" lede={values.lede} />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {values.items.map((value, i) => (
                <Reveal key={`${value.title}-${i}`} delay={i * 0.04}>
                  <Card className="h-full gap-0 p-6">
                    <span className="grid size-11 place-items-center rounded-2xl bg-gold/15 text-gold-foreground dark:text-gold">
                      <Icon name={value.icon} className="size-5" />
                    </span>
                    <h3 className="mt-4 font-heading text-base font-extrabold">{value.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{value.text}</p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {anthem.visible && anthem.stanzas.length ? (
        <section id="anthem" className="eb-section scroll-mt-24 border-y bg-muted/40">
          <div className="eb-container">
            <SectionHeading eyebrow={anthem.eyebrow} title={anthem.title} align="center" lede={anthem.lede} />
            <Reveal>
              <Card className="mx-auto mt-10 max-w-3xl gap-0 border-gold/25 bg-navy p-8 text-navy-foreground sm:p-12">
                <div className="space-y-9">
                  {anthem.stanzas.map((stanza, i) => (
                    <div key={`${stanza.label}-${i}`} className={stanza.chorus ? "rounded-2xl border border-gold/25 bg-gold/8 p-5 sm:p-6" : ""}>
                      <p className="text-[0.68rem] font-extrabold tracking-[0.16em] text-gold uppercase">{stanza.label}</p>
                      <p className="mt-3 text-pretty font-heading text-lg leading-relaxed sm:text-xl">
                        {stanza.lines.map((line, j) => (
                          <span key={j} className="block">
                            {line}
                          </span>
                        ))}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>
          </div>
        </section>
      ) : null}

      {accreditations.visible && accreditations.items.length ? (
        <section id="accreditations" className="eb-section scroll-mt-24">
          <div className="eb-container">
            <SectionHeading eyebrow={accreditations.eyebrow} title={accreditations.title} lede={accreditations.lede} />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accreditations.items.map((item, i) => (
                <Reveal key={`${item.title}-${i}`} delay={i * 0.04}>
                  <Card className="h-full gap-0 p-6">
                    <CheckCircle2Icon className="size-5 shrink-0 text-success" />
                    <h3 className="mt-4 font-heading text-base leading-snug font-extrabold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {cta.visible ? <CtaBand title={cta.title} text={cta.text} primary={cta.primary} secondary={cta.secondary} /> : null}
    </>
  );
}
