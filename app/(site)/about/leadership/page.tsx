import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal, ToneImage } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getTeachers } from "@/lib/school/data";

export const metadata: Metadata = {
  title: "Leadership",
  description:
    "Meet the leadership team guiding El-Bethel International Academy — the Headteacher, deputies and heads of school.",
  alternates: { canonical: "/about/leadership" },
};

const NON_TEACHING = [
  { name: "Ngozi Adeleke", role: "School Administrator", remit: "Operations, admissions oversight, staffing and compliance." },
  { name: "Mr. Bola Ogunleye", role: "Accountant", remit: "Fees, invoicing, payment verification and financial reporting." },
  { name: "Mrs. Halima Sani", role: "Admissions Officer", remit: "Applications, assessments, interviews and enrolment." },
  { name: "Mr. Uche Nnaji", role: "Librarian", remit: "Catalogue, borrowing, reading programme and study support." },
  { name: "Mrs. Rita Eneh", role: "School Nurse", remit: "Medical centre, health records, screening and first aid." },
  { name: "Mr. Sunday Achi", role: "Head of Transport", remit: "Routes, drivers, attendants and pickup safety." },
];

export default function LeadershipPage() {
  const leaders = getTeachers().filter((t) => t.department === "Leadership");

  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Leadership"
        lede="The people responsible for the standard of education, care and safety your child receives."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Leadership", href: "/about/leadership" },
        ]}
      />

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading eyebrow="Academic leadership" title="Setting and holding the standard" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {leaders.map((leader, i) => (
              <Reveal key={leader.id} delay={i * 0.06}>
                <Card className="h-full gap-0 overflow-hidden p-0">
                  <ToneImage
                    tone={["navy", "gold", "info"][i % 3]}
                    seed={leader.avatarSeed}
                    kind="portrait"
                    label={`${leader.firstName} ${leader.lastName}`}
                    className="aspect-4/3"
                  />
                  <CardContent className="p-6">
                    <h3 className="font-heading text-lg font-extrabold">
                      {leader.title} {leader.firstName} {leader.lastName}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-gold-foreground dark:text-gold">
                      {leader.position}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{leader.bio}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {leader.qualifications.map((q) => (
                        <Badge key={q} variant="secondary" className="font-bold">{q}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="eb-section border-t bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Operations"
            title="The team that keeps the school running"
            lede="Teaching depends on everything around it working — admissions, finance, health, transport and the library."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NON_TEACHING.map((person, i) => (
              <Reveal key={person.name} delay={i * 0.04}>
                <Card className="h-full gap-0 p-6">
                  <h3 className="font-heading text-base font-extrabold">{person.name}</h3>
                  <p className="mt-0.5 text-sm font-semibold text-gold-foreground dark:text-gold">{person.role}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{person.remit}</p>
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
