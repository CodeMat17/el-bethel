import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, BriefcaseIcon, MapPinIcon } from "lucide-react";

import { CtaBand, EmptyState, PageHero, SectionHeading } from "@/components/common";
import { Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getVacancies } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Teaching and support vacancies at Crestwood Heights Academy, a private Primary School in Jabi, Abuja.",
  alternates: { canonical: "/careers" },
};

const WHY_WORK_HERE = [
  { title: "Planning time that is protected", text: "Non-contact time is timetabled, not theoretical. Teachers plan and mark within the school day." },
  { title: "Professional development budget", text: "Every teacher has an annual development allowance and two funded training days." },
  { title: "Small classes", text: "An average class size of 24 and an assistant teacher in every lower primary room." },
  { title: "A leadership team that teaches", text: "Our Headteacher and deputies still take lessons. Decisions are made by people who are in classrooms." },
];

export default function CareersPage() {
  const vacancies = getVacancies().filter((v) => v.status === "open");

  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Join our teaching community"
        lede="We recruit people who are rigorous about learning and warm with children — in that combination, not one or the other."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Careers", href: "/careers" }]}
      />

      <section className="cw-section">
        <div className="cw-container">
          <SectionHeading eyebrow="Open roles" title={`${vacancies.length} current vacancies`} />
          {vacancies.length === 0 ? (
            <EmptyState
              className="mt-10"
              icon="Briefcase"
              title="No vacancies at the moment"
              description="We keep speculative applications on file for six months. Send yours to the school office and we will be in touch when something opens."
              action={
                <Button size="lg" className="font-bold" render={<Link href="/contact" />}>
                  Contact the school
                </Button>
              }
            />
          ) : (
            <div className="mt-10 grid gap-4 lg:grid-cols-2">
              {vacancies.map((vacancy, i) => (
                <Reveal key={vacancy.id} delay={i * 0.05}>
                  <Link href={`/careers/${vacancy.slug}`} className="group block h-full">
                    <Card className="flex h-full flex-col gap-0 p-6 transition-all group-hover:-translate-y-1 group-hover:border-gold/40 group-hover:shadow-lg">
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy text-gold">
                          <BriefcaseIcon className="size-5" />
                        </span>
                        <Badge variant="secondary" className="font-bold">{vacancy.type}</Badge>
                      </div>
                      <h2 className="mt-4 font-heading text-lg font-extrabold group-hover:text-primary dark:group-hover:text-gold">
                        {vacancy.title}
                      </h2>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{vacancy.summary}</p>
                      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <MapPinIcon className="size-3.5" /> {vacancy.location}
                        </span>
                        <span>{vacancy.department}</span>
                        <span>Closes {formatDate(vacancy.closingDate)}</span>
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary dark:text-gold">
                        View role and apply <ArrowRightIcon className="size-4" />
                      </span>
                    </Card>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="cw-section border-t bg-muted/40">
        <div className="cw-container">
          <SectionHeading eyebrow="Why work here" title="What we offer our staff" align="center" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_WORK_HERE.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <Card className="h-full gap-0 p-6">
                  <h3 className="font-heading text-base font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
          <Card className="mt-8 gap-0 border-info/30 bg-info/10 p-6">
            <h3 className="font-heading text-base font-extrabold">Safer recruitment</h3>
            <p className="mt-2 text-sm leading-relaxed">
              Every appointment at Crestwood Heights Academy is subject to satisfactory references,
              identity and qualification verification, and a background check. All staff complete
              safeguarding training before starting and refresh it annually.
            </p>
          </Card>
        </div>
      </section>

      <CtaBand
        title="Not the right role, but the right school?"
        text="Send a speculative application to the school office. We keep them on file for six months and review them whenever a post opens."
        primary={{ label: "Contact the school", href: "/contact" }}
        secondary={{ label: "Read about our approach", href: "/academics/approach" }}
      />
    </>
  );
}
