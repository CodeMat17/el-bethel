import Link from "next/link";
import type { Metadata } from "next";
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  DownloadIcon,
  FileTextIcon,
  SearchIcon,
} from "lucide-react";

import { PageHero, StatusPill } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { CLASS_LEVELS } from "@/lib/school/config";
import { getContent, getSchool } from "@/lib/school/site-content";
import { publicQuery } from "@/lib/school/convex";
import { APPLICATION_STATUS, formatDate, formatDateTime, money } from "@/lib/school/format";
import type { Application } from "@/lib/school/types";

export const metadata: Metadata = {
  title: "Check Application Status",
  description:
    "Track the status of your El-Bethel International Academy admission application using your application number.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/admissions/status" },
};

const TRACKER = [
  { key: "account", label: "Account" },
  { key: "application", label: "Application" },
  { key: "documents", label: "Documents" },
  { key: "payment", label: "Payment" },
  { key: "assessment", label: "Assessment" },
  { key: "decision", label: "Decision" },
  { key: "enrollment", label: "Enrolment" },
];

function trackerIndex(application: Application): number {
  switch (application.status) {
    case "draft":
      return 1;
    case "submitted":
    case "under_review":
      return 2;
    case "documents_required":
      return 2;
    case "assessment_scheduled":
    case "assessment_completed":
    case "interview_scheduled":
      return 4;
    case "accepted":
    case "conditionally_accepted":
    case "waitlisted":
    case "not_accepted":
      return 5;
    case "enrolled":
      return 6;
    default:
      return 1;
  }
}

