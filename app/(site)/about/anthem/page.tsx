import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Icon } from "@/components/icon";
import { Reveal } from "@/components/motion";
import { Card } from "@/components/ui/card";
import { SCHOOL, SCHOOL_ANTHEM } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "School Anthem",
  description:
    "The words of the El-Bethel International Academy anthem — sung at assembly every morning, in speech days and at every school celebration.",
  alternates: { canonical: "/about/anthem" },
};

export default function AnthemPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="School Anthem"
        lede="Two verses and a chorus that our pupils sing at assembly each morning — and know by heart long before they leave us."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "School Anthem", href: "/about/anthem" },
        ]}
      />

      <section className="eb-section">
        <div className="eb-container">
          <Reveal>
            <Card className="mx-auto max-w-3xl gap-0 border-gold/25 bg-navy p-8 text-navy-foreground sm:p-12">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold">
                  <Icon name="Music" className="size-5" />
                </span>
                <div>
                  <p className="font-heading text-lg font-extrabold text-gold sm:text-xl">
                    {SCHOOL.name} Anthem
                  </p>
                  <p className="text-xs font-bold tracking-wide text-navy-foreground/60 uppercase">
                    Sung at morning assembly
                  </p>
                </div>
              </div>

              <div className="mt-10 space-y-9">
                {SCHOOL_ANTHEM.map((stanza, i) => (
                  <Reveal key={`${stanza.label}-${i}`} delay={i * 0.06}>
                    <div
                      className={
                        stanza.kind === "chorus"
                          ? "rounded-2xl border border-gold/25 bg-gold/8 p-5 sm:p-6"
                          : ""
                      }
                    >
                      <p className="text-[0.68rem] font-extrabold tracking-[0.16em] text-gold uppercase">
                        {stanza.label}
                      </p>
                      <p className="mt-3 text-pretty font-heading text-lg leading-relaxed sm:text-xl">
                        {stanza.lines.map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="eb-section border-t bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Why it matters"
            title="A shared set of words"
            align="center"
            lede="The anthem carries our motto — knowledge and the fear of God — into every school day. Pupils learn it in their first term, and it opens assembly, speech day and every school celebration."
          />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
