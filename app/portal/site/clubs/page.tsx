import type { Metadata } from "next";
import { ClockIcon, TrashIcon } from "lucide-react";

import { EmptyState } from "@/components/common";
import { ClubDialog } from "@/components/cms/list-dialogs";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { removeClub } from "@/lib/school/actions/site";
import { requireSiteAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";

export const metadata: Metadata = { title: "Clubs" };

const CATEGORY_LABELS: Record<string, string> = {
  stem: "Science & technology",
  arts: "Arts",
  sports: "Sports",
  literary: "Reading & debate",
  service: "Service",
};

export default async function SiteClubsPage() {
  await requireSiteAdmin();
  const clubs = await query(api.siteLists.clubs, {});

  return (
    <>
      <PortalPageHeader
        title="Clubs"
        description="Clubs and activities shown on the homepage and the School life page. Changes go live as soon as you save."
        action={<ClubDialog />}
      />
      {clubs.length === 0 ? (
        <EmptyState icon="Puzzle" title="No clubs yet" description="Add the first club." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <li key={club.id}>
              <Card className="flex h-full flex-col gap-0 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-heading text-base font-extrabold">{club.name}</h2>
                  <Badge variant="secondary" className="shrink-0 font-bold">
                    {club.memberCount} members
                  </Badge>
                </div>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{CATEGORY_LABELS[club.category] ?? club.category}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{club.description}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <ClockIcon className="size-3.5" />
                  {club.meetingDay}s · {club.meetingTime}
                </p>
                <div className="mt-4 flex justify-end gap-1">
                  <ClubDialog club={club} />
                  <ConfirmAction
                    action={removeClub.bind(null, club.id)}
                    icon={<TrashIcon />}
                    variant="ghost"
                    className="font-bold text-destructive"
                    destructive
                    pendingText="Deleting…"
                    confirm={{ title: `Delete ${club.name}?`, description: "It disappears from the website.", confirmLabel: "Delete" }}
                  >
                    Delete
                  </ConfirmAction>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
