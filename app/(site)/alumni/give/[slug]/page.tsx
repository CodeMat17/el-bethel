import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/common";
import { PledgeForm } from "@/components/site/alumni-forms";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatDate, money } from "@/lib/school/format";
import { getCampaign } from "@/lib/school/site-data";

export async function generateMetadata({ params }: PageProps<"/alumni/give/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCampaign(slug);
  if (!c) return { title: "Campaign not found" };
  return { title: c.title, description: c.summary, alternates: { canonical: `/alumni/give/${slug}` } };
}

export default async function GivePage({ params }: PageProps<"/alumni/give/[slug]">) {
  const { slug } = await params;
  const c = await getCampaign(slug);
  if (!c) notFound();
  const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));

  return (
    <>
      <PageHero
        eyebrow="Give back"
        title={c.title}
        lede={c.summary}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Alumni", href: "/alumni" },
          { label: "Give", href: `/alumni/give/${slug}` },
        ]}
      />
      <section className="eb-section">
        <div className="eb-container grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Progress value={pct} className="h-3" aria-label={`${pct}% of the goal raised`} />
            <p className="mt-3">
              <span className="font-heading text-2xl font-extrabold">{money(c.raised)}</span>{" "}
              <span className="text-muted-foreground">
                raised of {money(c.goal)} · {c.supporters} {c.supporters === 1 ? "supporter" : "supporters"}
                {c.endsAt ? ` · until ${formatDate(c.endsAt)}` : ""}
              </span>
            </p>
            <div className="mt-8 space-y-4 leading-relaxed">
              {c.description.split(/\n\s*\n/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            {c.wall.length > 0 ? (
              <>
                <h2 className="mt-10 font-heading text-lg font-extrabold">Thank you</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {c.wall.map((w, i) => (
                    <li key={i} className="rounded-full border bg-card px-3 py-1.5 text-sm" title={w.message ?? undefined}>
                      {w.name}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <Card className="gap-0 self-start p-6 sm:p-8">
            <h2 className="font-heading text-lg font-extrabold">Make a pledge</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pledge online, then pay at the bursary or by transfer quoting your reference.</p>
            <Separator className="my-6" />
            {c.status === "open" ? <PledgeForm campaignId={c.id} campaignTitle={c.title} /> : <p className="text-sm text-muted-foreground">This campaign has closed. Thank you to everyone who gave.</p>}
          </Card>
        </div>
      </section>
    </>
  );
}
