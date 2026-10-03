import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, ClockIcon, MailIcon, MapPinIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";

import { PageHero, SectionHeading } from "@/components/common";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { Reveal, ToneImage } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SCHOOL } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact El-Bethel International Academy, No.3 Engr. Demola Oduneye Avenue, Opposite Ushafa Mini Stadium, Ushafa, Abuja. Phone 0812 390 8499 or send an enquiry online.",
  alternates: { canonical: "/contact" },
};

const DEPARTMENTS = [
  { name: "Admissions", email: SCHOOL.admissionsEmail, detail: "Applications, assessments and enrolment." },
  { name: "Accounts", email: "accounts@elbethel.edu.ng", detail: "Invoices, payments, receipts and payment plans." },
  { name: "Academics", email: "academics@elbethel.edu.ng", detail: "Curriculum, results, report cards and learning support." },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to us"
        lede="We answer enquiries within one working day. For anything urgent, please call the school office."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Contact", href: "/contact" }]}
      />

      <section className="eb-section">
        <div className="eb-container grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <Card className="gap-0 p-6">
              <h2 className="font-heading text-lg font-extrabold">School office</h2>
              <Separator className="my-5" />
              <ul className="space-y-5 text-sm">
                <li className="flex gap-3">
                  <MapPinIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>
                    <span className="block font-bold">Address</span>
                    <span className="mt-0.5 block text-muted-foreground">{SCHOOL.address}</span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <PhoneIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>
                    <span className="block font-bold">Phone</span>
                    <a href={`tel:${SCHOOL.phoneHref}`} className="mt-0.5 block text-muted-foreground hover:text-foreground">
                      {SCHOOL.phone}
                    </a>
                    <a href={`tel:${SCHOOL.phoneAltHref}`} className="mt-0.5 block text-muted-foreground hover:text-foreground">
                      {SCHOOL.phoneAlt}
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <MessageCircleIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>
                    <span className="block font-bold">WhatsApp</span>
                    <a href={SCHOOL.whatsappHref} target="_blank" rel="noreferrer noopener" className="mt-0.5 block text-muted-foreground hover:text-foreground">
                      {SCHOOL.whatsapp}
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <MailIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>
                    <span className="block font-bold">Email</span>
                    <a href={`mailto:${SCHOOL.email}`} className="mt-0.5 block text-muted-foreground hover:text-foreground">
                      {SCHOOL.email}
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <ClockIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>
                    <span className="block font-bold">Office hours</span>
                    <span className="mt-0.5 block text-muted-foreground">{SCHOOL.officeHours}</span>
                  </span>
                </li>
              </ul>
            </Card>

            <Card className="gap-0 overflow-hidden p-0">
              <div className="relative">
                <ToneImage tone="navy" seed="map-jabi" label="Aerial view of Abuja, where our Ushafa campus sits" className="aspect-4/3" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="rounded-2xl bg-background/92 px-5 py-4 text-center backdrop-blur">
                    <MapPinIcon className="mx-auto size-5 text-gold" />
                    <p className="mt-2 font-heading text-sm font-extrabold">{SCHOOL.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Ushafa, Abuja</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 font-bold"
                      render={
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SCHOOL.address)}`}
                          target="_blank"
                          rel="noreferrer noopener"
                        />
                      }
                    >
                      Open in Maps
                      <ArrowRightIcon />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="gap-0 border-gold/25 bg-gold/8 p-6">
              <h2 className="font-heading text-base font-extrabold">Ready to apply?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Admission is open for the 2026/2027 session. Start an application online and save it as you go.
              </p>
              <Button className="mt-4 w-full font-bold" size="lg" render={<Link href="/admissions/apply" />}>
                Apply for admission
                <ArrowRightIcon />
              </Button>
            </Card>
          </div>

          <div>
            <Card className="gap-0 p-6 sm:p-8">
              <h2 className="font-heading text-lg font-extrabold sm:text-xl">Send us an enquiry</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Tell us what you need and the right person will come back to you.
              </p>
              <Separator className="my-7" />
              <EnquiryForm />
            </Card>
          </div>
        </div>
      </section>

      <section className="eb-section border-t bg-muted/40">
        <div className="eb-container">
          <SectionHeading eyebrow="Departments" title="Contact the right team directly" align="center" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DEPARTMENTS.map((dept, i) => (
              <Reveal key={dept.name} delay={i * 0.05}>
                <Card className="h-full gap-0 p-6">
                  <h3 className="font-heading text-base font-extrabold">{dept.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{dept.detail}</p>
                  <a
                    href={`mailto:${dept.email}`}
                    className="mt-4 block truncate text-sm font-bold text-primary underline-offset-4 hover:underline dark:text-gold"
                  >
                    {dept.email}
                  </a>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
