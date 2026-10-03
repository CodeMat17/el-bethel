import type { Metadata } from "next";

import { LearningProfileView } from "@/components/portal/learning-profile";
import { PortalPageHeader } from "@/components/portal/page-header";
import { api } from "@/convex/_generated/api";
import { requireTeacher } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { getDirectory } from "@/lib/school/directory";

export const metadata: Metadata = { title: "Learning profile" };

export default async function TeacherPupilInsightsPage({ params }: PageProps<"/portal/teacher/insights/[id]">) {
  await requireTeacher();
  const { id } = await params;
  // Convex returns 403 unless this teacher teaches the pupil's class.
  const [profile, dir] = await Promise.all([query(api.insights.forStudent, { studentId: id }), getDirectory()]);
  const name = `${profile.student.firstName} ${profile.student.lastName}`;

  return (
    <>
      <PortalPageHeader
        eyebrow={dir.className(profile.student.classId)}
        title={name}
        description="Learning profile: results over time, subject strengths and focus areas, homework, quiz and topic mastery, attendance and reading."
        breadcrumb={[
          { label: "Class insights", href: `/portal/teacher/insights?class=${profile.student.classId}` },
          { label: name, href: `/portal/teacher/insights/${id}` },
        ]}
      />
      <LearningProfileView profile={profile} />
    </>
  );
}
