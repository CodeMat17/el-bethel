import type { Metadata } from "next";
import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import { FaqDialog } from "@/components/cms/list-dialogs";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { moveFaq, removeFaq } from "@/lib/school/actions/site";
import { requireSiteAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";

export const metadata: Metadata = { title: "FAQs" };

export default async function SiteFaqsPage() {
  await requireSiteAdmin();
  const faqs = await query(api.siteLists.faqs, {});
  const categories = Array.from(new Set(faqs.map((f) => f.category)));

  return (
    <>
      <PortalPageHeader
        title="FAQs"
        description="Questions and answers on the Admissions page, in the order shown here. Changes go live as soon as you save."
        action={<FaqDialog categories={categories} />}
      />
      {faqs.length === 0 ? (
        <EmptyState icon="CircleHelp" title="No questions yet" description="Add the first question families ask." />
      ) : (
        <ol className="space-y-3">
          {faqs.map((faq, i) => (
            <li key={faq.id}>
              <Card className="gap-0 p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-xs font-extrabold">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-base font-extrabold">{faq.question}</h2>
                      <Badge variant="secondary" className="font-bold">
                        {faq.category}
                      </Badge>
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{faq.answer}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {i > 0 ? (
                      <ConfirmAction action={moveFaq.bind(null, faq.id, "up")} icon={<ArrowUpIcon />} variant="ghost" size="icon-sm" className="" pendingText="">
                        <span className="sr-only">Move up</span>
                      </ConfirmAction>
                    ) : null}
                    {i < faqs.length - 1 ? (
                      <ConfirmAction action={moveFaq.bind(null, faq.id, "down")} icon={<ArrowDownIcon />} variant="ghost" size="icon-sm" className="" pendingText="">
                        <span className="sr-only">Move down</span>
                      </ConfirmAction>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <FaqDialog faq={faq} categories={categories} />
                  <ConfirmAction
                    action={removeFaq.bind(null, faq.id)}
                    icon={<TrashIcon />}
                    variant="ghost"
                    className="font-bold text-destructive"
                    destructive
                    pendingText="Deleting…"
                    confirm={{ title: "Delete this question?", description: "It disappears from the Admissions page.", confirmLabel: "Delete" }}
                  >
                    Delete
                  </ConfirmAction>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
