import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { StatCard, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { AttendanceLegend, AttendanceStrip } from "@/components/portal/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StarsSummary } from "@/components/portal/stars";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireParent } from "@/lib/school/auth";
import { api } from "@/convex/_generated/api";
import { studentName, summariseAttendance } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { query } from "@/lib/school/convex";
import { avatarTone, formatDate, initials, money } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Child profile" };

export default async function ChildProfilePage({ params }: PageProps<"/portal/parent/children/[id]">) {
  await requireParent();
  const dir = await getDirectory();
  const { id } = await params;
  // Authorisation (in Convex): a parent may only ever open their own child's record.
  const record = await query(api.people.getStudent, { id });
  if (!record) notFound();
  const child = record.student;
  const guardians = record.parents;

  const [attendanceRows, assignments, fees, reportCards, certificates, stars] = await Promise.all([
    query(api.attendance.forStudent, { studentId: child.id }),
    query(api.assignments.forStudent, { studentId: child.id }),
    query(api.fees.forStudent, { studentId: child.id }),
    query(api.results.historyForStudent, { studentId: child.id }),
    query(api.awards.certificatesForStudent, { studentId: child.id }),
    query(api.gamification.forStudent, { studentId: child.id }),
  ]);
  const cls = dir.getClass(child.classId);
  const attendance = summariseAttendance(attendanceRows);
  const graded = assignments.filter((a) => a.progress === "graded");
  const average = graded.length
    ? Math.round(
        (graded.reduce((s, a) => s + (a.submission?.score ?? 0) / Math.max(1, a.assignment.maxScore), 0) / graded.length) * 100,
      )
    : 0;
  const invoices = fees.invoices;
  const balance = invoices.reduce((s, i) => s + (i.total - i.amountPaid), 0);
  const subjects = dir.subjectsForClass(child.classId);

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/parent/children" />}>
        <ArrowLeftIcon />
        My children
      </Button>

      <PortalPageHeader
        eyebrow={`${cls?.name} · ${child.studentNo}`}
        title={studentName(child)}
        description={`Full record for ${child.firstName}, visible only to you and authorised school staff.`}
      />

      <Card className="mb-6 gap-0 overflow-hidden p-0">
        <div className="flex flex-col gap-5 bg-navy p-5 text-navy-foreground sm:flex-row sm:items-center sm:p-6">
          <Avatar className="size-20 shrink-0 ring-2 ring-gold/40">
            <AvatarFallback className={cn("text-xl font-extrabold", avatarTone(child.avatarSeed))}>
              {initials(child.firstName, child.lastName)}
            </AvatarFallback>
          </Avatar>
          <dl className="grid flex-1 gap-4 sm:grid-cols-3">
            {[
              ["Admission number", child.admissionNo],
              ["Date of birth", formatDate(child.dateOfBirth)],
              ["Gender", child.gender],
              ["Nationality", child.nationality],
              ["House", child.house],
              ["Enrolled", formatDate(child.enrolledAt)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[0.65rem] font-bold tracking-wide text-navy-foreground/50 uppercase">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance" value={`${attendance.rate}%`} icon="CalendarCheck" tone={attendance.rate >= 95 ? "success" : "warning"} />
        <StatCard label="Assignment average" value={graded.length ? `${average}%` : "—"} icon="Trophy" tone={average >= 70 ? "success" : "warning"} />
        <StatCard label="Subjects" value={subjects.length} icon="Library" tone="info" />
        <StatCard label="Fee balance" value={money(balance)} icon="Wallet" tone={balance > 0 ? "warning" : "success"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Academic record</h2>
            <Separator className="my-4" />
            {reportCards.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No report cards have been published yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {reportCards.map((report) => (
                  <li key={report.id} className="rounded-xl border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold">{dir.termName(report.termId)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Average {report.average}% · position {report.position} of {report.classSize}
                        </p>
                      </div>
                      <StatusPill tone={report.promotionStatus === "promoted" ? "success" : "neutral"}>
                        {report.promotionStatus}
                      </StatusPill>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="outline" size="lg" className="mt-4 w-full font-bold" render={<Link href={`/portal/parent/results?child=${child.id}`} />}>
              Open full results
            </Button>
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Attendance pattern</h2>
            <Separator className="my-4" />
            <AttendanceStrip records={attendanceRows} />
            <div className="mt-5">
              <AttendanceLegend />
            </div>
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Subjects studied</h2>
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <Badge key={subject.id} variant="secondary" className="h-7 px-3 font-bold">
                  {subject.name}
                </Badge>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Class and contacts</h2>
            <Separator className="my-4" />
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Class</dt>
                <dd className="font-bold">{cls?.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Room</dt>
                <dd className="font-bold">{cls?.room}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Class teacher</dt>
                <dd className="truncate font-bold">{dir.teacherName(cls?.classTeacherId)}</dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <p className="text-xs font-bold text-muted-foreground uppercase">Parents and guardians</p>
            <ul className="mt-3 space-y-3">
              {guardians.map((guardian) => (
                <li key={guardian.id} className="rounded-xl border bg-card p-3.5">
                  <p className="text-sm font-bold">
                    {guardian.title} {guardian.firstName} {guardian.lastName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {guardian.relationship} · {guardian.phone}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Health</h2>
            <Separator className="my-4" />
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Blood group</dt>
                <dd className="font-bold">{child.bloodGroup}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Medical notes</dt>
                <dd className="font-bold">{child.medicalNotes ?? "None recorded"}</dd>
              </div>
            </dl>
          </Card>

          {stars ? (
            <div>
              <StarsSummary data={stars} compact />
              <p className="mt-2 text-xs text-muted-foreground">
                {stars.badges.filter((b) => b.earned).length} of {stars.badges.length} badges earned · {stars.house} House
              </p>
            </div>
          ) : null}

          {certificates.length > 0 ? (
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Certificates</h2>
              <Separator className="my-4" />
              <ul className="space-y-3">
                {certificates.map((certificate) => (
                  <li key={certificate.id} className="rounded-xl border bg-card p-3.5">
                    <p className="text-sm font-bold">
                      {certificate.award}
                      {certificate.revokedAt ? <span className="ml-2 text-xs font-bold text-destructive">Withdrawn</span> : null}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {certificate.sessionName} · {certificate.certificateNo}
                    </p>
                    <div className="mt-1.5 flex gap-3">
                      {!certificate.revokedAt ? (
                        <a
                          href={`/api/certificates/${certificate.id}`}
                          className="text-xs font-bold text-primary underline-offset-4 hover:underline dark:text-gold"
                        >
                          Download PDF
                        </a>
                      ) : null}
                      <Link
                        href={`/verify?no=${certificate.certificateNo}`}
                        className="text-xs font-bold text-primary underline-offset-4 hover:underline dark:text-gold"
                      >
                        Verify online
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
