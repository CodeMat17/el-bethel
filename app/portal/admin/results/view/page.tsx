import type { Metadata } from "next";

import { ResultsWorkspace } from "@/components/portal/results-workspace";
import { requireAdmin } from "@/lib/school/auth";

export const metadata: Metadata = { title: "View results" };

/** Read-only results for administrators. Only teachers enter scores and publish. */
export default async function AdminResultsViewPage({ searchParams }: PageProps<"/portal/admin/results/view">) {
  const user = await requireAdmin();
  return <ResultsWorkspace user={user} mode="admin" searchParams={await searchParams} />;
}
