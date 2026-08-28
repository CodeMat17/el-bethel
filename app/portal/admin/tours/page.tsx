import type { Metadata } from "next";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/school/auth";
import { CLASS_LEVELS } from "@/lib/school/config";
import { getLevel, paginate } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";
import type { ToneName } from "@/lib/school/format";

export const metadata: Metadata = { title: "Tour bookings" };

const STATUS_TONE: Record<string, ToneName> = {
  requested: "warning",
  confirmed: "success",
  completed: "neutral",
  cancelled: "danger",
};

const MODE_LABEL: Record<string, string> = {
  physical: "Physical tour",
  virtual: "Virtual tour",
  consultation: "Consultation",
};

export default async function AdminToursPage({ searchParams }: PageProps<"/portal/admin/tours">) {
  await requireAdmin();
  const params = await searchParams;

  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const status = typeof params.status === "string" ? params.status : "all";
  const mode = typeof params.mode === "string" ? params.mode : "all";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const db = getDb();
  const filtered = db.tourBookings
    .filter((booking) => {
      if (status !== "all" && booking.status !== status) return false;
      if (mode !== "all" && booking.mode !== mode) return false;
      if (!q) return true;
      return `${booking.parentName} ${booking.email} ${booking.reference}`.toLowerCase().includes(q);
    })
    .sort((a, b) => a.preferredDate.localeCompare(b.preferredDate));

  const result = paginate(filtered, page, 12);

  return (
    <>
      <PortalPageHeader
        title="Tour bookings"
        description="Prospective families who have asked to visit, virtually or in person."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bookings" value={db.tourBookings.length} icon="MapPin" tone="info" />
        <StatCard
          label="Awaiting confirmation"
          value={db.tourBookings.filter((b) => b.status === "requested").length}
          icon="Clock"
          tone="warning"
        />
        <StatCard label="Confirmed" value={db.tourBookings.filter((b) => b.status === "confirmed").length} icon="CircleCheck" tone="success" />
        <StatCard
          label="Visitors expected"
          value={db.tourBookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.visitors, 0)}
          icon="Users"
          tone="gold"
        />
      </div>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by name, email or reference"
          filters={[
            {
              key: "status",
              label: "Statuses",
              options: [
                { value: "requested", label: "Requested" },
                { value: "confirmed", label: "Confirmed" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ],
            },
            {
              key: "mode",
              label: "Visit types",
              options: Object.entries(MODE_LABEL).map(([value, label]) => ({ value, label })),
            },
          ]}
        />
      </Card>

      {result.items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="MapPin"
          title="No bookings match your filters"
          description="Try a different name, reference or visit type."
        />
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Family</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Visit</TableHead>
                  <TableHead>Preferred</TableHead>
                  <TableHead>Interested in</TableHead>
                  <TableHead className="text-right">Visitors</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs font-bold">{booking.reference}</TableCell>
                    <TableCell className="font-bold">{booking.parentName}</TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground">
                      {booking.email}
                      <span className="block text-xs">{booking.phone}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-bold">{MODE_LABEL[booking.mode]}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(booking.preferredDate)} · {booking.preferredTime}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getLevel(booking.intendedLevelId)?.name ?? CLASS_LEVELS[0].name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{booking.visitors}</TableCell>
                    <TableCell className="text-right">
                      <StatusPill tone={STATUS_TONE[booking.status] ?? "neutral"}>{booking.status}</StatusPill>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pager
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={result.pageSize}
            basePath="/portal/admin/tours"
            params={{ q, status, mode }}
          />
        </>
      )}
    </>
  );
}
