import type { Metadata } from "next";

import { LegalPage } from "@/components/site/legal-page";
import { SCHOOL } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "Privacy & Child Protection",
  description:
    "How Crestwood Heights Academy collects, uses and protects personal information — with particular care for children's data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Policies"
      title="Privacy & Child Protection"
      lede="This platform holds children's educational records and family financial information. Here is exactly how we treat it."
      updated="20 August 2026"
      href="/privacy"
      sections={[
        {
          heading: "Our commitment",
          paragraphs: [
            `${SCHOOL.name} processes personal information about children, their families and our staff. We treat that as a duty of care first and a compliance obligation second.`,
            "We collect only what we need to educate and safeguard a child, we keep it only as long as we need it, and we never sell it or share it for marketing.",
          ],
        },
        {
          heading: "What we collect",
          paragraphs: ["The information we hold falls into a small number of categories."],
          bullets: [
            "Pupil records: name, date of birth, gender, nationality, address, photograph, class, admission number and academic history.",
            "Health information: blood group, allergies, immunisation and any condition our school nurse must know about.",
            "Family records: parent and guardian names, contact details, occupation, emergency contacts and the parent–child relationship.",
            "Academic records: attendance, assignments, submissions, assessment scores, results, report cards and conduct ratings.",
            "Financial records: invoices, payments, receipts and outstanding balances.",
            "Application records: everything supplied during an admission application, including uploaded documents.",
            "Technical records: sign-in times, audit logs of administrative actions, and device information where needed for security.",
          ],
        },
        {
          heading: "How we use it",
          paragraphs: [
            "We use personal information to educate and care for pupils, to communicate with families, to manage admissions and fees, and to meet our legal and regulatory obligations as a registered school.",
            "We do not use children's information to profile them commercially, and we do not allow third-party advertising or analytics that track children on this platform.",
          ],
        },
        {
          heading: "Who can see what",
          paragraphs: [
            "Access is controlled by role and enforced on the server on every request, not in the browser.",
          ],
          bullets: [
            "Parents see only their own children — never another family's records.",
            "Pupils see only their own work, results and attendance.",
            "Teachers see only pupils in classes they teach, and only the data relevant to teaching them.",
            "Accountants see financial records but not academic detail.",
            "Administrators have broad access, and every sensitive action they take is written to an audit log they cannot edit.",
          ],
        },
        {
          heading: "Children's images",
          paragraphs: [
            "We publish photographs of children only where a parent or guardian has given consent, and we record that consent against each image.",
            "On the public website we never publish a child's full name alongside their photograph, their class section, or any contact information. Pupil achievements are published using initials and year group only.",
            "Consent can be withdrawn at any time by contacting the school office, and we will remove the affected images.",
          ],
        },
        {
          heading: "How we protect it",
          paragraphs: ["Security is designed in, not added afterwards."],
          bullets: [
            "All traffic is served over HTTPS.",
            "Sessions are signed server-side; roles are read from the database on every request, never trusted from the browser.",
            "Uploaded files are validated for type and size on the server and stored privately.",
            "Private documents are served through short-lived, signed URLs — never from a public folder.",
            "Payments are verified server-side with the payment provider; a client-side callback alone never marks an invoice paid.",
            "Administrative actions are recorded in an append-only audit log.",
          ],
        },
        {
          heading: "How long we keep it",
          paragraphs: [
            "Academic records are retained permanently, because former pupils and their families rely on them for secondary school admission and beyond. Promotion between classes never overwrites a previous year's record.",
            "Unsuccessful admission applications and their uploaded documents are deleted twelve months after the decision. Enquiry records are deleted after twenty-four months.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "You may ask to see the information we hold about you or your child, ask us to correct anything inaccurate, or ask us to delete information we no longer need to keep.",
            `Write to ${SCHOOL.email} or to the school office at ${SCHOOL.address}. We respond to requests within thirty days.`,
          ],
        },
        {
          heading: "Contact",
          paragraphs: [
            `Questions about this policy, or about how we handle your family's information, should go to the School Administrator at ${SCHOOL.email} or ${SCHOOL.phone}.`,
          ],
        },
      ]}
    />
  );
}
