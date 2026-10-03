import type { Metadata } from "next";

import { CtaBand, PageHero } from "@/components/common";
import { FaqSearch } from "@/components/site/faq-search";
import { getFaqs } from "@/lib/school/site-data";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about admissions, fees, classes, uniform, academics and the school calendar at El-Bethel International Academy, Abuja.",
  alternates: { canonical: "/admissions/faqs" },
};

export default async function FaqsPage() {
  const faqs = await getFaqs();

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <PageHero
        eyebrow="Admissions"
        title="Frequently Asked Questions"
        lede="The questions we are asked most often, across admissions, fees, academics, uniform and the school calendar."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Admissions", href: "/admissions" },
          { label: "FAQs", href: "/admissions/faqs" },
        ]}
      />

      <section className="eb-section">
        <div className="eb-container max-w-4xl">
          <FaqSearch faqs={faqs} />
        </div>
      </section>

      <CtaBand
        title="Still have a question?"
        text="Our school office answers enquiries within one working day, Monday to Friday."
        primary={{ label: "Send an enquiry", href: "/contact" }}
        secondary={{ label: "Apply for admission", href: "/admissions/apply" }}
      />
    </>
  );
}
