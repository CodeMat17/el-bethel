import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDaysIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal, ToneImage } from "@/components/motion";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/school/format";
import { getAlumniHub } from "@/lib/school/site-data";
import { getContent } from "@/lib/school/site-content";

export const metadata: Metadata = {
  title: "Alumni",
  description: "Stories from former pupils of El-Bethel International Academy, and news of alumni reunions.",
  alternates: { canonical: "/alumni" },
};

export default async function AlumniPage() {
  const [hub, page] = await Promise.all([getAlumniHub(), getContent("alumni")]);
  const { hero, stories, events, cta } = page;

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        lede={hero.lede}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Alumni", href: "/alumni" },
        ]}
      />

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading eyebrow={stories.eyebrow} title={stories.title} />
          {hub.stories.length === 0 ? (
            <p className="mt-6 text-muted-foreground">{stories.empty}</p>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {hub.stories.map((s, i) => (
                <Reveal key={s.id} delay={i * 0.04}>
                  <Link href={`/alumni/stories/${s.slug}`} className="group block h-full">
                    <Card className="h-full gap-0 overflow-hidden p-0 transition-colors group-hover:border-gold/50">
                      <ToneImage seed={s.slug} media={s.cover} label={s.title} className="aspect-16/10" />
                      <div className="p-5">
                        <p className="text-xs font-bold text-muted-foreground uppercase">
                          {s.authorName} · class of {s.graduationYear}
                        </p>
                        <h3 className="mt-1 font-heading text-lg font-extrabold group-hover:underline">{s.title}</h3>
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{s.excerpt}</p>
                      </div>
                    </Card>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {hub.events.length > 0 ? (
        <section className="eb-section border-t bg-muted/40">
          <div className="eb-container max-w-3xl">
            <SectionHeading eyebrow={events.eyebrow} title={events.title} />
            <ul className="mt-6 space-y-3">
              {hub.events.map((e) => (
                <li key={e.id}>
                  <Link href={`/school-life/events/${e.slug}`} className="flex items-start gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-gold/50">
                    <CalendarDaysIcon className="mt-0.5 size-5 shrink-0 text-gold" />
                    <span>
                      <span className="block font-bold">{e.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(e.date)} · {e.startTime} · {e.venue}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {cta.visible ? <CtaBand title={cta.title} text={cta.text} primary={cta.primary} secondary={cta.secondary} /> : null}
    </>
  );
}
