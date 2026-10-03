import type { Metadata } from "next";

import { LegalPage } from "@/components/site/legal-page";
import { SCHOOL } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms governing the use of the El-Bethel International Academy website and digital school platform.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Policies"
      title="Terms of Use"
      lede="The rules for using this website and the parent, pupil, teacher and administration portals."
      updated="2 October 2026"
      href="/terms"
      sections={[
        {
          heading: "Acceptance",
          paragraphs: [
            `By using this website or any portal operated by ${SCHOOL.name}, you agree to these terms. If you do not agree, please do not use the platform.`,
          ],
        },
        {
          heading: "Accounts",
          paragraphs: [
            "Accounts are issued by the school to parents, pupils and staff, or created by applicants during an admission application.",
            "You are responsible for keeping your password confidential and for everything done under your account. Tell the school office immediately if you believe someone else has access to it.",
          ],
          bullets: [
            "Do not share your password or let another person use your account.",
            "Do not attempt to access records belonging to another family, pupil or member of staff.",
            "Pupil accounts are intended for the pupil, supervised by a parent where appropriate.",
          ],
        },
        {
          heading: "Acceptable use",
          paragraphs: ["This platform exists to support a child's education. Use it for that."],
          bullets: [
            "Do not upload anything unlawful, abusive, or that infringes someone else's rights.",
            "Do not attempt to probe, scan or test the security of the platform.",
            "Do not use automated tools to scrape content or overload the service.",
            "Do not re-publish photographs of other people's children taken at school events.",
          ],
        },
        {
          heading: "Content and accuracy",
          paragraphs: [
            "We work to keep information on this site accurate and current, but fees, dates, availability and staffing can change. Where a published figure conflicts with a document issued directly by the school office, the school office document takes precedence.",
            "Demonstration data on this platform is clearly marked and does not represent real pupils, families or transactions.",
          ],
        },
        {
          heading: "Payments",
          paragraphs: [
            "This platform does not accept online payments. Application fees, school fees and other charges are paid at the school bursary or by bank transfer to the school account, quoting the relevant application or invoice number.",
            "A payment is treated as received only once the school bursary has confirmed it. Payment records and receipts shown in the portals reflect payments the bursary has recorded.",
            "Application fees are non-refundable. Termly fee refunds are governed by the fee policy issued by the school office.",
          ],
        },
        {
          heading: "Availability",
          paragraphs: [
            "We aim to keep the platform available at all times but cannot guarantee uninterrupted service. Planned maintenance is announced in advance through the portals wherever possible.",
          ],
        },
        {
          heading: "Changes",
          paragraphs: [
            "We may update these terms. Material changes are announced in the portals, and the date at the top of this page always reflects the current version.",
          ],
        },
        {
          heading: "Contact",
          paragraphs: [
            `Questions about these terms should go to ${SCHOOL.email} or the school office at ${SCHOOL.address}.`,
          ],
        },
      ]}
    />
  );
}
