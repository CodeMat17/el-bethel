import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import { CtaBand } from "@/components/common";
import { ToneImage } from "@/components/motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SITE_URL } from "@/lib/school/config";
import { getSchool } from "@/lib/school/site-content";
import { getNewsBySlug, getPublishedNews } from "@/lib/school/site-data";
import { formatDate, initials } from "@/lib/school/format";

export async function generateStaticParams() {
  return (await getPublishedNews()).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/news/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [post, SCHOOL] = await Promise.all([getNewsBySlug(slug), getSchool()]);
  if (!post) return { title: "Article not found" };
  return {
    title: post.seoTitle.replace(` | ${SCHOOL.name}`, ""),
    description: post.seoDescription,
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/news/${post.slug}`,
      publishedTime: post.publishedAt,
      authors: [post.authorName],
      tags: post.tags,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt },
  };
}

export default async function NewsArticlePage({ params }: PageProps<"/news/[slug]">) {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);
  if (!post) notFound();

  const [all, SCHOOL] = await Promise.all([getPublishedNews(), getSchool()]);
  const index = all.findIndex((p) => p.slug === post.slug);
  const previous = index > 0 ? all[index - 1] : null;
  const next = index < all.length - 1 ? all[index + 1] : null;
  const related = all.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3);

  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: { "@type": "Person", name: post.authorName },
    publisher: { "@type": "Organization", name: SCHOOL.name, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/news/${post.slug}`,
    keywords: post.tags.join(", "),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <article>
        <div className="relative">
          <ToneImage tone={post.tone} seed={post.slug} media={post.cover} label={post.title} className="h-56 w-full sm:h-72 lg:h-96" />
          <div className="absolute inset-0 bg-linear-to-t from-navy via-navy/65 to-transparent" />
          <div className="eb-container absolute inset-x-0 bottom-0 pb-8 sm:pb-12">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 font-bold text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"
              render={<Link href="/news" />}
            >
              <ArrowLeftIcon />
              All news
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-gold font-bold text-gold-foreground">{post.category}</Badge>
              <span className="text-xs font-semibold text-navy-foreground/70">
                {formatDate(post.publishedAt)}
              </span>
            </div>
            <h1 className="mt-3 max-w-3xl text-balance font-heading text-3xl leading-tight text-navy-foreground sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>
          </div>
        </div>

        <section className="eb-section">
          <div className="eb-container grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  <AvatarFallback className="bg-navy text-xs font-bold text-navy-foreground">
                    {initials(...post.authorName.replace(/^(Mrs|Mr|Miss|Dr|Mme)\.?\s/, "").split(" "))}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-extrabold">{post.authorName}</p>
                  <p className="text-xs text-muted-foreground">
                    Published {formatDate(post.publishedAt)}
                  </p>
                </div>
              </div>

              <Separator className="my-7" />

              <p className="text-pretty text-lg leading-relaxed font-medium">{post.excerpt}</p>

              <div className="mt-6 space-y-5 text-pretty leading-relaxed text-muted-foreground">
                {post.content.split("\n\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              {post.tags.length > 0 ? (
                <div className="mt-8 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">Tags</span>
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="font-bold">{tag}</Badge>
                  ))}
                </div>
              ) : null}

              <Separator className="my-8" />

              <nav className="grid gap-3 sm:grid-cols-2" aria-label="More articles">
                {previous ? (
                  <Link href={`/news/${previous.slug}`} className="group">
                    <Card className="h-full gap-0 p-5 transition-colors group-hover:border-gold/40">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                        <ArrowLeftIcon className="size-3.5" /> Newer
                      </p>
                      <p className="mt-2 font-heading text-sm font-extrabold">{previous.title}</p>
                    </Card>
                  </Link>
                ) : <span />}
                {next ? (
                  <Link href={`/news/${next.slug}`} className="group">
                    <Card className="h-full gap-0 p-5 text-right transition-colors group-hover:border-gold/40">
                      <p className="flex items-center justify-end gap-1.5 text-xs font-bold text-muted-foreground">
                        Older <ArrowRightIcon className="size-3.5" />
                      </p>
                      <p className="mt-2 font-heading text-sm font-extrabold">{next.title}</p>
                    </Card>
                  </Link>
                ) : null}
              </nav>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              {related.length > 0 ? (
                <Card className="gap-0 p-6">
                  <h2 className="font-heading text-base font-extrabold">More in {post.category}</h2>
                  <Separator className="my-4" />
                  <ul className="space-y-4">
                    {related.map((item) => (
                      <li key={item.id}>
                        <Link href={`/news/${item.slug}`} className="group flex gap-3">
                          <ToneImage tone={item.tone} seed={item.slug} media={item.cover} label={item.title} className="size-14 shrink-0 rounded-xl" />
                          <span className="min-w-0">
                            <span className="block text-sm font-bold group-hover:text-primary dark:group-hover:text-gold">
                              {item.title}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {formatDate(item.publishedAt)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              <Card className="gap-0 border-gold/25 bg-gold/8 p-6">
                <h2 className="font-heading text-base font-extrabold">Admission is open</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Creche, Pre-School, Nursery 1–3, Primary 1–6 and JSS 1–3 for the {SCHOOL.session} session.
                </p>
                <Button className="mt-4 w-full font-bold" size="lg" render={<Link href="/admissions/apply" />}>
                  Apply online
                  <ArrowRightIcon />
                </Button>
              </Card>
            </aside>
          </div>
        </section>
      </article>

      <CtaBand />
    </>
  );
}
