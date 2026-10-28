import type { Metadata } from "next";
import { QuoteIcon, TrashIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import { TestimonialDialog } from "@/components/cms/list-dialogs";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { removeTestimonial } from "@/lib/school/actions/site";
import { requireSiteAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";

export const metadata: Metadata = { title: "Testimonials" };

export default async function SiteTestimonialsPage() {
  await requireSiteAdmin();
  const items = await query(api.siteLists.testimonials, {});

  return (
    <>
      <PortalPageHeader
        title="Testimonials"
        description="Quotes from families, shown on the homepage. Changes go live as soon as you save."
        action={<TestimonialDialog />}
      />
      {items.length === 0 ? (
        <EmptyState icon="MessageSquareQuote" title="No testimonials yet" description="Add the first quote from a family." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <li key={t.id}>
              <Card className="flex h-full flex-col gap-0 p-5">
                <QuoteIcon className="size-5 text-gold/60" />
                <p className="mt-3 flex-1 text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 text-sm font-extrabold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.relationship}</p>
                <div className="mt-4 flex justify-end gap-1">
                  <TestimonialDialog item={t} />
                  <ConfirmAction
                    action={removeTestimonial.bind(null, t.id)}
                    icon={<TrashIcon />}
                    variant="ghost"
                    className="font-bold text-destructive"
                    destructive
                    pendingText="Deleting…"
                    confirm={{ title: "Delete this testimonial?", description: "It disappears from the homepage.", confirmLabel: "Delete" }}
                  >
                    Delete
                  </ConfirmAction>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
