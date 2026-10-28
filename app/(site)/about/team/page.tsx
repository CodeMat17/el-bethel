import type { Metadata } from "next";
import { QuoteIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal, ToneImage } from "@/components/motion";
import { TeacherDirectory, type DirectoryTeacher } from "@/components/site/teacher-directory";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { teacherName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { getTeachers } from "@/lib/school/site-data";
import { getContent, getSchool } from "@/lib/school/site-content";

export const metadata: Metadata = {
  title: "Our Team",
  description:
    "Meet the Headteacher, leadership, operations staff and teachers of El-Bethel International Academy, Abuja.",
  alternates: { canonical: "/about/team" },
};

export default async function TeamPage() {
  const [dir, allTeachers, SCHOOL, page] = await Promise.all([getDirectory(), getTeachers(), getSchool(), getContent("team")]);
  const { hero, headteacher, leadership, office, cta } = page;
  const leaders = allTeachers.filter((t) => t.department === "Leadership");
  const teachers: DirectoryTeacher[] = allTeachers
    .filter((t) => t.active)
    .map((t) => ({
      id: t.id,
      name: teacherName(t),
      position: t.position,
      department: t.department,
      subjects: t.subjectIds.map((id) => dir.subjectName(id) ?? "").filter(Boolean),
      experienceYears: t.experienceYears,
      qualifications: t.qualifications,
      bio: t.bio,
      avatarSeed: t.avatarSeed,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        lede={hero.lede}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Our Team", href: "/about/team" },
        ]}
      />

      {headteacher.visible ? (
      <section id="headteacher" className="eb-section scroll-mt-24">
        <div className="eb-container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal className="lg:sticky lg:top-28">
            <ToneImage tone="gold" seed="headteacher-portrait" media={headteacher.image ?? undefined} sizes="(max-width: 1024px) 100vw, 40vw" label={SCHOOL.headteacher} className="aspect-4/5 rounded-3xl" />
          </Reveal>

          <Reveal delay={0.08}>
            <span className="eb-eyebrow">{headteacher.eyebrow}</span>
            <QuoteIcon className="mt-6 size-10 text-gold/40" />
            <div className="mt-6 space-y-6">
              {headteacher.paragraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? "text-pretty font-heading text-2xl leading-snug sm:text-3xl"
                      : "text-pretty leading-relaxed text-muted-foreground"
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>
            <Separator className="my-8" />
            <p className="font-heading text-lg font-extrabold">{SCHOOL.headteacher}</p>
            <p className="text-sm text-muted-foreground">{headteacher.signoff}</p>
          </Reveal>
        </div>
      </section>
      ) : null}

      {leadership.visible || office.visible ? (
      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          {leadership.visible && leaders.length ? (
          <>
          <SectionHeading eyebrow={leadership.eyebrow} title={leadership.title} lede={leadership.lede} />
          <div className="mt-10 mb-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          </>
          ) : null}

          {office.visible && office.people.length ? (
          <>
          <h3 className="font-heading text-lg font-extrabold">{office.title}</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {office.people.map((person, i) => (
              <Reveal key={`${person.name}-${i}`} delay={i * 0.04}>
                <Card className="h-full gap-0 p-6">
                  <h4 className="font-heading text-base font-extrabold">{person.name}</h4>
                  <p className="mt-0.5 text-sm font-semibold text-gold-foreground dark:text-gold">{person.role}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{person.remit}</p>
                </Card>
              </Reveal>
            ))}
          </div>
          </>
          ) : null}
        </div>
      </section>
      ) : null}

      {page.teachers.visible ? (
        <section id="teachers" className="eb-section scroll-mt-24">
          <div className="eb-container">
            <SectionHeading eyebrow={page.teachers.eyebrow} title={page.teachers.title} lede={page.teachers.lede} className="mb-10" />
            <TeacherDirectory teachers={teachers} />
          </div>
        </section>
      ) : null}

      {cta.visible ? <CtaBand title={cta.title} text={cta.text} primary={cta.primary} secondary={cta.secondary} /> : null}
    </>
  );
}
