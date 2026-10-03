import type { Metadata } from "next";
import { CheckIcon, TrashIcon, XIcon } from "lucide-react";

import { CampaignDialog, StoryDialog } from "@/components/admin/premium-dialogs";
import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { decideAlumnus, removeAlumniStory, settlePledge } from "@/lib/school/actions/premium";
import { requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { formatDate, money } from "@/lib/school/format";

export const metadata: Metadata = { title: "Alumni" };

const STATUS_TONE = { pending: "warning", approved: "success", declined: "neutral" } as const;

export default async function AdminAlumniPage() {
  await requireAdmin();
  const data = await query(api.alumni.adminOverview, {});
  const pending = data.alumni.filter((a) => a.status === "pending").length;
  const pledged = data.pledges.filter((p) => p.status === "pledged");

  return (
    <>
      <PortalPageHeader
        title="Alumni"
        description="Registrations, the public directory, alumni stories and giving. Alumni events are ordinary events with the Alumni category."
        action={<StoryDialog />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registered alumni" value={data.alumni.filter((a) => a.status === "approved").length} icon="HandHeart" tone="info" />
        <StatCard label="Awaiting approval" value={pending} icon="UserPlus" tone={pending ? "warning" : "success"} />
        <StatCard label="Gifts received" value={money(data.campaigns.reduce((n, c) => n + c.raised, 0))} icon="Gift" tone="gold" />
        <StatCard label="Pledges to confirm" value={pledged.length} icon="Receipt" tone={pledged.length ? "warning" : "neutral"} />
      </div>

      <Tabs defaultValue="people">
        <TabsList className="h-auto w-full overflow-x-auto sm:w-fit">
          <TabsTrigger value="people" className="font-bold">Registrations</TabsTrigger>
          <TabsTrigger value="giving" className="font-bold">Giving</TabsTrigger>
          <TabsTrigger value="stories" className="font-bold">Stories</TabsTrigger>
        </TabsList>

        <TabsContent value="people" className="mt-4">
          {data.alumni.length === 0 ? (
            <EmptyState icon="HandHeart" title="No registrations yet" description="Former pupils register on the public alumni page." />
          ) : (
            <ul className="space-y-2">
              {data.alumni.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-bold">
                      {a.firstName} {a.lastName} <span className="font-normal text-muted-foreground">· left {a.lastClass}, {a.graduationYear}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.email}
                      {a.phone ? ` · ${a.phone}` : ""} · {a.registeredBy === "parent" ? "registered by a parent" : "self-registered"}
                      {a.directoryOptIn ? " · in directory" : ""} · {formatDate(a.createdAt)}
                    </p>
                    {a.currently ? <p className="text-xs">{a.currently}{a.city ? `, ${a.city}` : ""}</p> : null}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusPill tone={STATUS_TONE[a.status]}>{a.status}</StatusPill>
                    {a.status !== "approved" ? (
                      <ConfirmAction action={decideAlumnus.bind(null, a.id, "approved")} icon={<CheckIcon />} pendingText="Saving…">
                        Approve
                      </ConfirmAction>
                    ) : null}
                    {a.status !== "declined" ? (
                      <ConfirmAction action={decideAlumnus.bind(null, a.id, "declined")} variant="ghost" icon={<XIcon />} pendingText="Saving…">
                        Decline
                      </ConfirmAction>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="giving" className="mt-4 space-y-6">
          <div className="flex justify-end">
            <CampaignDialog />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {data.campaigns.map((c) => (
              <Card key={c.id} className="gap-0 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-heading text-base font-extrabold">{c.title}</h2>
                  <div className="flex items-center gap-1.5">
                    <StatusPill tone={c.status === "open" ? "success" : "neutral"}>{c.status}</StatusPill>
                    <CampaignDialog campaign={c} />
                  </div>
                </div>
                <Progress value={Math.min(100, (c.raised / c.goal) * 100)} className="mt-4 h-2.5" />
                <p className="mt-2 text-sm">
                  {money(c.raised)} of {money(c.goal)} · {c.supporters} supporters
                </p>
              </Card>
            ))}
          </div>
          <Card className="gap-0 p-5">
            <h2 className="font-heading text-base font-extrabold">Pledges</h2>
            <p className="mt-1 text-xs text-muted-foreground">Confirm a pledge only once the money is in the school account.</p>
            {data.pledges.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No pledges yet.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {data.pledges.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-bold">
                        {money(p.amount)} · <span className="font-mono">{p.reference}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.name} ({p.email}) · {p.campaign} · {formatDate(p.createdAt)}
                        {p.anonymous ? " · anonymous" : ""}
                      </p>
                    </div>
                    {p.status === "pledged" ? (
                      <div className="flex gap-1.5">
                        <ConfirmAction
                          action={settlePledge.bind(null, p.id, "received")}
                          icon={<CheckIcon />}
                          variant="default"
                          pendingText="Saving…"
                          confirm={{ title: `Confirm ${money(p.amount)} received?`, description: `Only confirm once the bursary has received payment quoting ${p.reference}.`, confirmLabel: "Confirm" }}
                        >
                          Received
                        </ConfirmAction>
                        <ConfirmAction action={settlePledge.bind(null, p.id, "cancelled")} variant="ghost" icon={<XIcon />} pendingText="Saving…">
                          Cancel
                        </ConfirmAction>
                      </div>
                    ) : (
                      <StatusPill tone={p.status === "received" ? "success" : "neutral"}>{p.status}</StatusPill>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="stories" className="mt-4">
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
        </TabsContent>
      </Tabs>
    </>
  );
}
