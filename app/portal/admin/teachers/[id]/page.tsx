import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { TeacherDialog } from "@/components/admin/people-dialogs";
import { SignInCard } from "@/components/admin/sign-in-card";
import { StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { isSuperAdmin, requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { teacherName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "Teacher" };

export default async function AdminTeacherPage({ params }: PageProps<"/portal/admin/teachers/[id]">) {
  const viewer = await requireAdmin();
  const { id } = await params;
  const [data, dir] = await Promise.all([query(api.people.getTeacherDetail, { id }), getDirectory()]);
  if (!data) notFound();
  const { teacher, account } = data;
  const departments = [...new Set(dir.teachers.map((t) => t.department))].sort();
  const teaching = dir.teaching.filter((r) => r.teacherId === teacher.id);
  const classTeacherOf = dir.classes.filter((c) => c.classTeacherId === teacher.id);

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 font-bold" render={<Link href="/portal/admin/teachers" />}>
        <ArrowLeftIcon />
        All staff
      </Button>

      <PortalPageHeader
        eyebrow={`${teacher.department} · ${teacher.staffNo}`}
        title={teacherName(teacher)}
        description={`${teacher.position} · joined ${formatDate(teacher.joinedAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={teacher.active ? "success" : "neutral"}>{teacher.active ? "Active" : "Left"}</StatusPill>
            <TeacherDialog teacher={teacher} departments={departments} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Details</h2>
            <Separator className="my-4" />
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Email", teacher.email || "—"],
                ["Phone", teacher.phone || "—"],
                ["Experience", `${teacher.experienceYears} years`],
                ["On the website", teacher.featured ? "Yes" : "No"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-bold text-muted-foreground uppercase">{label}</dt>
                  <dd className="mt-0.5 font-semibold">{value}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold text-muted-foreground uppercase">Qualifications</dt>
                <dd className="mt-0.5 font-semibold">{teacher.qualifications.join(", ") || "—"}</dd>
              </div>
            </dl>
          </Card>
          {teacher.active ? (
            <SignInCard kind="teacher" name={teacherName(teacher)} email={teacher.email} profileId={teacher.id} account={account} canGrantAdmin={isSuperAdmin(viewer)} />
          ) : null}
        </div>

        <Card className="gap-0 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base font-extrabold">Teaching</h2>
            <Button size="sm" variant="outline" className="font-bold" render={<Link href="/portal/admin/classes" />}>
              Assign on Classes page
            </Button>
          </div>
          <Separator className="my-4" />
          {classTeacherOf.length > 0 ? (
            <p className="mb-4 text-sm">
              Class teacher of{" "}
              {classTeacherOf.map((c) => (
                <Badge key={c.id} className="mr-1 font-bold">
                  {c.name}
                </Badge>
              ))}
            </p>
          ) : null}
          {teaching.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not assigned to any subject yet.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {teaching.map((row) => (
                <li key={row.id} className="rounded-xl border bg-card px-3 py-2 text-sm">
                  <span className="font-bold">{dir.subjectName(row.subjectId)}</span>
                  <span className="text-muted-foreground"> · {dir.className(row.classId)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
