import Link from "next/link";
import { ArrowRightIcon, CheckCircle2Icon, PencilIcon } from "lucide-react";

import {
  AccountStep,
  DocumentsStep,
  GuardianStep,
  PaymentStep,
  PupilStep,
  SubmitStep,
} from "@/components/admissions/steps";
import { APPLY_STEPS, WizardProgress, type ApplyStepKey } from "@/components/admissions/wizard-shell";
import { PageHero } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { draftTokenHash } from "@/lib/school/admissions";
import { CLASS_LEVELS } from "@/lib/school/config";
import { publicQuery } from "@/lib/school/convex";
import { formatDate } from "@/lib/school/format";
import { getContent } from "@/lib/school/site-content";
import { pageMetadata } from "@/lib/school/seo";

export const generateMetadata = () =>
  pageMetadata({
    title: "Apply Online",
    description:
      "Start or resume an online admission application to El-Bethel International Academy, Abuja, for the 2026/2027 session.",
    path: "/admissions/apply",
  });

const STEP_COPY: Record<ApplyStepKey, { title: string; lede: string }> = {
  account: { title: "Start your application", lede: "Tell us who you are and which class you are applying for. Your progress is saved in this browser." },
  pupil: { title: "Pupil information", lede: "Tell us about the child you are applying for." },
  guardian: { title: "Parent or guardian information", lede: "Who should we contact about this application?" },
  documents: { title: "Documents for screening", lede: "Bring these documents with you when you come in for screening. Nothing is uploaded online." },
  review: { title: "Review your application", lede: "Check everything carefully. You can still go back and edit any step." },
  payment: { title: "Application fee", lede: "Pay at the school bursary or by bank transfer to the account below." },
  submit: { title: "Submit your application", lede: "One last confirmation and your application goes to our admissions team." },
};

