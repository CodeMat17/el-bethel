import type { Metadata } from "next";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAdmin } from "@/lib/school/auth";
import { paginate } from "@/lib/school/data";
import { formatDateTime } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";
import type { ToneName } from "@/lib/school/format";

export const metadata: Metadata = { title: "Enquiries" };

const STATUS_TONE: Record<string, ToneName> = {
  new: "gold",
  assigned: "info",
  in_progress: "warning",
  resolved: "success",
  archived: "neutral",
};

export default async function AdminEnquiriesPage({ searchParams }: PageProps<"/portal/admin/enquiries">) {
  await requireAdmin();
  const params = await searchParams;

  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const status = typeof params.status === "string" ? params.status : "all";
  const category = typeof params.category === "string" ? params.category : "all";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const db = getDb();
  const filtered = db.enquiries
    .filter((enquiry) => {
      if (status !== "all" && enquiry.status !== status) return false;
      if (category !== "all" && enquiry.category !== category) return false;
      if (!q) return true;
      return `${enquiry.name} ${enquiry.email} ${enquiry.message}`.toLowerCase().includes(q);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const result = paginate(filtered, page, 10);

  return (
    <>
      <PortalPageHeader
        title="Enquiries"
        description="Messages sent through the public contact form, ready to be assigned and answered."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total enquiries" value={db.enquiries.length} icon="Inbox" tone="info" />
        <StatCard
          label="New"
          value={db.enquiries.filter((e) => e.status === "new").length}
          icon="Mail"
          tone={db.enquiries.some((e) => e.status === "new") ? "warning" : "success"}
        />
        <StatCard label="In progress" value={db.enquiries.filter((e) => e.status === "in_progress").length} icon="Activity" tone="neutral" />
        <StatCard label="Resolved" value={db.enquiries.filter((e) => e.status === "resolved").length} icon="CircleCheck" tone="success" />
      </div>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by name, email or message"
          filters={[
            {
              key: "status",
              label: "Statuses",
              options: [
                { value: "new", label: "New" },
                { value: "assigned", label: "Assigned" },
                { value: "in_progress", label: "In progress" },
                { value: "resolved", label: "Resolved" },
                { value: "archived", label: "Archived" },
              ],
            },
            {
              key: "category",
              label: "Categories",
              options: [
                { value: "admissions", label: "Admissions" },
                { value: "fees", label: "Fees" },
                { value: "academics", label: "Academics" },
                { value: "transport", label: "Transport" },
                { value: "general", label: "General" },
              ],
            },
          ]}
        />
      </Card>

      {result.items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="Inbox"
          title="No enquiries match your filters"
          description="Try a different name, category or status."
        />
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {result.items.map((enquiry) => (
              <li key={enquiry.id}>
                <Card className="gap-0 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-heading text-base font-extrabold">{enquiry.name}</h2>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {enquiry.email} · {enquiry.phone}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary" className="font-bold capitalize">{enquiry.category}</Badge>
                      <StatusPill tone={STATUS_TONE[enquiry.status] ?? "neutral"}>
                        {enquiry.status.replace("_", " ")}
                      </StatusPill>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <p className="text-sm leading-relaxed">{enquiry.message}</p>

                  {enquiry.reply ? (
                    <p className="mt-4 rounded-xl bg-muted/70 p-3.5 text-sm leading-relaxed">
                      <span className="font-extrabold">Our reply · </span>
                      {enquiry.reply}
                    </p>
                  ) : null}

                  <p className="mt-4 text-xs text-muted-foreground">
                    Received {formatDateTime(enquiry.createdAt)}
                    {enquiry.assignedTo ? ` · assigned to ${enquiry.assignedTo}` : ""}
                  </p>
                </Card>
              </li>
            ))}
          </ul>

          <Pager
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={result.pageSize}
            basePath="/portal/admin/enquiries"
            params={{ q, status, category }}
          />
        </>
      )}
    </>
  );
}