export default async function StatusPage({ searchParams }: PageProps<"/admissions/status">) {
  const params = await searchParams;
  const [SCHOOL, rules] = await Promise.all([getSchool(), getContent("fees")]);
  const applicationFee = rules.admissionFees[0]?.amount ?? 0;
  const ref = typeof params.ref === "string" ? params.ref : "";
  const email = typeof params.email === "string" ? params.email : "";

  const justSubmitted = params.submitted === "1";

  // Public lookup requires BOTH the application number and the email on the record.
  const looked = ref && email ? await publicQuery(api.admissions.lookup, { applicationNo: ref, email }) : null;
  const lookupOk = Boolean(looked);
  const applications: Application[] = looked ? [looked] : [];

  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Application status"
        lede="Track your application from submission through assessment to a decision."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Admissions", href: "/admissions" },
          { label: "Status", href: "/admissions/status" },
        ]}
      />

      <section className="eb-section">
        <div className="eb-container max-w-5xl">
          {justSubmitted ? (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
              <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" />
              <p>
                <span className="font-extrabold">Application {ref} submitted.</span> Keep this number. Enter it with your
                email address below at any time to see your application&apos;s progress.
              </p>
            </div>
          ) : null}

          {applications.length === 0 ? (
            <Card className="gap-0 p-6 sm:p-8">
              <h2 className="font-heading text-lg font-extrabold">Look up an application</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter your application number and the email address on the application.
              </p>
              <form method="get" className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <div>
                  <label htmlFor="ref" className="mb-1.5 block text-xs font-bold uppercase">
                    Application number
                  </label>
                  <Input id="ref" name="ref" defaultValue={ref} placeholder="ADM-2026-00452" required className="h-11" />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase">
                    Email on the application
                  </label>
                  <Input id="email" name="email" type="email" defaultValue={email} placeholder="you@example.com" required className="h-11" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" size="lg" className="h-11 w-full font-bold sm:w-auto">
                    <SearchIcon />
                    Check status
                  </Button>
                </div>
              </form>

              {ref && email && !lookupOk ? (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
                >
                  <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
                  We couldn&apos;t find an application matching that number and email address. Please
                  check both and try again.
                </div>
              ) : null}
            </Card>
          ) : null}

          <div className="mt-8 space-y-8">
            {applications.map((application) => {
              const status = APPLICATION_STATUS[application.status];
              const index = trackerIndex(application);

              return (
                <div key={application.id} className="space-y-6">
                  <Card className="gap-0 overflow-hidden p-0">
                    <div className="bg-navy p-6 text-navy-foreground sm:p-8">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold tracking-wide text-navy-foreground/60 uppercase">
                            Application number
                          </p>
                          <p className="mt-1 font-heading text-2xl font-extrabold tracking-wide text-gold">
                            {application.applicationNo}
                          </p>
                          <p className="mt-3 text-sm text-navy-foreground/80">
                            {[application.pupil.firstName, application.pupil.lastName].filter(Boolean).join(" ") || "Pupil name pending"}
                            {" · "}
                            {CLASS_LEVELS.find((l) => l.id === application.intendedLevelId)?.name}
                            {" · "}
                            {SCHOOL.session}
                          </p>
                        </div>
                        <StatusPill tone={status.tone} className="bg-navy-foreground/10 ring-navy-foreground/20">
                          {status.label}
                        </StatusPill>
                      </div>
                    </div>

                    {/* Progress tracker */}
                    <div className="p-6 sm:p-8">
                      <ol className="grid gap-3 sm:grid-cols-7 sm:gap-2">
                        {TRACKER.map((stage, i) => {
                          const done = i < index;
                          const active = i === index;
                          return (
                            <li key={stage.key} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
                              <span
                                className={`grid size-7 shrink-0 place-items-center rounded-full text-[0.65rem] font-extrabold ring-1 ${
                                  done
                                    ? "bg-success text-success-foreground ring-success"
                                    : active
                                      ? "bg-gold text-gold-foreground ring-gold"
                                      : "text-muted-foreground ring-border"
                                }`}
                              >
                                {done ? <CheckCircle2Icon className="size-3.5" /> : i + 1}
                              </span>
                              <span className={`text-xs font-bold ${active ? "" : "text-muted-foreground"}`}>
                                {stage.label}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  </Card>

                  <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <div className="space-y-6">
                      {application.assessment ? (
                        <Card className="gap-0 p-6">
                          <h3 className="flex items-center gap-2 font-heading text-base font-extrabold">
                            <CalendarClockIcon className="size-4 text-gold" />
                            Entrance assessment
                          </h3>
                          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div>
                              <dt className="text-xs font-bold text-muted-foreground uppercase">Date</dt>
                              <dd className="mt-0.5 text-sm font-semibold">{formatDate(application.assessment.date)}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-bold text-muted-foreground uppercase">Time</dt>
                              <dd className="mt-0.5 text-sm font-semibold">{application.assessment.time}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-bold text-muted-foreground uppercase">Venue</dt>
                              <dd className="mt-0.5 text-sm font-semibold">{application.assessment.venue}</dd>
                            </div>
                          </dl>
                          {typeof application.assessment.score === "number" ? (
                            <p className="mt-4 rounded-xl bg-muted/70 p-3 text-sm">
                              <span className="font-extrabold">Assessment score: </span>
                              {application.assessment.score}%
                            </p>
                          ) : null}
                        </Card>
                      ) : null}

                      {application.interview ? (
                        <Card className="gap-0 p-6">
                          <h3 className="flex items-center gap-2 font-heading text-base font-extrabold">
                            <CalendarClockIcon className="size-4 text-gold" />
                            Parent and child interaction
                          </h3>
                          <p className="mt-3 text-sm text-muted-foreground">
                            {formatDate(application.interview.date)} at {application.interview.time} ·{" "}
                            {application.interview.venue}
                          </p>
                        </Card>
                      ) : null}

                      {application.decisionNote ? (
                        <Card
                          className={`gap-0 p-6 ${
                            ["accepted", "conditionally_accepted", "enrolled"].includes(application.status)
                              ? "border-success/40 bg-success/10"
                              : "border-border"
                          }`}
                        >
                          <h3 className="font-heading text-base font-extrabold">Admission decision</h3>
                          <p className="mt-2 text-sm leading-relaxed">{application.decisionNote}</p>
                        </Card>
                      ) : null}

                      <Card className="gap-0 p-6">
                        <h3 className="font-heading text-base font-extrabold">Application history</h3>
                        <ol className="mt-5 space-y-5 border-l pl-5">
                          {[...application.timeline].reverse().map((event, i) => (
                            <li key={`${event.at}-${i}`} className="relative">
                              <span className="absolute top-1.5 -left-[1.4375rem] size-2.5 rounded-full bg-gold ring-4 ring-card" />
                              <p className="text-sm font-extrabold">{APPLICATION_STATUS[event.status].label}</p>
                              <p className="mt-0.5 text-sm text-muted-foreground">{event.note}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatDateTime(event.at)} · {event.actor}
                              </p>
                            </li>
                          ))}
                        </ol>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card className="gap-0 p-6">
                        <h3 className="font-heading text-base font-extrabold">Payment</h3>
                        <Separator className="my-4" />
                        <dl className="space-y-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-muted-foreground">Application fee</dt>
                            <dd className="font-bold">{money(applicationFee)}</dd>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <dt className="text-muted-foreground">Status</dt>
                            <dd>
                              <StatusPill tone={application.applicationFeePaid ? "success" : "warning"}>
                                {application.applicationFeePaid ? "Paid" : "Outstanding"}
                              </StatusPill>
                            </dd>
                          </div>
                          {application.applicationFeeReference ? (
                            <div className="flex items-center justify-between gap-3">
                              <dt className="text-muted-foreground">Reference</dt>
                              <dd className="font-mono text-xs font-bold">{application.applicationFeeReference}</dd>
                            </div>
                          ) : null}
                        </dl>
                      </Card>

                      <Card className="gap-0 p-6">
                        <h3 className="font-heading text-base font-extrabold">Bring to screening</h3>
                        <p className="mt-1 text-xs text-muted-foreground">Originals and one photocopy of each.</p>
                        <Separator className="my-4" />
                        <ul className="space-y-2.5 text-sm">
                          {application.documents.map((doc) => (
                            <li key={doc.key} className="flex items-center justify-between gap-3">
                              <span className="flex min-w-0 items-center gap-2">
                                <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{doc.label}</span>
                              </span>
                              <span className="shrink-0 text-xs font-bold text-muted-foreground">
                                {doc.required ? "Required" : "Optional"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </Card>

                      <Card className="gap-0 p-6">
                        <h3 className="font-heading text-base font-extrabold">Downloads</h3>
                        <Separator className="my-4" />
                        <div className="grid gap-2">
                          <Button variant="outline" size="sm" className="justify-start font-bold" render={<Link href="/documents" />}>
                            <DownloadIcon />
                            Admission requirements
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start font-bold" render={<Link href="/admissions#fees" />}>
                            <DownloadIcon />
                            Fee schedule
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start font-bold" render={<Link href="/calendar" />}>
                            <DownloadIcon />
                            Academic calendar
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>
    </>
  );
}
