import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";

import { CtaBand, PageHero, SectionHeading } from "@/components/common";
import { Reveal, ToneImage } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPublishedNews } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = {
  title: "News & Updates",
  description:
    "School news, achievements, announcements and updates from El-Bethel International Academy, Abuja.",
  alternates: { canonical: "/news" },
};

export default function NewsPage() {
  const news = getPublishedNews();
  const [lead, ...rest] = news;
  const categories = Array.from(new Set(news.map((n) => n.category)));

  return (
    <>
      <PageHero
        eyebrow="News & updates"
        title="What's happening at El-Bethel"
        lede="Announcements, achievements, academic updates and stories from across the school."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "News", href: "/news" }]}
      />

      <section className="border-b bg-muted/40 py-6">
        <div className="eb-container flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Topics</span>
          {categories.map((category) => (
            <Badge key={category} variant="outline" className="h-7 px-3 font-bold">{category}</Badge>
          ))}
        </div>
      </section>

      {lead ? (
        <section className="eb-section pb-0">
          <div className="eb-container">
            <Link href={`/news/${lead.slug}`} className="group block">
              <Card className="grid gap-0 overflow-hidden p-0 transition-all group-hover:shadow-xl lg:grid-cols-2">
                <ToneImage tone={lead.tone} seed={lead.slug} label={lead.title} className="aspect-16/10 lg:aspect-auto lg:min-h-80" />
                <CardContent className="flex flex-col justify-center p-7 sm:p-10">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Badge className="font-bold">Featured</Badge>
                    <span>{lead.category}</span>
                    <span aria-hidden>·</span>
                    <span>{formatDate(lead.publishedAt)}</span>
                  </div>
                  <h2 className="mt-4 text-balance font-heading text-2xl leading-tight font-extrabold group-hover:text-primary sm:text-3xl dark:group-hover:text-gold">
                    {lead.title}
                  </h2>
                  <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{lead.excerpt}</p>
                  <p className="mt-5 text-sm font-semibold text-muted-foreground">By {lead.authorName}</p>
                  <span className="mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-bold text-primary dark:text-gold">
                    Read the story <ArrowRightIcon className="size-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      ) : null}

      <section className="eb-section">
        <div className="eb-container">
          <SectionHeading eyebrow="Archive" title="All news" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, i) => (
              <Reveal key={post.id} delay={(i % 6) * 0.04}>
                <Link href={`/news/${post.slug}`} className="group block h-full">
                  <Card className="h-full gap-0 overflow-hidden p-0 transition-all group-hover:-translate-y-1 group-hover:shadow-lg">
                    <ToneImage tone={post.tone} seed={post.slug} label={post.title} className="aspect-16/10" />
                    <CardContent className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Badge variant="secondary" className="font-bold">{post.category}</Badge>
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                      <h3 className="mt-3 font-heading text-base leading-snug font-extrabold group-hover:text-primary dark:group-hover:text-gold">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                      <p className="mt-4 text-xs font-semibold text-muted-foreground">{post.authorName}</p>
                    </CardContent>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Never miss an update"
        text="Subscribe to our newsletter for termly news, event reminders and admission updates."
        primary={{ label: "Apply for admission", href: "/admissions/apply" }}
        secondary={{ label: "See upcoming events", href: "/school-life/events" }}
      />

    </>
  );
}
