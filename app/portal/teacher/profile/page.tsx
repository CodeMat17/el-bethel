import type { Metadata } from "next";
import { ShieldCheckIcon } from "lucide-react";

import { EmptyState, StatCard } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireTeacher } from "@/lib/school/auth";
import { ROLE_LABELS } from "@/lib/school/config";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";
import { teacherName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { avatarTone, formatDate, initials } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

export default async function TeacherProfilePage() {
  const user = await requireTeacher();
  const teacher = user.teacherId ? await query(api.people.myTeacher, {}) : null;

  if (!teacher) {
    return <EmptyState icon="GraduationCap" title="No teaching record" description="Contact the school administrator." />;
  }

  const [dir, sizes, timetable] = await Promise.all([
    getDirectory(),
    query(api.people.classSizes, {}),
    query(api.timetable.forTeacher, {}),
  ]);
  const classes = dir.classesForTeacher(teacher.id);
  const subjects = dir.subjectsForTeacher(teacher.id);
  const pupils = classes.reduce((sum, c) => sum + (sizes[c.id] ?? 0), 0);
  const lessons = timetable.length;

  return (
    <>
      <PortalPageHeader title="My profile" description="Your staff record, teaching load and account security." />

      <Card className="mb-6 gap-0 overflow-hidden p-0">
        <div className="flex flex-col gap-4 bg-navy p-6 text-navy-foreground sm:flex-row sm:items-center">
          <Avatar className="size-20 shrink-0 ring-2 ring-gold/40">
            <AvatarFallback className={cn("text-xl font-extrabold", avatarTone(teacher.avatarSeed))}>
              {initials(teacher.firstName, teacher.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="font-heading text-2xl font-extrabold">{teacherName(teacher)}</h2>
            <p className="mt-1 text-sm text-navy-foreground/70">
              {teacher.position} · {teacher.department}
            </p>
            <p className="mt-0.5 text-sm text-navy-foreground/70">
              {teacher.staffNo} · joined {formatDate(teacher.joinedAt)}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Classes" value={classes.length} icon="School" tone="info" />
        <StatCard label="Pupils taught" value={pupils} icon="Backpack" tone="gold" />
        <StatCard label="Subjects" value={subjects.length} icon="Library" tone="neutral" />
        <StatCard label="Lessons a week" value={lessons} icon="Clock" tone="success" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Staff record</h2>
          <Separator className="my-4" />
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["Email", teacher.email],
              ["Phone", teacher.phone],
              ["Department", teacher.department],
              ["Experience", `${teacher.experienceYears} years`],
              ["Class teacher", teacher.isClassTeacher ? "Yes" : "No"],
              ["Status", teacher.active ? "Active" : "Inactive"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-bold text-muted-foreground uppercase">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold break-words">{value}</dd>
              </div>
            ))}
          </dl>

          <Separator className="my-5" />

          <p className="text-xs font-bold text-muted-foreground uppercase">Qualifications</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {teacher.qualifications.map((q) => (
              <Badge key={q} variant="secondary" className="font-bold">{q}</Badge>
            ))}
          </div>

          <Separator className="my-5" />

          <p className="text-xs font-bold text-muted-foreground uppercase">Account roles</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.roles.map((role) => (
              <Badge key={role} className="font-bold">{ROLE_LABELS[role]}</Badge>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">Teaching load</h2>
            <Separator className="my-4" />
            <p className="text-xs font-bold text-muted-foreground uppercase">Classes</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {classes.map((cls) => (
                <Badge key={cls.id} variant="outline" className="font-bold">{cls.name}</Badge>
              ))}
            </div>
            <p className="mt-5 text-xs font-bold text-muted-foreground uppercase">Subjects</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {subjects.map((subject) => (
                <Badge key={subject.id} variant="secondary" className="font-bold">{subject.name}</Badge>
              ))}
            </div>
          </Card>

          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-heading text-base font-extrabold">
              <ShieldCheckIcon className="size-4 text-gold" />
              What your account can and cannot do
            </h2>
            <Separator className="my-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold text-success uppercase">You can</p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <li>· View pupils in classes you teach</li>
                  <li>· Create and grade assignments</li>
                  <li>· Upload learning materials</li>
                  <li>· Take attendance</li>
                  <li>· Enter authorised scores</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold text-destructive uppercase">You cannot</p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <li>· Change school fees</li>
                  <li>· Delete pupil records</li>
                  <li>· Manage system settings</li>
                  <li>· View unrelated financial records</li>
                  <li>· See pupils in classes you do not teach</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
