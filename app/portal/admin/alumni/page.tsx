import type { Metadata } from "next";
import { TrashIcon } from "lucide-react";

import { StoryDialog } from "@/components/admin/premium-dialogs";
import { EmptyState, StatusPill } from "@/components/common";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { api } from "@/convex/_generated/api";
import { removeAlumniStory } from "@/lib/school/actions/premium";
import { requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";

export const metadata: Metadata = { title: "Alumni" };

export default async function AdminAlumniPage() {
  await requireAdmin();
  const data = await query(api.alumni.adminOverview, {});

  return (
    <>
      <PortalPageHeader
        title="Alumni stories"
        description="Stories from former pupils shown on the public alumni page. Alumni events are ordinary events with the Alumni category."
        action={<StoryDialog />}
      />

      {data.stories.length === 0 ? (
        <EmptyState icon="BookHeart" title="No stories yet" description="Publish stories from former pupils, with their consent." />
      ) : (
        <ul className="space-y-2">
          {data.stories.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3.5 text-sm">
              <div className="min-w-0">
                <p className="font-bold">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {s.authorName} · class of {s.graduationYear}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusPill tone={s.status === "published" ? "success" : "neutral"}>{s.status}</StatusPill>
                <StoryDialog story={s} />
                <ConfirmAction
                  action={removeAlumniStory.bind(null, s.id)}
                  variant="ghost"
                  icon={<TrashIcon />}
                  className="font-bold text-destructive"
                  destructive
                  pendingText="Removing…"
                  confirm={{ title: `Remove "${s.title}"?`, description: "The story is deleted from the website.", confirmLabel: "Remove" }}
                >
                  <span className="sr-only">Remove</span>
                </ConfirmAction>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
