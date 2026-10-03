import type { Metadata } from "next";

import { EmptyState } from "@/components/common";
import { LearningProfileView } from "@/components/portal/learning-profile";
import { PortalPageHeader } from "@/components/portal/page-header";
import { api } from "@/convex/_generated/api";
import { requirePupil } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";

export const metadata: Metadata = { title: "My progress" };

export default async function PupilProgressPage() {
  const user = await requirePupil();
  if (!user.studentId) return <EmptyState icon="Backpack" title="No pupil record" description="Please ask your class teacher." />;
  const profile = await query(api.insights.forStudent, { studentId: user.studentId });

  return (
    <>
      <PortalPageHeader
        title="My progress"
        description="How your learning is going: your marks, homework, quizzes and the topics to practise next."
      />
      <LearningProfileView profile={profile} audience="pupil" />
    </>
  );
}
