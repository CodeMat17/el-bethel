import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArchiveIcon, ArrowLeftIcon, CircleCheckIcon, GraduationCapIcon, UnlinkIcon } from "lucide-react";

import { LinkParentDialog } from "@/components/admin/link-dialogs";
import { ParentDialog, StudentDialog } from "@/components/admin/people-dialogs";
import { SignInCard } from "@/components/admin/sign-in-card";
import { StatCard, StatusPill } from "@/components/common";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { linkGuardian, setStudentStatus } from "@/lib/school/actions/admin";
import { isSuperAdmin, requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { studentName, summariseAttendance } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "Pupil" };

export default async function AdminStudentPage({ params }: PageProps<"/portal/admin/students/[id]">) {
  const viewer = await requireAdmin();
  const { id } = await params;
  const [record, dir] = await Promise.all([query(api.people.getStudent, { id }), getDirectory()]);
  if (!record) notFound();
  const { student, parents } = record;
  const studentId = student.id as Id<"students">;

  const [account, results, attendanceRows, assignments] = await Promise.all([
    query(api.users.forProfile, { studentId }),
    query(api.results.allForStudent, { studentId }),
    query(api.attendance.forStudent, { studentId, limit: 200 }),
    query(api.assignments.forStudent, { studentId }),
  ]);
  const attendance = summariseAttendance(attendanceRows);
  const marked = assignments.filter((a) => a.progress === "graded");
  const missed = assignments.filter((a) => a.progress === "missed").length;
  const classOptions = dir.classes.map((c) => ({ value: c.id, label: c.name }));

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/admin/students" />}>
        <ArrowLeftIcon />
        All pupils
      </Button>

      <PortalPageHeader
        eyebrow={`${dir.className(student.classId)} · ${student.studentNo}`}
        title={studentName(student)}
        description={`Admission ${student.admissionNo} · enrolled ${formatDate(student.enrolledAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={student.status === "active" ? "success" : "neutral"}>{student.status}</StatusPill>
            <Button size="sm" variant="outline" className="font-bold" render={<Link href={`/portal/admin/students/${student.id}/insights`} />}>
              Learning profile
            </Button>
            <StudentDialog classes={classOptions} student={student} />
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance" value={`${attendance.rate}%`} icon="CalendarCheck" tone={attendance.rate >= 95 ? "success" : "warning"} />
        <StatCard label="Assignments marked" value={marked.length} icon="ClipboardCheck" tone="info" />
        <StatCard label="Assignments missed" value={missed} icon="CircleAlert" tone={missed ? "warning" : "success"} />
        <StatCard label="Terms with results" value={results.length} icon="Trophy" tone="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Details</h2>
          <Separator className="my-4" />
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Date of birth", formatDate(student.dateOfBirth)],
              ["Gender", student.gender],
              ["Nationality", student.nationality],
              ["House", student.house],
              ["Blood group", student.bloodGroup || "—"],
              ["Class teacher", dir.teacherName(dir.getClass(student.classId)?.classTeacherId)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-bold text-muted-foreground uppercase">{label}</dt>
                <dd className="mt-0.5 font-semibold">{value}</dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold text-muted-foreground uppercase">Address</dt>
              <dd className="mt-0.5 font-semibold">{student.address || "—"}</dd>
            </div>
            {student.medicalNotes ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold text-muted-foreground uppercase">Medical notes</dt>
                <dd className="mt-0.5 font-semibold">{student.medicalNotes}</dd>
              </div>
            ) : null}
          </dl>
          <Separator className="my-4" />
          <div className="flex flex-wrap gap-2">
            {student.status === "active" ? (
              <>
                <ConfirmAction
                  action={setStudentStatus.bind(null, student.id, "graduated")}
                  icon={<GraduationCapIcon />}
                  pendingText="Saving…"
                  confirm={{ title: "Mark as graduated?", description: "Their sign-in will be disabled.", confirmLabel: "Mark graduated" }}
                >
                  Graduated
                </ConfirmAction>
                <ConfirmAction
                  action={setStudentStatus.bind(null, student.id, "transferred")}
                  icon={<ArchiveIcon />}
                  pendingText="Saving…"
                  confirm={{ title: "Mark as transferred?", description: "Their sign-in will be disabled.", confirmLabel: "Mark transferred" }}
                >
                  Transferred
                </ConfirmAction>
              </>
            ) : (
              <ConfirmAction action={setStudentStatus.bind(null, student.id, "active")} icon={<CircleCheckIcon />} pendingText="Saving…">
                Make active again
              </ConfirmAction>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <SignInCard
            kind="pupil"
            name={studentName(student)}
            profileId={student.id}
            account={account}
            canGrantAdmin={isSuperAdmin(viewer)}
            usernameSuffix={student.studentNo.slice(-3)}
          />

          <Card className="gap-0 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-base font-extrabold">Parents and guardians</h2>
              <div className="flex flex-wrap gap-2">
                <LinkParentDialog studentId={student.id} linkedParentIds={parents.map((p) => p.id)} />
                <ParentDialog
                  studentId={student.id}
                  trigger={
                    <Button size="sm" variant="outline" className="font-bold">
                      Add parent
                    </Button>
                  }
                />
              </div>
            </div>
            <Separator className="my-4" />
            {parents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No parent is linked yet.</p>
            ) : (
              <ul className="space-y-2">
                {parents.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/portal/admin/parents/${p.id}`} className="block truncate text-sm font-bold hover:underline">
                        {p.title} {p.firstName} {p.lastName}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.relationship} · {p.phone}
                        {p.email ? ` · ${p.email}` : ""}
                      </p>
                    </div>
                    <ConfirmAction
                      action={linkGuardian.bind(null, student.id, p.id, false)}
                      icon={<UnlinkIcon />}
                      variant="ghost"
                      pendingText="Unlinking…"
                      confirm={{ title: "Unlink this parent?", description: "They will no longer see this pupil in the parent portal.", confirmLabel: "Unlink" }}
                    >
                      Unlink
                    </ConfirmAction>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Exam results</h2>
            <Separator className="my-4" />
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No results recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {results.map((r) => (
                  <li key={r.term.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm">
                    <span className="font-bold">{r.term.name}</span>
                    <span className="text-muted-foreground">
                      {r.reportCard.average}% · position {r.reportCard.position}/{r.reportCard.classSize} ·{" "}
                      {r.reportCard.publishedAt ? "published" : "not published"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
