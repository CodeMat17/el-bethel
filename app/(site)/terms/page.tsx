import { LegalPage } from "@/components/site/legal-page";
import { getContent } from "@/lib/school/site-content";
import { pageMetadata } from "@/lib/school/seo";

export const generateMetadata = () =>
  pageMetadata({
    title: "Terms of Use",
    description:
      "Terms governing the use of the El-Bethel International Academy website and digital school platform.",
    path: "/terms",
  });

export default async function TermsPage() {
  const page = await getContent("terms");
  return (
    <LegalPage
      eyebrow={page.eyebrow}
      title={page.title}
      lede={page.lede}
      updated={page.updated}
      href="/terms"
      sections={page.sections}
    />
  );
}
