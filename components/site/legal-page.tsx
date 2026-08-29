import { PageHero } from "@/components/common";
import { Card } from "@/components/ui/card";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export function LegalPage({
  eyebrow,
  title,
  lede,
  updated,
  sections,
  href,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  updated: string;
  sections: LegalSection[];
  href: string;
}) {
  return (
    <>
      <PageHero
        eyebrow={eyebrow}
        title={title}
        lede={lede}
        breadcrumb={[{ label: "Home", href: "/" }, { label: title, href }]}
      />

      <section className="eb-section">
        <div className="eb-container grid gap-10 lg:grid-cols-[16rem_1fr]">
          <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
            <Card className="gap-0 p-5">
              <p className="text-[0.68rem] font-extrabold tracking-[0.16em] text-muted-foreground uppercase">
                On this page
              </p>
              <ul className="mt-4 space-y-2.5">
                {sections.map((section) => (
                  <li key={section.heading}>
                    <a
                      href={`#${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t pt-4 text-xs text-muted-foreground">Last updated {updated}</p>
            </Card>
          </nav>

          <div className="max-w-3xl space-y-10">
            {sections.map((section) => (
              <section
                key={section.heading}
                id={section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                className="scroll-mt-28"
              >
                <h2 className="font-heading text-xl font-extrabold sm:text-2xl">{section.heading}</h2>
                <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                  {section.paragraphs.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets ? (
                  <ul className="mt-4 space-y-2.5">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-sm leading-relaxed">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