export default async function ApplyPage({ searchParams }: PageProps<"/admissions/apply">) {
  const params = await searchParams;
  const requested = (Array.isArray(params.step) ? params.step[0] : params.step) as ApplyStepKey | undefined;

  // The draft belongs to whoever holds this browser's application cookie.
  const tokenHash = await draftTokenHash();
  const found = tokenHash ? await publicQuery(api.admissions.getDraft, { tokenHash }) : null;
  const draft = found?.status === "draft" ? found : null;

  const step: ApplyStepKey = !draft ? "account" : (requested && APPLY_STEPS.some((s) => s.key === requested) ? requested : "pupil");

  const reachable: ApplyStepKey[] = draft
    ? ["pupil", "guardian", "documents", "review", "payment", "submit"]
    : ["account"];

  const [rules, bank] = await Promise.all([getContent("fees"), publicQuery(api.fees.bankDetails, {})]);
  const applicationFee = rules.admissionFees[0]?.amount ?? 0;
  const OPEN_LEVELS = CLASS_LEVELS.filter((l) => rules.openLevels.includes(l.id)).map((l) => ({ id: l.id, name: l.name }));

  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Apply online"
        lede="Seven short steps. Your progress is saved in this browser, so you can stop and come back on the same device."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Admissions", href: "/admissions" },
          { label: "Apply", href: "/admissions/apply" },
        ]}
      />

      <section className="eb-section">
        <div className="eb-container max-w-4xl">
          <WizardProgress current={step} reachable={reachable} />

          <Card className="mt-8 gap-0 p-6 sm:p-8">
            <h2 className="font-heading text-xl font-extrabold sm:text-2xl">{STEP_COPY[step].title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{STEP_COPY[step].lede}</p>
            <Separator className="my-7" />

            {step === "account" ? (
              <>
                <AccountStep levels={OPEN_LEVELS} />
                <p className="mt-6 text-sm text-muted-foreground">
                  Already submitted an application?{" "}
                  <Link href="/admissions/status" className="font-bold text-primary underline-offset-4 hover:underline dark:text-gold">
                    Check its status
                  </Link>
                </p>
              </>
            ) : null}

            {step === "pupil" && draft ? (
              <PupilStep pupil={draft.pupil} intendedLevelId={draft.intendedLevelId} levels={OPEN_LEVELS} />
            ) : null}

            {step === "guardian" && draft ? <GuardianStep guardian={draft.guardian} /> : null}

            {step === "documents" && draft ? <DocumentsStep documents={draft.documents} /> : null}

            {step === "review" && draft ? (
              <div className="space-y-6">
                <ReviewBlock
                  title="Pupil"
                  href="/admissions/apply?step=pupil"
                  rows={[
                    ["Name", [draft.pupil.firstName, draft.pupil.middleName, draft.pupil.lastName].filter(Boolean).join(" ") || "—"],
                    ["Date of birth", draft.pupil.dateOfBirth ? formatDate(draft.pupil.dateOfBirth) : "—"],
                    ["Gender", draft.pupil.gender || "—"],
                    ["Nationality", draft.pupil.nationality || "—"],
                    ["Previous school", draft.pupil.previousSchool || "—"],
                    ["Intended class", CLASS_LEVELS.find((l) => l.id === draft.intendedLevelId)?.name ?? "—"],
                    ["Address", draft.pupil.address || "—"],
                  ]}
                />
                <ReviewBlock
                  title="Parent or guardian"
                  href="/admissions/apply?step=guardian"
                  rows={[
                    ["Name", draft.guardian.name || "—"],
                    ["Relationship", draft.guardian.relationship || "—"],
                    ["Phone", draft.guardian.phone || "—"],
                    ["Email", draft.guardian.email || "—"],
                    ["Occupation", draft.guardian.occupation || "—"],
                    ["Emergency contact", draft.guardian.emergencyContact ? `${draft.guardian.emergencyContact} · ${draft.guardian.emergencyPhone}` : "—"],
                  ]}
                />
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-heading text-base font-extrabold">Documents to bring for screening</h3>
                  </div>
                  <ul className="mt-3 grid gap-2">
                    {draft.documents.map((doc) => (
                      <li key={doc.key} className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm">
                        <span className="font-semibold">{doc.label}</span>
                        <span className={`text-xs font-bold ${doc.required ? "text-foreground" : "text-muted-foreground"}`}>
                          {doc.required ? "Required" : "Optional"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button size="lg" className="h-11 w-full font-bold sm:w-auto" render={<Link href="/admissions/apply?step=payment" />}>
                  Continue to payment
                  <ArrowRightIcon />
                </Button>
              </div>
            ) : null}

            {step === "payment" && draft ? (
              draft.applicationFeePaid ? (
                <div className="space-y-5">
                  <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
                    <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" />
                    <p>
                      <span className="font-extrabold">Application fee received.</span> Thank you.
                    </p>
                  </div>
                  <Button size="lg" className="h-11 font-bold" render={<Link href="/admissions/apply?step=submit" />}>
                    Continue to submit
                    <ArrowRightIcon />
                  </Button>
                </div>
              ) : (
                <PaymentStep amount={applicationFee} applicationNo={draft.applicationNo} bank={bank} />
              )
            ) : null}

            {step === "submit" && draft ? <SubmitStep applicationNo={draft.applicationNo} /> : null}
          </Card>

          {draft ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Application <span className="font-bold text-foreground">{draft.applicationNo}</span> · saved
              in this browser · you can close this page and return on this device any time.
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}

function ReviewBlock({
  title,
  href,
  rows,
}: {
  title: string;
  href: string;
  rows: [string, string][];
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-base font-extrabold">{title}</h3>
        <Button variant="ghost" size="sm" className="font-bold" render={<Link href={href} />}>
          <PencilIcon />
          Edit
        </Button>
      </div>
      <dl className="mt-3 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="bg-card px-4 py-3">
            <dt className="text-xs font-bold text-muted-foreground uppercase">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
