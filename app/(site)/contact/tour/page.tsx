import type { Metadata } from "next";
import { CheckIcon } from "lucide-react";

import { PageHero, SectionHeading } from "@/components/common";
import { TourForm } from "@/components/site/tour-form";
import { Reveal } from "@/components/motion";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ADMISSION_OPEN_LEVELS, CLASS_LEVELS, SCHOOL } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "Book a School Tour",
  description:
    "Book a physical school tour, a virtual tour or an admission consultation at Crestwood Heights Academy, Abuja.",
  alternates: { canonical: "/contact/tour" },
};

const OPEN_LEVELS = CLASS_LEVELS.filter((l) => ADMISSION_OPEN_LEVELS.includes(l.id)).map((l) => ({
  id: l.id,
  name: l.name,
}));

const WHAT_YOU_SEE = [
  "Classrooms during a normal lesson — not a staged showcase",
  "The ICT and innovation lab, science laboratory and library",
  "The creative arts studio and sports facilities",
  "The cafeteria, medical centre and playground",
  "Time with a member of the leadership team for your questions",
];

export default function TourPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Book a school tour"
        lede="Come and see a normal school day. We do not rehearse for tours — what you see is what your child would experience."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Contact", href: "/contact" },
          { label: "Book a tour", href: "/contact/tour" },
        ]}
      />

      <section className="cw-section">
        <div className="cw-container grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Card className="gap-0 p-6 sm:p-8">
            <h2 className="font-heading text-lg font-extrabold sm:text-xl">Request a visit</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Tell us when suits you and we will confirm by phone or email within one working day.
            </p>
            <Separator className="my-7" />
            <TourForm levels={OPEN_LEVELS} />
          </Card>

          <div className="space-y-4">
            <Card className="gap-0 p-6">
              <h2 className="font-heading text-base font-extrabold">What you will see</h2>
              <Separator className="my-5" />
              <ul className="space-y-3">
                {WHAT_YOU_SEE.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                      <CheckIcon className="size-3" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="gap-0 p-6">
              <h2 className="font-heading text-base font-extrabold">Practical details</h2>
              <Separator className="my-5" />
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-bold text-muted-foreground uppercase">Duration</dt>
                  <dd className="mt-0.5">About 45 minutes, including time for questions.</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-muted-foreground uppercase">When</dt>
                  <dd className="mt-0.5">Weekdays during term time, {SCHOOL.officeHours.split(", ")[1]}.</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-muted-foreground uppercase">Bring your child</dt>
                  <dd className="mt-0.5">Very welcome — children usually tell us more in ten minutes than a brochure can.</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-muted-foreground uppercase">Arrival</dt>
                  <dd className="mt-0.5">Report to the security gate on {SCHOOL.address.split(",")[0]} with a photo ID.</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </section>

      <section className="cw-section border-t bg-muted/40">
        <div className="cw-container">
          <SectionHeading eyebrow="Three ways to visit" title="Choose what suits your family" align="center" />
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { title: "Physical tour", text: "Walk the campus during a live school day, meet teachers and see the facilities in use." },
              { title: "Virtual tour", text: "A guided video walkthrough with a member of the admissions team, ideal if you are relocating." },
              { title: "Admission consultation", text: "A focused conversation about your child's needs, the right class and the application process." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.06}>
                <Card className="h-full gap-0 p-6">
                  <h3 className="font-heading text-base font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
