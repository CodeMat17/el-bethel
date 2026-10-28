import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  MapPinIcon,
  PlayIcon,
  QuoteIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react";

import { CtaBand, SectionHeading, StatusPill } from "@/components/common";
import { Icon } from "@/components/icon";
import { Counter, Reveal, ToneImage } from "@/components/motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CLASS_LEVELS, STAGES } from "@/lib/school/config";
import { slugify } from "@/lib/utils";
import { getContent, getSchool } from "@/lib/school/site-content";
import { getAchievements, getClubs, getFeaturedTeachers, getGallery, getPublishedNews, getTestimonials, getUpcomingEvents } from "@/lib/school/site-data";
import { formatDate, initials } from "@/lib/school/format";

export const metadata: Metadata = {
  title: "Creche, Primary & Junior Secondary School in Abuja",
  description:
    "El-Bethel International Academy is a private Primary School in Abuja providing quality, child-centred education in a safe, stimulating and technology-enabled environment.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const news = (await getPublishedNews()).slice(0, 3);
  const events = (await getUpcomingEvents()).slice(0, 4);
  const teachers = (await getFeaturedTeachers()).slice(0, 6);
  const testimonials = await getTestimonials();
  const clubs = (await getClubs()).slice(0, 8);
  const achievements = (await getAchievements()).slice(0, 4);
  const gallery = (await getGallery()).slice(0, 8);
  const SCHOOL = await getSchool();
  const [c, about, academics, schoolLife] = await Promise.all([getContent("home"), getContent("about"), getContent("academics"), getContent("schoolLife")]);
  const stageMeta = Object.fromEntries(STAGES.map((st) => [st.key, st]));
  const { hero, intro, headteacher, why, programmes, stats, facilities, cta } = c;
  const headName = SCHOOL.headteacher.replace(/^(Mrs|Mr|Miss|Dr|Prof)\.?\s+/, "").split(/\s+/).filter(Boolean);

  return (
    <>
      {/* ------------------------------- Hero ------------------------------- */}
      {hero.visible ? (
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(50rem 32rem at 12% 0%, color-mix(in oklch, var(--gold) 34%, transparent), transparent 65%), radial-gradient(46rem 30rem at 88% 30%, color-mix(in oklch, var(--info) 40%, transparent), transparent 68%)",
          }}
          aria-hidden
        />
        <div className="eb-container relative grid gap-12 py-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:py-8">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/12 px-3 py-1.5 text-[0.68rem] font-extrabold tracking-[0.16em] text-gold uppercase">
                <SparklesIcon className="size-3.5" />
                {hero.badge}
              </span>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="mt-6 text-balance font-heading text-[2.1rem] leading-[1.06] sm:text-5xl lg:text-[3.6rem]">
                {hero.headlineBefore}{" "}
                <span className="relative whitespace-nowrap text-gold">
                  {hero.headlineHighlight}
                  <svg
                    viewBox="0 0 200 12"
                    className="absolute -bottom-1.5 left-0 w-full text-gold/45"
                    fill="none"
                    aria-hidden
                  >
                    <path d="M2 9C40 3 80 3 118 6c28 2 54 3 80 1" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                  </svg>
                </span>{" "}
                {hero.headlineAfter}
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-navy-foreground/75 sm:text-lg">
                {hero.text}
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-12 bg-gold text-base font-bold text-gold-foreground hover:bg-gold/85"
                  render={<Link href={hero.primary.href} />}
                >
                  {hero.primary.label}
                  <ArrowRightIcon />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-navy-foreground/25 bg-navy-foreground/5 text-base font-bold text-navy-foreground hover:bg-navy-foreground/12 hover:text-navy-foreground"
                  render={<Link href={hero.secondary.href} />}
                >
                  <PlayIcon />
                  {hero.secondary.label}
                </Button>
              </div>
            </Reveal>

          
          </div>

          {/* Hero collage */}
          <Reveal delay={0.15} className="relative md:mx-auto md:w-full md:max-w-md lg:max-w-[min(20rem,42svh)]">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-3">
              <div className="space-y-3 sm:space-y-4 lg:space-y-3">
                <ToneImage tone="gold" seed="hero-a" media={hero.image1 ?? undefined} priority sizes="(max-width: 768px) 45vw, (max-width: 1024px) 224px, 160px" label="Pupils in a smart classroom" className="aspect-4/5 rounded-2xl ring-1 ring-navy-foreground/10 lg:aspect-3/2" />
                <ToneImage tone="info" seed="hero-b" media={hero.image2 ?? undefined} priority sizes="(max-width: 768px) 45vw, (max-width: 1024px) 224px, 160px" label="Science practical session" className="aspect-square lg:aspect-3/2 rounded-2xl ring-1 ring-navy-foreground/10" />
              </div>
              <div className="space-y-3 pt-8 sm:space-y-4 sm:pt-12 lg:space-y-3 lg:pt-5">
                <ToneImage tone="plum" seed="hero-c" media={hero.image3 ?? undefined} sizes="(max-width: 768px) 45vw, (max-width: 1024px) 224px, 160px" label="Creative arts studio" className="aspect-square lg:aspect-3/2 rounded-2xl ring-1 ring-navy-foreground/10" />
                <ToneImage tone="success" seed="hero-d" media={hero.image4 ?? undefined} sizes="(max-width: 768px) 45vw, (max-width: 1024px) 224px, 160px" label="Inter-house sports day" className="aspect-4/5 rounded-2xl ring-1 ring-navy-foreground/10 lg:aspect-3/2" />
              </div>
            </div>

           
          </Reveal>
        </div>

        {/* Motto marquee */}
        <div className="relative border-t border-navy-foreground/10 py-3">
          <div className="flex overflow-hidden">
            <div className="flex shrink-0 animate-[eb-marquee_36s_linear_infinite] items-center gap-8 pr-8">
              {Array.from({ length: 2 }).map((_, dup) =>
                hero.marquee.map(
                  (word) => (
                    <span
                      key={`${dup}-${word}`}
                      className="flex items-center gap-8 text-xs font-extrabold tracking-[0.24em] text-navy-foreground/35 uppercase"
                    >
                      {word}
                      <span className="size-1 rounded-full bg-gold/60" />
                    </span>
                  ),
                ),
              )}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {/* ---------------------------- Introduction --------------------------- */}
      {intro.visible ? (
      <section className="eb-section">
        <div className="eb-container grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-14">
          <Reveal className="relative">
            <ToneImage
              tone="navy"
              seed="intro"
              media={intro.image ?? undefined}
              sizes="(max-width: 1024px) 100vw, 48vw"
              label="Pupils at El-Bethel International Academy"
              className="rounded-3xl"
            />
            <div className="absolute -bottom-5 left-5 hidden rounded-2xl bg-navy px-5 py-3 text-navy-foreground shadow-lg sm:block">
              <p className="font-heading text-sm font-extrabold leading-tight">{SCHOOL.type}</p>
              <p className="mt-1 text-[0.7rem] font-bold tracking-[0.18em] text-gold uppercase">
                {SCHOOL.city}, {SCHOOL.state}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <SectionHeading
              eyebrow={intro.eyebrow}
              title={intro.title}
              lede={intro.lede}
            />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {intro.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm font-medium">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                    <CheckIcon className="size-3" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="h-11 font-bold" render={<Link href={intro.primary.href} />}>
                {intro.primary.label}
                <ArrowRightIcon />
              </Button>
              <Button size="lg" variant="outline" className="h-11 font-bold" render={<Link href={intro.secondary.href} />}>
                {intro.secondary.label}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
      ) : null}

      {/* -------------------------- Headteacher note ------------------------- */}
      {headteacher.visible ? (
      <section className="border-y bg-muted/40 py-14 sm:py-20">
        <div className="eb-container grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <Reveal>
            <span className="eb-eyebrow">{headteacher.eyebrow}</span>
            <blockquote className="mt-5">
              <QuoteIcon className="size-8 text-gold/50" />
              <p className="mt-3 text-pretty font-heading text-xl leading-snug sm:text-2xl">
                &ldquo;{headteacher.quote}&rdquo;
              </p>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {headteacher.text}
              </p>
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback className="bg-navy font-bold text-navy-foreground">
                  {initials(headName[0] ?? "", headName.length > 1 ? headName[headName.length - 1] : "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-heading text-sm font-extrabold">{SCHOOL.headteacher}</p>
                <p className="text-xs text-muted-foreground">{headteacher.role}</p>
              </div>
              <Button
                variant="link"
                className="ml-auto font-bold"
                render={<Link href={headteacher.link.href} />}
              >
                {headteacher.link.label}
                <ArrowRightIcon />
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="lg:justify-self-end">
            <ToneImage
              tone="gold"
              seed="headteacher-portrait"
              media={headteacher.image ?? undefined}
              label={SCHOOL.headteacher}
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="mx-auto w-full rounded-3xl"
            />
          </Reveal>
        </div>
      </section>
      ) : null}

      {/* ---------------------------- Why El-Bethel -------------------------- */}
      {why.visible ? (
      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading
            eyebrow={why.eyebrow}
            title={why.title}
            lede={why.lede}
            align="center"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {why.items.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.04}>
                <Card className="group h-full gap-0 p-6 transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg">
                  <span className="grid size-12 place-items-center rounded-2xl bg-navy text-gold transition-colors group-hover:bg-gold group-hover:text-gold-foreground">
                    <Icon name={item.icon} className="size-5" />
                  </span>
                  <h3 className="mt-5 font-heading text-lg font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </Card>
              </Reveal>
            ))}
            <Reveal delay={Math.min(why.items.length, 7) * 0.04}>
              <Card className="flex h-full flex-col justify-between gap-4 border-gold/30 bg-gold/10 p-6">
                <div>
                  <h3 className="font-heading text-lg font-extrabold">{why.cardTitle}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {why.cardText}
                  </p>
                </div>
                <Button className="w-full font-bold" size="lg" render={<Link href={why.cardLink.href} />}>
                  {why.cardLink.label}
                  <ArrowRightIcon />
                </Button>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>
      ) : null}

      {/* -------------------------- Academic programmes ---------------------- */}
      {programmes.visible ? (
      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow={programmes.eyebrow}
            title={programmes.title}
            lede={programmes.lede}
            action={
              <Button variant="outline" size="lg" className="font-bold" render={<Link href="/academics" />}>
                {programmes.buttonLabel}
                <ArrowRightIcon />
              </Button>
            }
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {academics.stages.items.map((programme, i) => (
              <Reveal key={programme.key} delay={i * 0.06}>
                <Card className="h-full gap-0 overflow-hidden p-0">
                  <ToneImage tone={stageMeta[programme.key]?.tone} seed={stageMeta[programme.key]?.name} media={programme.image ?? undefined} label={programme.name} className="aspect-21/9" />
                  <CardContent className="p-6">
                    <h3 className="font-heading text-xl font-extrabold">{programme.name}</h3>
                    <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{programme.ages}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{programme.text}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {CLASS_LEVELS.filter((l) => l.stage === programme.key).map((level) => (
                        <Badge key={level.id} variant="secondary" className="h-7 px-3 font-bold">
                          {level.name}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="link" className="mt-4 px-0 font-bold" render={<Link href={`/academics#${programme.key}`} />}>
                      Explore the programme
                      <ArrowRightIcon />
                    </Button>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* ------------------------------- Stats ------------------------------- */}
      {stats.visible && stats.items.length ? (
      <section className="bg-navy py-14 text-navy-foreground sm:py-20">
        <div className="eb-container">
          <div className="grid gap-8 md:grid-cols-4">
            {stats.items.map((stat, i) => (
              <Reveal key={`${stat.label}-${i}`} delay={i * 0.04}>
                <div className="border-l border-gold/25 pl-5">
                  <p className="font-heading text-3xl leading-none font-extrabold text-gold sm:text-4xl">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-xs font-bold tracking-wide text-navy-foreground/60 uppercase">
                    {stat.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* ----------------------------- Facilities ---------------------------- */}
      {facilities.visible ? (
      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading
            eyebrow={facilities.eyebrow}
            title={facilities.title}
            lede={facilities.lede}
            action={
              <Button variant="outline" size="lg" className="font-bold" render={<Link href="/school-life#facilities" />}>
                All facilities
                <ArrowRightIcon />
              </Button>
            }
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schoolLife.facilities.items.slice(0, 6).map((facility, i) => (
              <Reveal key={`${facility.name}-${i}`} delay={i * 0.04}>
                <Link href={`/school-life#${slugify(facility.name)}`} className="group block h-full">
                  <Card className="h-full gap-0 overflow-hidden p-0 transition-all group-hover:-translate-y-1 group-hover:shadow-lg">
                    <div className="relative">
                      <ToneImage
                        tone={["navy", "gold", "info", "success", "plum"][i % 5]}
                        seed={slugify(facility.name)}
                        media={facility.image ?? undefined}
                        label={facility.name}
                        className="aspect-16/10"
                      />
                      <span className="absolute top-3 left-3 grid size-9 place-items-center rounded-xl bg-background/90 text-foreground backdrop-blur">
                        <Icon name={facility.icon} className="size-4" />
                      </span>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-heading text-base font-extrabold">{facility.name}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{facility.summary}</p>
                    </CardContent>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* -------------------------- Clubs & activities ----------------------- */}
      {c.clubs.visible && clubs.length ? (
      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow={c.clubs.eyebrow}
            title={c.clubs.title}
            lede={c.clubs.lede}
            action={
              <Button variant="outline" size="lg" className="font-bold" render={<Link href="/school-life#clubs" />}>
                All clubs
                <ArrowRightIcon />
              </Button>
            }
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {clubs.map((club, i) => (
              <Reveal key={club.id} delay={i * 0.03}>
                <Card className="h-full gap-1 p-5 transition-colors hover:border-gold/40">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-heading text-base font-extrabold">{club.name}</h3>
                    <Badge variant="secondary" className="shrink-0 font-bold">{club.memberCount}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{club.description}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <ClockIcon className="size-3.5" />
                    {club.meetingDay}s · {club.meetingTime}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* ------------------------------ Our Stars ---------------------------- */}
      {c.stars.visible && achievements.length ? (
      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading
            eyebrow={c.stars.eyebrow}
            title={c.stars.title}
            lede={c.stars.lede}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {achievements.map((achievement, i) => (
              <Reveal key={achievement.id} delay={i * 0.05}>
                <Card className="h-full gap-0 border-gold/20 p-5">
                  <StatusPill tone="gold" dot={false}>
                    <StarIcon className="size-3" /> {achievement.category}
                  </StatusPill>
                  <h3 className="mt-4 font-heading text-base leading-snug font-extrabold">
                    {achievement.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {achievement.description}
                  </p>
                  <Separator className="my-4" />
                  <p className="text-xs font-semibold text-muted-foreground">
                    {achievement.studentInitials} · {achievement.classLabel}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* ------------------------------ Teachers ----------------------------- */}
      {c.teachers.visible && teachers.length ? (
      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow={c.teachers.eyebrow}
            title={c.teachers.title}
            lede={c.teachers.lede}
            action={
              <Button variant="outline" size="lg" className="font-bold" render={<Link href="/about/team" />}>
                Meet the team
                <ArrowRightIcon />
              </Button>
            }
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teachers.map((teacher, i) => (
              <Reveal key={teacher.id} delay={i * 0.04}>
                <Card className="flex h-full flex-row items-center gap-4 p-4">
                  <ToneImage
                    tone={["navy", "gold", "info", "success", "plum"][i % 5]}
                    seed={teacher.avatarSeed}
                    kind="portrait"
                    label={`${teacher.firstName} ${teacher.lastName}`}
                    className="size-16 shrink-0 rounded-2xl"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate font-heading text-base font-extrabold">
                      {teacher.title} {teacher.firstName} {teacher.lastName}
                    </h3>
                    <p className="truncate text-sm text-muted-foreground">{teacher.position}</p>
                    <p className="mt-1 text-xs font-semibold text-gold-foreground dark:text-gold">
                      {teacher.experienceYears} years experience
                    </p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* ------------------------- News and events --------------------------- */}
      {c.news.visible ? (
      <section className="eb-section">
        <div className="eb-container grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <SectionHeading
              eyebrow={c.news.newsEyebrow}
              title={c.news.newsTitle}
              action={
                <Button variant="link" className="font-bold" render={<Link href="/news" />}>
                  All news <ArrowRightIcon />
                </Button>
              }
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((post, i) => (
                <Reveal key={post.id} delay={i * 0.05}>
                  <Link href={`/news/${post.slug}`} className="group block h-full">
                    <Card className="h-full gap-0 overflow-hidden p-0 transition-all group-hover:-translate-y-1 group-hover:shadow-lg">
                      <ToneImage tone={post.tone} seed={post.slug} media={post.cover} label={post.title} className="aspect-16/10" />
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                          <Badge variant="secondary" className="font-bold">{post.category}</Badge>
                          <span>{formatDate(post.publishedAt)}</span>
                        </div>
                        <h3 className="mt-3 font-heading text-base leading-snug font-extrabold group-hover:text-primary dark:group-hover:text-gold">
                          {post.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {post.excerpt}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading eyebrow={c.news.eventsEyebrow} title={c.news.eventsTitle} />
            <ul className="mt-8 space-y-3">
              {events.map((event, i) => (
                <Reveal key={event.id} delay={i * 0.05} as="li">
                  <Link href={`/school-life/events/${event.slug}`} className="group block">
                    <Card className="flex flex-row items-center gap-4 p-4 transition-colors group-hover:border-gold/40">
                      <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-navy text-navy-foreground">
                        <span className="font-heading text-lg leading-none font-extrabold text-gold">
                          {new Date(event.date).getUTCDate()}
                        </span>
                        <span className="text-[0.6rem] font-bold tracking-wide uppercase">
                          {new Date(event.date).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-heading text-sm font-extrabold">{event.title}</h3>
                        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                          <MapPinIcon className="size-3.5 shrink-0" /> {event.venue}
                        </p>
                      </div>
                    </Card>
                  </Link>
                </Reveal>
              ))}
            </ul>
            <Button variant="outline" size="lg" className="mt-5 w-full font-bold" render={<Link href="/calendar" />}>
              <CalendarDaysIcon />
              Full school calendar
            </Button>
          </div>
        </div>
      </section>
      ) : null}

      {/* ------------------------------ Gallery ------------------------------ */}
      {c.gallery.visible && gallery.length ? (
      <section className="eb-section border-y bg-muted/40">
        <div className="eb-container">
          <SectionHeading
            eyebrow={c.gallery.eyebrow}
            title={c.gallery.title}
            action={
              <Button variant="outline" size="lg" className="font-bold" render={<Link href="/school-life/gallery" />}>
                Open gallery
                <ArrowRightIcon />
              </Button>
            }
          />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {gallery.map((item, i) => (
              <Reveal key={item.id} delay={i * 0.03}>
                <Link href="/school-life/gallery" className="group block">
                  <div className="relative overflow-hidden rounded-2xl">
                    <ToneImage
                      tone={item.tone}
                      seed={item.id}
                      media={item.media}
                      label={item.title}
                      className="aspect-square transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-navy/85 to-transparent p-3 pt-8">
                      <p className="line-clamp-2 text-xs font-bold text-navy-foreground">{item.title}</p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* ---------------------------- Testimonials --------------------------- */}
      {c.testimonials.visible && testimonials.length ? (
      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading
            eyebrow={c.testimonials.eyebrow}
            title={c.testimonials.title}
            align="center"
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.07}>
                <Card className="flex h-full flex-col gap-0 p-6">
                  <div className="flex gap-0.5 text-gold">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <StarIcon key={s} className="size-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 flex-1 text-pretty text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <Separator className="my-5" />
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-navy text-xs font-bold text-navy-foreground">
                        {initials(...t.name.replace(/^(Mrs|Mr|Miss|Dr)\.?\s/, "").split(" "))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-extrabold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.relationship}</p>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* ------------------------------- Values ------------------------------ */}
      {c.values.visible ? (
      <section className="eb-section border-t bg-muted/40">
        <div className="eb-container">
          <SectionHeading eyebrow={c.values.eyebrow} title={c.values.title} align="center" />
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {about.values.items.map((value, i) => (
              <Reveal key={`${value.title}-${i}`} delay={i * 0.04}>
                <div className="flex items-center gap-2.5 rounded-full border bg-card py-2.5 pr-5 pl-2.5 shadow-sm">
                  <span className="grid size-8 place-items-center rounded-full bg-gold/15 text-gold-foreground dark:text-gold">
                    <Icon name={value.icon} className="size-4" />
                  </span>
                  <span className="text-sm font-extrabold">{value.title}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* ------------------------------ Contact ------------------------------ */}
      {c.contact.visible ? (
      <section className="eb-section">
        <div className="eb-container grid gap-8 lg:grid-cols-3">
          {[
            { icon: "MapPin", title: c.contact.visitTitle, lines: [SCHOOL.address], href: "/contact", cta: "Get directions" },
            { icon: "Phone", title: c.contact.talkTitle, lines: [SCHOOL.phone, SCHOOL.email], href: "/contact", cta: "Send an enquiry" },
            { icon: "CalendarDays", title: c.contact.hoursTitle, lines: SCHOOL.officeHours.split(/,\s*/), href: "/contact", cta: "Contact the office" },
          ].map((block, i) => (
            <Reveal key={block.title} delay={i * 0.06}>
              <Card className="h-full gap-0 p-6">
                <span className="grid size-11 place-items-center rounded-2xl bg-navy text-gold">
                  <Icon name={block.icon} className="size-5" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-extrabold">{block.title}</h3>
                {block.lines.map((line) => (
                  <p key={line} className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {line}
                  </p>
                ))}
                <Button variant="link" className="mt-3 px-0 font-bold" render={<Link href={block.href} />}>
                  {block.cta} <ArrowRightIcon />
                </Button>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
      ) : null}

      {cta.visible ? <CtaBand title={cta.title} text={cta.text} primary={cta.primary} secondary={cta.secondary} /> : null}
    </>
  );
}
