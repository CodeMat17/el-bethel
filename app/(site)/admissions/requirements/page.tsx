import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, CheckCircle2Icon, InfoIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APPLICATION_DOCUMENT_REQUIREMENTS, CLASS_LEVELS } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "Admission Requirements",
  description:
    "Documents, age requirements and entry criteria for admission to Crestwood Heights Academy, Abuja.",
  alternates: { canonical: "/admissions/requirements" },
};

const DOC_NOTES: Record<string, string> = {
  birth_certificate: "A national birth certificate or a sworn declaration of age. Used to confirm the correct class placement.",
  passport: "A recent, clear photograph on a plain background. Used for the pupil record and identification card.",
  school_report: "The most recent report card from your child's current school. Required for Primary 1 and above where the child has been in school.",
  transfer: "A transfer letter or certificate from the previous school, where applicable.",
  medical: "Immunisation record, blood group, allergies and any condition our school nurse should know about.",
  guardian_id: "A national identity card, international passport, driver's licence or voter's card for the parent or guardian.",
  other: "Anything else you would like the admissions team to consider — for example an educational psychologist's report.",
};

const AGE_GUIDE = CLASS_LEVELS.map((level, i) => ({
  level: level.name,
  age: `${2 + i} – ${3 + i} years`,
}));

export default function RequirementsPage() {
  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Admission Requirements"
        lede="What we need from you, why we need it, and how to send it."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Admissions", href: "/admissions" },
          { label: "Requirements", href: "/admissions/requirements" },
        ]}
      />

      <section className="cw-section">
        <div className="cw-container grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <SectionHeading eyebrow="Documents" title="What to upload" />
            <div className="mt-8 grid gap-3">
              {APPLICATION_DOCUMENT_REQUIREMENTS.map((doc, i) => (
                <Reveal key={doc.key} delay={i * 0.04}>
                  <Card className="gap-0 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="flex items-center gap-2.5 font-heading text-base font-extrabold">
                        <CheckCircle2Icon className="size-4 shrink-0 text-success" />
                        {doc.label}
                      </h3>
                      <Badge variant={doc.required ? "default" : "secondary"} className="shrink-0 font-bold">
                        {doc.required ? "Required" : "If applicable"}
                      </Badge>
                    </div>
                    <p className="mt-2 pl-7 text-sm leading-relaxed text-muted-foreground">
                      {DOC_NOTES[doc.key]}
                    </p>
                  </Card>
                </Reveal>
              ))}
            </div>

            <Card className="mt-8 gap-0 border-info/30 bg-info/10 p-5">
              <h3 className="flex items-center gap-2 font-heading text-base font-extrabold">
                <InfoIcon className="size-4 text-info" />
                File formats and limits
              </h3>
              <p className="mt-2 text-sm leading-relaxed">
                We accept JPG, PNG, WEBP, PDF and DOCX files up to 5 MB each. Clear photographs of
                original documents are fine — just make sure every corner is visible and the text is
                readable. Uploaded documents are stored privately and are visible only to our admissions
                team.
              </p>
            </Card>
          </div>

          <div>
            <SectionHeading eyebrow="Age guide" title="Typical entry ages" lede="Age on 1 September of the year of entry. We consider readiness alongside age." />
            <div className="mt-8 overflow-hidden rounded-2xl border">
              {AGE_GUIDE.map((row, i) => (
                <div key={row.level} className={`flex items-center justify-between gap-3 px-5 py-3.5 ${i > 0 ? "border-t" : ""}`}>
                  <span className="text-sm font-bold">{row.level}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{row.age}</span>
                </div>
              ))}
            </div>

            <Card className="mt-8 gap-0 p-6">
              <h3 className="font-heading text-base font-extrabold">Entrance assessment</h3>
              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                <li>· <span className="font-semibold text-foreground">Primary 1 – 3</span> complete a short literacy and numeracy assessment appropriate to their age.</li>
                <li>· <span className="font-semibold text-foreground">Primary 4 – 6</span> complete literacy, numeracy and reasoning papers, plus a short reading aloud task.</li>
              </ul>
              <Button size="lg" className="mt-6 font-bold" render={<Link href="/admissions/apply" />}>
                Start your application
                <ArrowRightIcon />
              </Button>
            </Card>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
