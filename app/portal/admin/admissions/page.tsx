import type { Metadata } from "next";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { ApplicationDecisionDialog } from "@/components/portal/application-decision";
import { BarChart } from "@/components/portal/charts";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAdmin } from "@/lib/school/auth";
import { ADMISSION_OPEN_LEVELS, CLASS_LEVELS } from "@/lib/school/config";
import { getApplicationsByStatus, getLevel, paginate } from "@/lib/school/data";
import { APPLICATION_STATUS, formatDate } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";
import type { ApplicationStatus } from "@/lib/school/types";

export const metadata: Metadata = { title: "Admissions" };

export default async function AdminAdmissionsPage({ searchParams }: PageProps<"/portal/admin/admissions">) {
  await requireAdmin();
  const params = await searchParams;

  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const status = typeof params.status === "string" ? params.status : "all";
  const levelId = typeof params.level === "string" ? params.level : "all";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const db = getDb();
  const filtered = db.applications
    .filter((application) => {
      if (status !== "all" && application.status !== status) return false;
      if (levelId !== "all" && application.intendedLevelId !== levelId) return false;
      if (!q) return true;
      return (
        application.applicationNo.toLowerCase().includes(q) ||
        `${application.pupil.firstName} ${application.pupil.lastName}`.toLowerCase().includes(q) ||
        application.guardian.name.toLowerCase().includes(q) ||
        application.ownerEmail.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const result = paginate(filtered, page, 10);
  const byStatus = getApplicationsByStatus();
  const pending = db.applications.filter((a) =>
    ["submitted", "under_review", "documents_required"].includes(a.status),
  ).length;
  const accepted = db.applications.filter((a) =>
    ["accepted", "conditionally_accepted", "enrolled"].includes(a.status),
  ).length;

  return (
    <>
      <PortalPageHeader
        title="Admissions"
        description="Every application for the 2026/2027 session, with review, assessment and decision tracking."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications" value={db.applications.length} icon="FileCheck" tone="info" />
        <StatCard label="Awaiting action" value={pending} icon="Clock" tone={pending > 0 ? "warning" : "success"} />
        <StatCard label="Offers made" value={accepted} icon="BadgeCheck" tone="success" />
        <StatCard
          label="Classes open"
          value={ADMISSION_OPEN_LEVELS.length}
          hint="Every class level"
          icon="School"
          tone="gold"
        />
      </div>

      <Card className="mb-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Pipeline by status</h2>
        <Separator className="my-5" />
        <BarChart
          data={byStatus.map((row) => ({
            label: APPLICATION_STATUS[row.status as ApplicationStatus]?.label ?? row.status,
            value: row.count,
          }))}
        />
      </Card>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by application number, pupil, parent or email"
          filters={[
            {
              key: "status",
              label: "Statuses",
              options: Object.entries(APPLICATION_STATUS).map(([value, meta]) => ({
                value,
                label: meta.label,
              })),
            },
            {
              key: "level",
              label: "Classes",
              options: CLASS_LEVELS.map((l) => ({ value: l.id, label: l.name })),
            },
          ]}
        />
      </Card>

      {result.items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="Search"
          title="No applications match your filters"
          description="Try a different application number, name or status."
        />
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {result.items.map((application) => {
              const meta = APPLICATION_STATUS[application.status];
              const missing = application.documents.filter((d) => d.required && !d.uploaded).length;
              return (
                <li key={application.id}>
                  <Card className="gap-0 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-muted-foreground">
                          {application.applicationNo}
                        </p>
                        <h3 className="mt-1 font-heading text-base font-extrabold">
                          {[application.pupil.firstName, application.pupil.lastName].filter(Boolean).join(" ") ||
                            "Pupil name pending"}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {getLevel(application.intendedLevelId)?.name} · applied{" "}
                          {formatDate(application.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                        <ApplicationDecisionDialog
                          applicationId={application.id}
                          applicationNo={application.applicationNo}
                          pupilName={`${application.pupil.firstName} ${application.pupil.lastName}`.trim() || "Applicant"}
                          currentStatus={application.status}
                        />
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <dl className="grid gap-4 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-xs font-bold text-muted-foreground uppercase">Parent</dt>
                        <dd className="mt-0.5 truncate font-semibold">{application.guardian.name}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold text-muted-foreground uppercase">Contact</dt>
                        <dd className="mt-0.5 truncate font-semibold">{application.guardian.phone}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold text-muted-foreground uppercase">Fee</dt>
                        <dd className="mt-0.5">
                          <StatusPill tone={application.applicationFeePaid ? "success" : "warning"}>
                            {application.applicationFeePaid ? "Paid" : "Outstanding"}
                          </StatusPill>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold text-muted-foreground uppercase">Documents</dt>
                        <dd className="mt-0.5">
                          <StatusPill tone={missing === 0 ? "success" : "danger"}>
                            {missing === 0 ? "Complete" : `${missing} missing`}
                          </StatusPill>
                        </dd>
                      </div>
                    </dl>

                    {application.assessment ? (
                      <p className="mt-4 rounded-xl bg-muted/70 p-3.5 text-xs">
                        <span className="font-extrabold">Assessment · </span>
                        {formatDate(application.assessment.date)} at {application.assessment.time},{" "}
                        {application.assessment.venue}
                        {typeof application.assessment.score === "number"
                          ? ` · scored ${application.assessment.score}%`
                          : ""}
                      </p>
                    ) : null}

                    {application.decisionNote ? (
                      <p className="mt-2 rounded-xl bg-muted/70 p-3.5 text-xs leading-relaxed">
                        <span className="font-extrabold">Decision note · </span>
                        {application.decisionNote}
                      </p>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>

          <Pager
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={result.pageSize}
            basePath="/portal/admin/admissions"
            params={{ q, status, level: levelId }}
          />
        </>
      )}
    </>
  );
}
