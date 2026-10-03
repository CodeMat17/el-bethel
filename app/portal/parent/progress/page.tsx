import type { Metadata } from "next";

import { EmptyState } from "@/components/common";
import { ChildSwitcher } from "@/components/portal/child-switcher";
import { WeeklyInsights } from "@/components/portal/insight-cards";
import { LearningProfileView } from "@/components/portal/learning-profile";
import { PortalPageHeader } from "@/components/portal/page-header";
import { api } from "@/convex/_generated/api";
import { requireParent } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { studentName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { getMyChildren, resolveActiveChild } from "@/lib/school/parent";

export const metadata: Metadata = { title: "Progress & insights" };

export default async function ParentProgressPage({ searchParams }: PageProps<"/portal/parent/progress">) {
  await requireParent();
  const params = await searchParams;
  const [dir, myChildren, child] = await Promise.all([
    getDirectory(),
    getMyChildren(),
    resolveActiveChild(typeof params.child === "string" ? params.child : undefined),
  ]);
  if (!child) return <EmptyState icon="Users" title="No children linked" description="Contact the school office." />;

  // Convex checks this parent may see this child before returning anything.
  const [insights, profile] = await Promise.all([
    query(api.parentInsights.forChild, { studentId: child.id }),
    query(api.insights.forStudent, { studentId: child.id }),
  ]);

  return (
    <>
      <PortalPageHeader
        title="Progress & insights"
        description={`A summary of ${child.firstName}'s week, and how their learning is going over the term.`}
        action={
          <ChildSwitcher
            activeId={child.id}
            options={myChildren.map((c) => ({ id: c.id, name: studentName(c), className: dir.className(c.classId), avatarSeed: c.avatarSeed }))}
          />
        }
      />
      <div className="space-y-8">
        <section aria-labelledby="this-week">
          <h2 id="this-week" className="mb-3 font-heading text-lg font-extrabold">
            This week
          </h2>
          <WeeklyInsights insights={insights} firstName={child.firstName} />
        </section>
        <section aria-labelledby="this-term">
          <h2 id="this-term" className="mb-3 font-heading text-lg font-extrabold">
            Learning over time
          </h2>
          <LearningProfileView profile={profile} />
        </section>
      </div>
    </>
  );
}
