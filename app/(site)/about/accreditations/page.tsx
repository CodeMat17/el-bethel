import type { Metadata } from "next";
import { CheckCircle2Icon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAchievements } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = {
  title: "Accreditations & Awards",
  description:
    "Registration, accreditation and recognition held by El-Bethel International Academy, Abuja.",
  alternates: { canonical: "/about/accreditations" },
};

const ACCREDITATIONS = [
  { title: "FCT Universal Basic Education Board", detail: "Registered private creche, nursery, primary and junior secondary school, Federal Capital Territory.", year: "Registered" },
  { title: "Federal Ministry of Education", detail: "Approved to deliver the Nigerian national primary curriculum.", year: "Since 2013" },
  { title: "National Association of Proprietors of Private Schools", detail: "Member in good standing, FCT chapter.", year: "Since 2015" },
  { title: "Child Safeguarding Standards", detail: "Annual independent safeguarding and child protection review.", year: "Renewed 2026" },
  { title: "Fire & Building Safety Certification", detail: "Campus inspected and certified annually by the FCT fire service.", year: "Renewed 2026" },
  { title: "Food Handling & Hygiene Permit", detail: "Cafeteria licensed and inspected by the FCT public health authority.", year: "Renewed 2026" },
];

const SCHOOL_AWARDS = [
  { year: "2025", title: "FCT Primary Schools Robotics Challenge — Runners-up", body: "Our Primary 5 and 6 team placed second across fourteen competing schools." },
  { year: "2024", title: "Abuja Reading Initiative — School of the Year", body: "Recognised for the highest per-pupil reading participation in the district." },
  { year: "2023", title: "Best Kept Primary School Grounds, Ushafa", body: "Awarded for our gardening programme and campus maintenance." },
  { year: "2022", title: "Excellence in Parent Engagement", body: "Recognised for our digital classroom and parent communication programme." },
];

export default function AccreditationsPage() {
  const achievements = getAchievements().slice(0, 6);

  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Accreditations & Awards"
        lede="The registrations we hold, the standards we are inspected against, and the recognition our community has earned."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Accreditations", href: "/about/accreditations" },
        ]}
      />

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Accreditation"
            title="Registered, approved and inspected"
            lede="Every certificate below is available for inspection at the school office on request."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ACCREDITATIONS.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.04}>
                <Card className="h-full gap-0 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <CheckCircle2Icon className="size-5 shrink-0 text-success" />
                    <Badge variant="secondary" className="font-bold">{item.year}</Badge>
                  </div>
                  <h3 className="mt-4 font-heading text-base leading-snug font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading eyebrow="School awards" title="Recognition for the whole school" />
          <ol className="mt-10 space-y-4">
            {SCHOOL_AWARDS.map((award, i) => (
              <Reveal key={award.title} delay={i * 0.05} as="li">
                <Card className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center">
                  <span className="w-16 shrink-0 font-heading text-2xl font-extrabold text-gold-foreground dark:text-gold">
                    {award.year}
                  </span>
                  <div>
                    <h3 className="font-heading text-base font-extrabold">{award.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{award.body}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading eyebrow="Our Stars" title="Recent pupil achievements" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement, i) => (
              <Reveal key={achievement.id} delay={i * 0.04}>
                <Card className="h-full gap-0 border-gold/20 p-5">
                  <Badge className="w-fit bg-gold/15 font-bold text-gold-foreground dark:text-gold">
                    {achievement.category}
                  </Badge>
                  <h3 className="mt-3 font-heading text-base leading-snug font-extrabold">{achievement.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{achievement.description}</p>
                  <p className="mt-4 text-xs font-semibold text-muted-foreground">
                    {achievement.studentInitials} · {achievement.classLabel} · {formatDate(achievement.date)}
                  </p>
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
