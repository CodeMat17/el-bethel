import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, CheckCircle2Icon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading, StatusPill } from "@/components/common";
import { Icon } from "@/components/icon";
import { Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ADMISSION_FEES,
  ADMISSION_OPEN_LEVELS,
  APPLICATION_DOCUMENT_REQUIREMENTS,
  CLASS_LEVELS,
  STAGE_LABELS,
  SCHOOL,
} from "@/lib/school/config";
import { getFaqs } from "@/lib/school/data";
import { money } from "@/lib/school/format";

export const metadata: Metadata = {
  title: "Admissions",
  description:
    "Admission to El-Bethel International Academy, Abuja is open for the 2026/2027 session — Creche, Pre-School, Nursery 1–3, Primary 1–6 and JSS 1–3. Apply online in seven steps.",
  alternates: { canonical: "/admissions" },
};

const STEPS = [
  { title: "Create an account", text: "One account, used for your application and later for the Parent Portal.", icon: "UserRound" },
  { title: "Complete the form", text: "Pupil details, parent details and your intended class. Saved as you go.", icon: "PenLine" },
  { title: "Upload documents", text: "Birth certificate, passport photograph, medical information and identification.", icon: "FileCheck" },
  { title: "Pay the application fee", text: `${money(ADMISSION_FEES[0].amount)}, paid securely online.`, icon: "CreditCard" },
  { title: "Submit and track", text: "Receive your application number and follow every update in one place.", icon: "Search" },
  { title: "Assessment and decision", text: "Age-appropriate assessment, a short family conversation, then a decision.", icon: "BadgeCheck" },
];

export default function AdmissionsPage() {
  const openLevels = CLASS_LEVELS.filter((l) => ADMISSION_OPEN_LEVELS.includes(l.id));
  const closedLevels = CLASS_LEVELS.filter((l) => !ADMISSION_OPEN_LEVELS.includes(l.id));
  const faqs = getFaqs().filter((f) => f.category === "Admissions").slice(0, 4);

  return (
    <>
      <PageHero
        eyebrow={`${SCHOOL.session} admission`}
        title="Admission is open"
        lede="Admission is open for every class — Creche, Pre-School, Nursery 1–3, Primary 1–6 and JSS 1–3 — for the 2026/2027 session. Limited spaces are available in some classes."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Admissions", href: "/admissions" }]}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="h-12 bg-gold font-bold text-gold-foreground hover:bg-gold/85" render={<Link href="/admissions/apply" />}>
            Apply online
            <ArrowRightIcon />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 border-navy-foreground/25 bg-transparent font-bold text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"
            render={<Link href="/contact/tour" />}
          >
            Book a school tour
          </Button>
        </div>
      </PageHero>

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Availability"
            title="Which classes are open"
            lede="Availability changes as places are filled. The classes below reflect today's position."
          />
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
                    <p className="mt-0.5 text-xs text-muted-foreground">Primary</p>
                  </div>
                  <StatusPill tone="neutral">Waiting list</StatusPill>
                </Card>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 rounded-xl border border-gold/30 bg-gold/10 px-5 py-4 text-sm font-semibold">
            Limited spaces are available in some classes. Applications are considered in the order they
            are completed.
          </p>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="How it works"
            title="Six steps from enquiry to enrolment"
            align="center"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.05}>
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
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button size="lg" variant="outline" className="h-11 font-bold" render={<Link href="/admissions/process" />}>
              The full admission process
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
      </section>

      <section className="eb-section">
        <div className="eb-container grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Requirements"
              title="What you will need"
              lede="Photographs of original documents are accepted, provided every corner is visible."
            />
            <ul className="mt-8 grid gap-2.5">
              {APPLICATION_DOCUMENT_REQUIREMENTS.map((doc) => (
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

          <div>
            <SectionHeading eyebrow="Admission fees" title="One-off admission costs" lede="These are separate from termly school fees and are clearly marked as demo values in this environment." />
            <div className="mt-8 overflow-hidden rounded-2xl border">
              {ADMISSION_FEES.map((fee, i) => (
                <div
                  key={fee.label}
                  className={`flex items-center justify-between gap-3 px-5 py-4 ${i > 0 ? "border-t" : ""}`}
                >
                  <span className="text-sm font-semibold">{fee.label}</span>
                  <span className="font-heading text-base font-extrabold tabular-nums">{money(fee.amount)}</span>
                </div>
              ))}
            </div>
            <Button size="lg" variant="outline" className="mt-6 font-bold" render={<Link href="/admissions/fees" />}>
              See full fee schedule
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
      </section>

      <section className="eb-section border-t bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Questions"
            title="Admissions FAQs"
            action={
              <Button variant="outline" size="lg" className="font-bold" render={<Link href="/admissions/faqs" />}>
                All questions
                <ArrowRightIcon />
              </Button>
            }
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {faqs.map((faq, i) => (
              <Reveal key={faq.id} delay={i * 0.05}>
                <Card className="h-full gap-0 p-6">
                  <h3 className="font-heading text-base font-extrabold">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
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
