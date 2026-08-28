import type { Metadata } from "next";

import { LegalPage } from "@/components/site/legal-page";
import { SCHOOL } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "How the Crestwood Heights Academy platform is built to be usable by everyone, including children and people using assistive technology.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Policies"
      title="Accessibility"
      lede="A school platform that some families cannot use is not finished. Here is what we have done, and where we know we can do better."
      updated="20 August 2026"
      href="/accessibility"
      sections={[
        {
          heading: "Our target",
          paragraphs: [
            "We build against WCAG 2.2 Level AA. That is the standard we hold ourselves to across the public website and all four portals.",
          ],
        },
        {
          heading: "What we have built in",
          paragraphs: ["These are not aspirations — they are implemented across the platform."],
          bullets: [
            "Semantic HTML with a single, correct heading order on every page.",
            "Full keyboard navigation, with a visible focus ring on every interactive element.",
            "A skip-to-content link as the first focusable element on every page.",
            "Accessible names on every control, icon button and form field.",
            "Form errors announced to screen readers and tied to their field.",
            "Colour contrast checked in both light and dark themes.",
            "Reduced-motion support: all animation is disabled when a visitor's system requests it.",
            "Touch targets of at least 44 pixels throughout the pupil and parent portals.",
            "Tables with proper headers and captions; wide tables scroll within their own container rather than the page.",
          ],
        },
        {
          heading: "Designed for children",
          paragraphs: [
            "The pupil portal has its own accessibility rules on top of the standard: larger buttons, shorter labels, plain language, clear icons alongside text, and an explicit confirmation after every action so a child always knows their work was submitted.",
          ],
        },
        {
          heading: "Known limitations",
          paragraphs: [
            "Some complex data tables in the administration dashboard are dense on small screens; we are progressively replacing these with card layouts on mobile.",
            "Downloadable PDF documents are produced by the school office and may not always carry a full accessibility tag tree. If you need a document in an alternative format, ask and we will provide one.",
          ],
        },
        {
          heading: "Tell us when we get it wrong",
          paragraphs: [
            `If any part of this platform is difficult or impossible for you or your child to use, we want to know. Contact ${SCHOOL.email} or call ${SCHOOL.phone} and describe what you were trying to do. We treat accessibility reports as bugs, not feature requests.`,
          ],
        },
      ]}
    />
  );
}
