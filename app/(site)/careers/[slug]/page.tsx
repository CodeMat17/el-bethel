import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";

import { PageHero } from "@/components/common";
import { JobApplicationForm } from "@/components/site/job-application-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getVacancies, getVacancyBySlug } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";

export function generateStaticParams() {
  return getVacancies().map((vacancy) => ({ slug: vacancy.slug }));
}

export async function generateMetadata({ params }: PageProps<"/careers/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const vacancy = getVacancyBySlug(slug);
  if (!vacancy) return { title: "Vacancy not found" };
  return {
    title: vacancy.title,
    description: vacancy.summary,
    alternates: { canonical: `/careers/${vacancy.slug}` },
  };
}

export default async function VacancyPage({ params }: PageProps<"/careers/[slug]">) {
  const { slug } = await params;
  const vacancy = getVacancyBySlug(slug);
  if (!vacancy) notFound();

  return (
    <>
      <PageHero
        eyebrow={vacancy.department}
        title={vacancy.title}
        lede={vacancy.summary}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Careers", href: "/careers" },
          { label: vacancy.title, href: `/careers/${vacancy.slug}` },
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Badge className="h-7 bg-gold/20 px-3 font-bold text-gold">{vacancy.type}</Badge>
          <Badge className="h-7 bg-navy-foreground/10 px-3 font-bold text-navy-foreground">{vacancy.location}</Badge>
          <Badge className="h-7 bg-navy-foreground/10 px-3 font-bold text-navy-foreground">
            Closes {formatDate(vacancy.closingDate)}
          </Badge>
        </div>
      </PageHero>

      <section className="cw-section">
        <div className="cw-container grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Button variant="ghost" size="sm" className="mb-6 font-bold" render={<Link href="/careers" />}>
              <ArrowLeftIcon />
              All vacancies
            </Button>

            <h2 className="font-heading text-xl font-extrabold">Responsibilities</h2>
            <ul className="mt-4 space-y-2.5">
              {vacancy.responsibilities.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-foreground dark:text-gold">
                    <CheckIcon className="size-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <Separator className="my-8" />

            <h2 className="font-heading text-xl font-extrabold">Requirements</h2>
            <ul className="mt-4 space-y-2.5">
              {vacancy.requirements.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                    <CheckIcon className="size-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <Separator className="my-8" />

            <Card className="gap-0 border-info/30 bg-info/10 p-6">
              <h3 className="font-heading text-base font-extrabold">Safer recruitment</h3>
              <p className="mt-2 text-sm leading-relaxed">
                This appointment is subject to satisfactory references, identity and qualification
                verification and a background check. All staff complete safeguarding training before
                starting and refresh it annually.
              </p>
            </Card>
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <Card className="gap-0 p-6 sm:p-8">
              <h2 className="font-heading text-lg font-extrabold">Apply for this role</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Applications close on {formatDate(vacancy.closingDate)}.
              </p>
              <Separator className="my-6" />
              <JobApplicationForm vacancySlug={vacancy.slug} />
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
