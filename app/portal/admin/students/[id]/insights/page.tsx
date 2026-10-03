import type { Metadata } from "next";

import { LearningProfileView } from "@/components/portal/learning-profile";
import { PortalPageHeader } from "@/components/portal/page-header";
import { api } from "@/convex/_generated/api";
import { requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";

export const metadata: Metadata = { title: "Learning profile" };

export default async function AdminPupilInsightsPage({ params }: PageProps<"/portal/admin/students/[id]/insights">) {
  await requireAdmin();
  const { id } = await params;
  const [profile, dir] = await Promise.all([query(api.insights.forStudent, { studentId: id }), getDirectory()]);
  const name = `${profile.student.firstName} ${profile.student.lastName}`;

  return (
    <>
      <PortalPageHeader
        eyebrow={dir.className(profile.student.classId)}
        title={`${name} — learning profile`}
        breadcrumb={[
          { label: "Students", href: "/portal/admin/students" },
          { label: name, href: `/portal/admin/students/${id}` },
          { label: "Learning profile", href: `/portal/admin/students/${id}/insights` },
        ]}
      />
      <LearningProfileView profile={profile} />
    </>
  );
}
