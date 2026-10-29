import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CtaBand, PageHero } from "@/components/common";
import { ToneImage } from "@/components/motion";
import { formatDate } from "@/lib/school/format";
import { getAlumniHub, getAlumniStory } from "@/lib/school/site-data";

export async function generateStaticParams() {
  return (await getAlumniHub()).stories.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: PageProps<"/alumni/stories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const story = await getAlumniStory(slug);
  if (!story) return { title: "Story not found" };
  return { title: story.title, description: story.excerpt, alternates: { canonical: `/alumni/stories/${slug}` } };
}

export default async function AlumniStoryPage({ params }: PageProps<"/alumni/stories/[slug]">) {
  const { slug } = await params;
  const story = await getAlumniStory(slug);
  if (!story) notFound();

  return (
    <>
      <PageHero
        eyebrow={`Class of ${story.graduationYear}`}
        title={story.title}
        lede={story.excerpt}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Alumni", href: "/alumni" },
          { label: story.authorName, href: `/alumni/stories/${slug}` },
        ]}
      />
      <article className="eb-section">
        <div className="eb-container max-w-3xl">
          {story.cover ? <ToneImage media={story.cover} label={story.title} className="mb-8 aspect-16/9 rounded-3xl" priority /> : null}
          <p className="text-sm font-bold text-muted-foreground">
            {story.authorName}
            {story.publishedAt ? ` · ${formatDate(story.publishedAt)}` : ""}
          </p>
          <div className="mt-6 space-y-5 text-base leading-relaxed">
            {story.body.split(/\n\s*\n/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </article>
      <CtaBand
        title="Have a story to share?"
        text="We love hearing where El-Bethel pupils have gone. Get in touch with the school office and tell us."
        primary={{ label: "Contact the school", href: "/contact" }}
        secondary={{ label: "Back to alumni", href: "/alumni" }}
      />
    </>
  );
}
