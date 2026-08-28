import type { Metadata } from "next";
import { CheckIcon } from "lucide-react";

import { CtaBand, PageHero } from "@/components/common";
import { Icon } from "@/components/icon";
import { Reveal, ToneImage } from "@/components/motion";
import { Card } from "@/components/ui/card";
import { FACILITIES } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "Facilities",
  description:
    "Smart classrooms, an ICT and innovation lab, science laboratory, library, creative arts studio, sports facilities and more at Crestwood Heights Academy, Abuja.",
  alternates: { canonical: "/school-life/facilities" },
};

const TONES = ["navy", "gold", "info", "success", "plum"];

export default function FacilitiesPage() {
  return (
    <>
      <PageHero
        eyebrow="School life"
        title="Facilities"
        lede="Fourteen spaces designed around small people — from a child-safe science laboratory to a soft-surface playground."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "School Life", href: "/school-life" },
          { label: "Facilities", href: "/school-life/facilities" },
        ]}
      />

      {/* Quick jump */}
      <section className="border-b bg-muted/40 py-6">
        <div className="cw-container flex flex-wrap gap-2">
          {FACILITIES.map((facility) => (
            <a
              key={facility.id}
              href={`#${facility.slug}`}
              className="rounded-full border bg-card px-3.5 py-1.5 text-xs font-bold transition-colors hover:border-gold/50 hover:bg-accent"
            >
              {facility.name}
            </a>
          ))}
        </div>
      </section>

      <section className="cw-section">
        <div className="cw-container space-y-6">
          {FACILITIES.map((facility, i) => (
            <Reveal key={facility.id} delay={0.03}>
              <Card
                id={facility.slug}
                className="grid gap-0 overflow-hidden p-0 scroll-mt-28 lg:grid-cols-2"
              >
                <ToneImage
                  tone={TONES[i % TONES.length]}
                  seed={facility.slug}
                  label={facility.name}
                  className={`aspect-16/10 lg:aspect-auto lg:min-h-64 ${i % 2 === 1 ? "lg:order-2" : ""}`}
                />
                <div className="p-6 sm:p-8">
                  <span className="grid size-11 place-items-center rounded-2xl bg-navy text-gold">
                    <Icon name={facility.icon} className="size-5" />
                  </span>
                  <h2 className="mt-4 font-heading text-xl font-extrabold sm:text-2xl">{facility.name}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{facility.description}</p>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {facility.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2 text-sm font-medium">
                        <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                          <CheckIcon className="size-2.5" strokeWidth={3} />
                        </span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <CtaBand
        title="See the campus for yourself"
        text="Tours run every week during term time and take about forty-five minutes, including time with a member of the leadership team."
        primary={{ label: "Book a school tour", href: "/contact/tour" }}
        secondary={{ label: "View the gallery", href: "/school-life/gallery" }}
      />
    </>
  );
}
