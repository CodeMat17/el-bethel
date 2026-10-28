import type { Metadata } from "next";

import { LegalPage } from "@/components/site/legal-page";
import { getContent } from "@/lib/school/site-content";

export const metadata: Metadata = {
  title: "Privacy & Child Protection",
  description:
    "How El-Bethel International Academy collects, uses and protects personal information — with particular care for children's data.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const page = await getContent("privacy");
  return (
    <LegalPage
      eyebrow={page.eyebrow}
      title={page.title}
      lede={page.lede}
      updated={page.updated}
      href="/privacy"
      sections={page.sections}
    />
  );
}
