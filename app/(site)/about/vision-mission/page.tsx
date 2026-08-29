import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Icon } from "@/components/icon";
import { Reveal } from "@/components/motion";
import { Card } from "@/components/ui/card";
import { CORE_VALUES, MISSION, VISION } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "Vision & Mission",
  description:
    "The vision and mission of El-Bethel International Academy, a private creche, nursery, primary and junior secondary school in Abuja.",
  alternates: { canonical: "/about/vision-mission" },
};

const COMMITMENTS = [
  { title: "Every child known", icon: "Users", text: "A class teacher who knows your child's name, strengths and current stumbling block — not just their score." },
  { title: "Progress made visible", icon: "ChartColumn", text: "Continuous assessment, published results and a parent portal that shows the same data the school sees." },
  { title: "Safety without exception", icon: "ShieldCheck", text: "Controlled access, trained staff, a resident nurse and a release policy we do not bend." },
  { title: "Learning that transfers", icon: "Lightbulb", text: "Children should be able to use what they learn, not only repeat it. Practicals, projects and reasoning run through every year." },
];

export default function VisionMissionPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Vision & Mission"
        lede="What we are working towards, and how we intend to get there."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Vision & Mission", href: "/about/vision-mission" },
        ]}
      />

      <section className="eb-section">
        <div className="eb-container grid gap-6 lg:grid-cols-2">
          <Reveal>
            <Card className="h-full gap-0 border-gold/25 p-8 sm:p-10">
              <span className="eb-eyebrow">Vision</span>
              <p className="mt-6 text-pretty font-heading text-2xl leading-snug sm:text-3xl">{VISION}</p>
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                A vision is only useful if it can be tested. Ours is tested every term by our results,
                our retention, and by whether parents recommend us to their friends.
              </p>
            </Card>
          </Reveal>
          <Reveal delay={0.08}>
            <Card className="h-full gap-0 bg-navy p-8 text-navy-foreground sm:p-10">
              <span className="inline-flex w-fit items-center rounded-full border border-gold/40 bg-gold/12 px-3 py-1 text-[0.68rem] font-extrabold tracking-[0.16em] text-gold uppercase">
                Mission
              </span>
              <p className="mt-6 text-pretty font-heading text-2xl leading-snug sm:text-3xl">{MISSION}</p>
              <p className="mt-6 text-sm leading-relaxed text-navy-foreground/70">
                Safe. Stimulating. Inclusive. Each of those words carries an operational cost, and we
                budget for all three.
              </p>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="What this means in practice"
            title="Four commitments we can be held to"
            align="center"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {COMMITMENTS.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <Card className="flex h-full flex-row gap-4 p-6">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy text-gold">
                    <Icon name={item.icon} className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-heading text-base font-extrabold">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading eyebrow="Core values" title="The values underneath both" align="center" />
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {CORE_VALUES.map((value) => (
              <div key={value.name} className="flex items-center gap-2.5 rounded-full border bg-card py-2.5 pr-5 pl-2.5 shadow-sm">
                <span className="grid size-8 place-items-center rounded-full bg-gold/15 text-gold-foreground dark:text-gold">
                  <Icon name={value.icon} className="size-4" />
                </span>
                <span className="text-sm font-extrabold">{value.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
