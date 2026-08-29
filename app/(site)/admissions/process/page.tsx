import type { Metadata } from "next";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { Card } from "@/components/ui/card";
import { APPLICATION_STATUS } from "@/lib/school/format";
import type { ApplicationStatus } from "@/lib/school/types";
import { StatusPill } from "@/components/common";

export const metadata: Metadata = {
  title: "Admission Process",
  description:
    "The full El-Bethel International Academy admission process, from creating a parent account through assessment to enrolment.",
  alternates: { canonical: "/admissions/process" },
};

const STAGES = [
  {
    stage: "Before you apply",
    items: [
      { title: "Explore the school", text: "Read about our academics, facilities and fees. Book a physical or virtual tour if you would like to see us first." },
      { title: "Check availability", text: "Every class — Creche, Pre-School, Nursery 1–3, Primary 1–6 and JSS 1–3 — is currently accepting applications, though spaces in some are limited." },
    ],
  },
  {
    stage: "Applying",
    items: [
      { title: "Create a parent account", text: "Your email and a password. This same account becomes your Parent Portal login if your child is admitted." },
      { title: "Enter pupil information", text: "Name, date of birth, gender, nationality, previous school and home address." },
      { title: "Enter parent information", text: "Contact details, occupation and an emergency contact." },
      { title: "Upload documents", text: "Birth certificate or age declaration, passport photograph, medical information and guardian identification." },
      { title: "Review and pay", text: "Check every detail, then pay the ₦15,000 application fee online." },
      { title: "Submit", text: "You receive an application number immediately, in the format ADM-2026-00452." },
    ],
  },
  {
    stage: "After you apply",
    items: [
      { title: "Admissions review", text: "Our admissions team checks completeness and eligibility, usually within three working days." },
      { title: "Assessment", text: "Applicants take a short, age-appropriate assessment. Primary 1 applicants sit a gentle readiness task rather than a formal paper." },
      { title: "Family conversation", text: "A short meeting with the Headteacher or a deputy, so that we can meet your child and answer your questions." },
      { title: "Decision", text: "You receive a decision in your applicant dashboard and by email: accepted, conditionally accepted, waitlisted or not accepted." },
    ],
  },
  {
    stage: "Joining us",
    items: [
      { title: "Accept the offer", text: "Confirm acceptance and pay the registration fee to secure the place." },
      { title: "Enrolment", text: "A pupil record is created, a class is assigned and your Parent Portal is activated." },
      { title: "Settling in", text: "Uniform, book list, transport arrangements and — for new Primary 1 pupils — two short settling-in visits." },
    ],
  },
];

const ALL_STATUSES: ApplicationStatus[] = [
  "draft", "submitted", "under_review", "documents_required", "assessment_scheduled",
  "assessment_completed", "interview_scheduled", "accepted", "conditionally_accepted",
  "waitlisted", "not_accepted", "withdrawn", "enrolled",
];

export default function ProcessPage() {
  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Admission Process"
        lede="Everything that happens from your first click to your child's first day — and roughly how long each stage takes."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Admissions", href: "/admissions" },
          { label: "Process", href: "/admissions/process" },
        ]}
      />

      <section className="eb-section">
        <div className="eb-container max-w-4xl space-y-14">
          {STAGES.map((group, gi) => (
            <div key={group.stage}>
              <SectionHeading eyebrow={`Stage ${gi + 1}`} title={group.stage} />
              <ol className="relative mt-8 space-y-4 border-l pl-6">
                {group.items.map((item, i) => (
                  <Reveal key={item.title} delay={i * 0.04} as="li">
                    <span className="absolute -left-[0.4375rem] mt-2 size-3.5 rounded-full bg-gold ring-4 ring-background" />
                    <Card className="gap-0 p-5">
                      <h3 className="font-heading text-base font-extrabold">{item.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                    </Card>
                  </Reveal>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="eb-section border-t bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow="Transparency"
            title="Every status your application can hold"
            lede="You will always see exactly where your application stands — no ambiguity, no waiting in the dark."
            align="center"
          />
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
            {ALL_STATUSES.map((status) => (
              <StatusPill key={status} tone={APPLICATION_STATUS[status].tone}>
                {APPLICATION_STATUS[status].label}
              </StatusPill>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
