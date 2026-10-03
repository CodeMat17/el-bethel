import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon, CalendarDaysIcon, MapPinIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal, ToneImage } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate, money } from "@/lib/school/format";
import { getAlumniHub } from "@/lib/school/site-data";

export const metadata: Metadata = {
  title: "Alumni",
  description: "Stay connected with El-Bethel International Academy: register as a former pupil, read alumni stories, join reunions and support today's pupils.",
  alternates: { canonical: "/alumni" },
};

export default async function AlumniPage() {
  const hub = await getAlumniHub();

  return (
    <>
      <PageHero
        eyebrow="Alumni"
        title="Once El-Bethel, always El-Bethel"
        lede="Former pupils and their families: stay in touch, come back for reunions, share your story and help the children following in your footsteps."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Alumni", href: "/alumni" },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <Button size="lg" className="h-12 bg-gold font-bold text-gold-foreground hover:bg-gold/85" render={<Link href="/alumni/register" />}>
            Register as alumni
          </Button>
          {hub.campaigns[0] ? (
            <Button size="lg" variant="outline" className="h-12 border-navy-foreground/30 bg-transparent font-bold text-navy-foreground hover:bg-navy-foreground/10" render={<Link href={`/alumni/give/${hub.campaigns[0].slug}`} />}>
              Give back
            </Button>
          ) : null}
        </div>
        <p className="mt-4 text-sm text-navy-foreground/70">{hub.members} registered alumni and counting.</p>
      </PageHero>

      {hub.campaigns.length > 0 ? (
        <section className="eb-section">
          <div className="eb-container">
            <SectionHeading eyebrow="Give back" title="Support today's pupils" lede="Every gift is confirmed by the school bursary and shown here as it arrives." />
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {hub.campaigns.map((c) => {
                const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
                return (
                  <Card key={c.id} className="gap-0 p-6">
                    <h3 className="font-heading text-xl font-extrabold">{c.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{c.summary}</p>
                    <Progress value={pct} className="mt-5 h-3" aria-label={`${pct}% of the goal raised`} />
                    <p className="mt-2 text-sm">
                      <span className="font-heading text-lg font-extrabold">{money(c.raised)}</span> of {money(c.goal)} · {c.supporters}{" "}
                      {c.supporters === 1 ? "supporter" : "supporters"}
                      {c.endsAt ? ` · until ${formatDate(c.endsAt)}` : ""}
                    </p>
                    <Button className="mt-5 w-fit font-bold" render={<Link href={`/alumni/give/${c.slug}`} />}>
                      Give to this campaign
                      <ArrowRightIcon />
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="eb-section bg-muted/40">
        <div className="eb-container">
          <SectionHeading eyebrow="Stories" title="Where are they now?" />
          {hub.stories.length === 0 ? (
            <p className="mt-6 text-muted-foreground">
              Alumni stories are coming soon. Have one to share? <Link href="/contact" className="font-bold underline">Tell us</Link>.
            </p>
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

      <section className="eb-section">
        <div className="eb-container grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Reunions" title="Alumni events" />
            {hub.events.length === 0 ? (
              <p className="mt-6 text-muted-foreground">No alumni events are scheduled yet. Register to hear about the next reunion first.</p>
            ) : (
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
            )}
          </div>

          <div>
            <SectionHeading eyebrow="Network" title="Alumni directory" />
            <p className="mt-3 text-sm text-muted-foreground">
              Adult alumni who chose to be listed. To get in touch with someone, contact the school office and we&apos;ll pass your details on.
            </p>
            {hub.directory.length === 0 ? (
              <p className="mt-6 text-muted-foreground">No one is listed yet.</p>
            ) : (
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {hub.directory.slice(0, 60).map((a) => (
                  <li key={a.id} className="rounded-xl border bg-card p-3 text-sm">
                    <p className="font-bold">
                      {a.name} <span className="font-normal text-muted-foreground">· {a.graduationYear}</span>
                    </p>
                    {a.currently ? <p className="text-xs text-muted-foreground">{a.currently}</p> : null}
                    {a.city ? (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPinIcon className="size-3" />
                        {a.city}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <CtaBand
        title="Are you a former El-Bethel pupil?"
        text="Register in two minutes to hear about reunions, mentor today's pupils and share your story."
        primary={{ label: "Register as alumni", href: "/alumni/register" }}
        secondary={{ label: "Contact the school", href: "/contact" }}
      />
    </>
  );
}
