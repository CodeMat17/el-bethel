import type { Metadata } from "next";
import { QuoteIcon } from "lucide-react";

import { CtaBand, PageHero } from "@/components/common";
import { Reveal, ToneImage } from "@/components/motion";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HEADTEACHER_MESSAGE, SCHOOL } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "Headteacher's Message",
  description:
    "A welcome message from Dr. Amaka N. Okafor, Headteacher of Crestwood Heights Academy, Abuja.",
  alternates: { canonical: "/about/headteacher" },
};

export default function HeadteacherPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Headteacher's Message"
        lede={`A welcome from ${SCHOOL.headteacher}.`}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Headteacher", href: "/about/headteacher" },
        ]}
      />

      <section className="cw-section">
        <div className="cw-container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal className="lg:sticky lg:top-28">
            <ToneImage tone="gold" seed="headteacher-portrait" sizes="(max-width: 1024px) 100vw, 40vw" label={SCHOOL.headteacher} className="aspect-4/5 rounded-3xl" />
            <Card className="mt-5 gap-0 p-5">
              <p className="font-heading text-lg font-extrabold">{SCHOOL.headteacher}</p>
              <p className="text-sm text-muted-foreground">Headteacher</p>
              <Separator className="my-4" />
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-bold text-muted-foreground uppercase">Qualifications</dt>
                  <dd className="mt-0.5">Ph.D Educational Leadership · M.Ed Curriculum Studies · B.Ed Primary Education</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-muted-foreground uppercase">At Crestwood since</dt>
                  <dd className="mt-0.5">2014</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-muted-foreground uppercase">Office hours</dt>
                  <dd className="mt-0.5">By appointment, Tuesdays and Thursdays</dd>
                </div>
              </dl>
            </Card>
          </Reveal>

          <Reveal delay={0.08}>
            <QuoteIcon className="size-10 text-gold/40" />
            <div className="mt-6 space-y-6">
              {HEADTEACHER_MESSAGE.map((paragraph, i) => (
                <p
                  key={paragraph.slice(0, 24)}
                  className={
                    i === 0
                      ? "text-pretty font-heading text-2xl leading-snug sm:text-3xl"
                      : "text-pretty leading-relaxed text-muted-foreground"
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>
            <Separator className="my-8" />
            <p className="font-heading text-lg font-extrabold">{SCHOOL.headteacher}</p>
            <p className="text-sm text-muted-foreground">Headteacher, {SCHOOL.name}</p>
          </Reveal>
        </div>
      </section>

      <CtaBand
        title="Come and see for yourself"
        text="The Headteacher hosts a short question-and-answer session at the end of every scheduled school tour."
        primary={{ label: "Book a school tour", href: "/contact/tour" }}
        secondary={{ label: "Contact the office", href: "/contact" }}
      />
    </>
  );
}
