import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { StatCard, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { AttendanceLegend, AttendanceStrip } from "@/components/portal/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { assertStudentAccess, requireParent } from "@/lib/school/auth";
import {
  getAttendanceForStudent,
  getClass,
  getInvoicesForStudent,
  getLevel,
  getParentsOfStudent,
  getReportCardsForStudent,
  getStudent,
  getStudentAssignments,
  getSubjects,
  getTerm,
  studentName,
  summariseAttendance,
  teacherNameById,
} from "@/lib/school/data";
import { avatarTone, formatDate, initials, money } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Child profile" };

export default async function ChildProfilePage({ params }: PageProps<"/portal/parent/children/[id]">) {
  const user = await requireParent();
  const { id } = await params;
  const child = getStudent(id);
  if (!child) notFound();
  // Authorisation: a parent may only ever open their own child's record.
  assertStudentAccess(user, child.id);

  const cls = getClass(child.classId);
  const level = cls ? getLevel(cls.levelId) : null;
  const attendance = summariseAttendance(getAttendanceForStudent(child.id));
  const assignments = getStudentAssignments(child.id);
  const graded = assignments.filter((a) => a.submission?.status === "graded");
  const average = graded.length
    ? Math.round(
        (graded.reduce((s, a) => s + (a.submission?.score ?? 0) / a.assignment.maxScore, 0) / graded.length) * 100,
      )
    : 0;
  const invoices = getInvoicesForStudent(child.id);
  const balance = invoices.reduce((s, i) => s + (i.total - i.amountPaid), 0);
  const reportCards = getReportCardsForStudent(child.id);
  const subjects = level ? getSubjects().filter((s) => s.levelIds.includes(level.id)) : [];
  const guardians = getParentsOfStudent(child.id);
  const route = child.transportRouteId
    ? getDb().transportRoutes.find((r) => r.id === child.transportRouteId)
    : null;
  const certificates = getDb().certificates.filter((c) => c.studentId === child.id);

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
                        <p className="text-sm font-extrabold">{getTerm(report.termId)?.name}</p>
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
            <AttendanceStrip records={getAttendanceForStudent(child.id)} />
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
                <dd className="truncate font-bold">{teacherNameById(cls?.classTeacherId)}</dd>
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
            <h2 className="font-heading text-base font-extrabold">Health & transport</h2>
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
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Transport</dt>
                <dd className="truncate font-bold">{route ? `${route.busNo} · ${route.route}` : "Not using school transport"}</dd>
              </div>
            </dl>
          </Card>

          {certificates.length > 0 ? (
            <Card className="gap-0 p-5 sm:p-6">
              <h2 className="font-heading text-base font-extrabold">Certificates</h2>
              <Separator className="my-4" />
              <ul className="space-y-3">
                {certificates.map((certificate) => (
                  <li key={certificate.id} className="rounded-xl border bg-card p-3.5">
                    <p className="text-sm font-bold">{certificate.award}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {certificate.sessionName} · {certificate.certificateNo}
                    </p>
                    <Link
                      href={`/verify?no=${certificate.certificateNo}`}
                      className="mt-1.5 inline-block text-xs font-bold text-primary underline-offset-4 hover:underline dark:text-gold"
                    >
                      Verify online
                    </Link>
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
