import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Icon } from "@/components/icon";
import { Counter, Reveal, ToneImage } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CORE_VALUES, MISSION, SCHOOL, SCHOOL_STATS, VISION } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "El-Bethel International Academy is a private Primary School in Ushafa, Abuja, built around how children actually learn.",
  alternates: { canonical: "/about" },
};

const TIMELINE = [
  { label: "The beginning", title: "Two classrooms in Ushafa", text: "El-Bethel International opened with 31 pupils, four teachers and a conviction that primary education in Abuja could be warmer and more rigorous at the same time." },
  { label: "First graduates", title: "First Primary 6 cohort", text: "Our first cohort completed Primary 6 and moved on to secondary schools across Abuja and beyond." },
  { label: "Innovation", title: "ICT & Innovation Lab", text: "We opened a dedicated lab and introduced coding and robotics from Primary 3 upwards." },
  { label: "Going digital", title: "Digital classrooms", text: "Every class gained a digital classroom, giving parents visibility of assignments, attendance and results." },
  { label: "Growth", title: "Campus expansion", text: "New science laboratory, expanded library and a refurbished creative arts studio." },
  { label: "Today", title: "390 pupils, 34 teachers", text: "Fifteen classes across six levels, with a pupil-to-teacher ratio of twelve to one." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="A school built around how children actually learn"
        lede={`Based in Ushafa, Abuja, ${SCHOOL.name} has grown from two classrooms into a community of 390 pupils — without ever losing sight of the individual child.`}
        breadcrumb={[{ label: "Home", href: "/" }, { label: "About", href: "/about" }]}
      />

      <section className="eb-section">
        <div className="eb-container grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Our story"
              title="It started with a question"
              lede="Why should a child have to choose between a school that is academically serious and one that is genuinely kind?"
            />
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>
                A small group of Abuja educators and parents opened El-Bethel International Academy
                with thirty-one pupils. The premise was simple: children learn best when they feel safe,
                valued and challenged — in that order.
              </p>
              <p>
                That premise has not changed, but the school around it has. We now
                teach six class levels across fifteen classes, with a science laboratory, an ICT and
                innovation lab, a library, a creative arts studio and full sporting facilities.
              </p>
              <p>
                What has stayed constant is the relationship at the centre of it all: a class teacher who
                knows your child, and a school that keeps you genuinely informed about how they are doing.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="h-11 font-bold" render={<Link href="/about/headteacher" />}>
                Headteacher&apos;s message
                <ArrowRightIcon />
              </Button>
              <Button size="lg" variant="outline" className="h-11 font-bold" render={<Link href="/about/teachers" />}>
                Meet our teachers
              </Button>
            </div>
          </div>
          <Reveal>
            <ToneImage tone="navy" seed="about-story" label="El-Bethel International Academy campus" className="aspect-4/5 rounded-3xl" />
          </Reveal>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading eyebrow="Milestones" title="Our journey, told in six moments" align="center" />
          <ol className="relative mt-12 space-y-8 before:absolute before:top-2 before:bottom-2 before:left-[0.6875rem] before:w-px before:bg-border sm:before:left-1/2">
            {TIMELINE.map((item, i) => (
              <Reveal key={item.label} delay={i * 0.05} as="li">
                <div
                  className={`relative pl-10 sm:w-1/2 sm:pl-0 ${
                    i % 2 === 0 ? "sm:pr-12 sm:text-right" : "sm:ml-auto sm:pl-12"
                  }`}
                >
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

      <section className="eb-section">
        <div className="eb-container grid gap-6 lg:grid-cols-2">
          <Reveal>
            <Card className="h-full gap-0 border-gold/25 p-8">
              <span className="eb-eyebrow">Our vision</span>
              <p className="mt-5 text-pretty font-heading text-xl leading-snug sm:text-2xl">{VISION}</p>
            </Card>
          </Reveal>
          <Reveal delay={0.08}>
            <Card className="h-full gap-0 bg-navy p-8 text-navy-foreground">
              <span className="inline-flex w-fit items-center rounded-full border border-gold/40 bg-gold/12 px-3 py-1 text-[0.68rem] font-extrabold tracking-[0.16em] text-gold uppercase">
                Our mission
              </span>
              <p className="mt-5 text-pretty font-heading text-xl leading-snug sm:text-2xl">{MISSION}</p>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="bg-navy py-14 text-navy-foreground sm:py-20">
        <div className="eb-container grid gap-8 md:grid-cols-4">
          {SCHOOL_STATS.slice(0, 4).map((stat, i) => (
            <Reveal key={stat.key} delay={i * 0.05}>
              <div className="border-l border-gold/25 pl-5">
                <p className="font-heading text-3xl leading-none font-extrabold text-gold sm:text-4xl">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-xs font-bold tracking-wide text-navy-foreground/60 uppercase">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Core values"
            title="Seven values we teach, model and expect"
            align="center"
            lede="These are not posters on a wall. They appear in our conduct ratings on every report card."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CORE_VALUES.map((value, i) => (
              <Reveal key={value.name} delay={i * 0.04}>
                <Card className="h-full gap-0 p-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-gold/15 text-gold-foreground dark:text-gold">
                    <Icon name={value.icon} className="size-5" />
                  </span>
                  <h3 className="mt-4 font-heading text-base font-extrabold">{value.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{value.text}</p>
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
