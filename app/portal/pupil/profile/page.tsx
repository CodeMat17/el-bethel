import type { Metadata } from "next";
import { StarIcon } from "lucide-react";

import { EmptyState, StatCard } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { ProfilePhoto } from "@/components/portal/profile-photo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { requirePupil } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { studentName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { formatDate, initials } from "@/lib/school/format";

export const metadata: Metadata = { title: "My profile" };

export default async function PupilProfilePage() {
  const user = await requirePupil();
  const student = user.studentId ? await query(api.people.myStudent, {}) : null;
  if (!student) {
    return <EmptyState icon="Backpack" title="No school record" description="Please ask your class teacher." />;
  }

  const [assignments, certificates, dir] = await Promise.all([
    query(api.assignments.forStudent, { studentId: student.id }),
    query(api.awards.certificatesForStudent, { studentId: student.id }),
    getDirectory(),
  ]);
  const cls = dir.getClass(student.classId);
  const graded = assignments.filter((a) => a.progress === "graded");

  return (
    <>
      <PortalPageHeader title="My profile" description="Who you are at school, and what you have achieved." />

      <Card className="mb-6 gap-0 overflow-hidden p-0">
        <div className="flex flex-col items-center gap-4 bg-navy p-6 text-center text-navy-foreground sm:flex-row sm:text-left">
          <ProfilePhoto
            url={student.photo?.url}
            seed={student.avatarSeed}
            initials={initials(student.firstName, student.lastName)}
          />
          <div className="min-w-0">
            <h2 className="font-heading text-2xl font-extrabold sm:text-3xl">{studentName(student)}</h2>
            <p className="mt-1 text-sm text-navy-foreground/70">
              {dir.className(student.classId)} · {student.house} House
            </p>
            <p className="mt-0.5 text-sm text-navy-foreground/70">
              My class teacher is {dir.teacherName(cls?.classTeacherId)}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Work marked" value={graded.length} icon="ClipboardCheck" tone="info" />
        <StatCard label="Certificates" value={certificates.length} icon="Award" tone="gold" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">About me</h2>
          <Separator className="my-4" />
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["Student number", student.studentNo],
              ["Class", dir.className(student.classId)],
              ["Classroom", cls?.room ?? "—"],
              ["House", student.house],
              ["Date of birth", formatDate(student.dateOfBirth)],
              ["Joined El-Bethel", formatDate(student.enrolledAt)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-bold text-muted-foreground uppercase">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 rounded-xl bg-muted/70 p-4 text-xs leading-relaxed text-muted-foreground">
            Only you, your family and your teachers can see this page. If anything here is wrong, tell
            your class teacher.
          </p>
        </Card>

        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">My certificates</h2>
          <Separator className="my-4" />
          {certificates.length === 0 ? (
            <div className="py-8 text-center">
              <StarIcon className="mx-auto size-9 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                No certificates yet — keep working hard!
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {certificates.map((certificate) => (
                <li key={certificate.id} className="rounded-xl border border-gold/30 bg-gold/8 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold text-gold-foreground">
                      <StarIcon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{certificate.award}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {certificate.sessionName} · {certificate.certificateNo}
                      </p>
                    </div>
                    {!certificate.revokedAt ? (
                      <a href={`/api/certificates/${certificate.id}`} className="shrink-0 text-xs font-bold text-primary underline-offset-4 hover:underline dark:text-gold">
                        Download
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-bold">{student.house} House</Badge>
          </div>
        </Card>
      </div>
    </>
  );
}
