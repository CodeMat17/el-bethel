import type { Metadata } from "next";
import { LockIcon } from "lucide-react";

import { EmptyState, StatCard } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/school/auth";
import { paginate } from "@/lib/school/data";
import { formatDateTime } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";

export const metadata: Metadata = { title: "Audit logs" };

export default async function AdminAuditLogsPage({ searchParams }: PageProps<"/portal/admin/audit-logs">) {
  await requireAdmin();
  const params = await searchParams;

  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const entity = typeof params.entity === "string" ? params.entity : "all";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const db = getDb();
  const entities = Array.from(new Set(db.auditLogs.map((l) => l.entity))).sort();

  const filtered = db.auditLogs.filter((log) => {
    if (entity !== "all" && log.entity !== entity) return false;
    if (!q) return true;
    return `${log.action} ${log.actorName} ${log.entity} ${log.entityId}`.toLowerCase().includes(q);
  });

  const result = paginate(filtered, page, 15);
  const actors = new Set(db.auditLogs.map((l) => l.actorId)).size;

  return (
    <>
      <PortalPageHeader
        title="Audit logs"
        description="An append-only record of every administrative action taken on the platform."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Entries recorded" value={db.auditLogs.length} icon="ScrollText" tone="info" />
        <StatCard label="Distinct actors" value={actors} icon="UserCheck" tone="neutral" />
        <StatCard label="Entity types" value={entities.length} icon="Layers" tone="neutral" />
        <StatCard label="Matching filter" value={result.total} icon="Search" tone="gold" />
      </div>

      <Card className="mb-6 gap-0 border-info/30 bg-info/10 p-5">
        <p className="flex items-start gap-3 text-sm leading-relaxed">
          <LockIcon className="mt-0.5 size-5 shrink-0 text-info" />
          <span>
            Audit entries cannot be edited or deleted by an ordinary administrator. Each records the
            actor, the action, the entity, the value before and after, and the device it came from.
          </span>
        </p>
      </Card>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by action, actor or entity"
          filters={[
            { key: "entity", label: "Entities", options: entities.map((e) => ({ value: e, label: e })) },
          ]}
        />
      </Card>

      {result.items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="ScrollText"
          title="No audit entries match your filters"
          description="Try a different action, actor or entity type."
        />
      ) : (
        <>
          <ol className="mt-6 space-y-2.5">
            {result.items.map((log) => (
              <li key={log.id}>
                <Card className="gap-0 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold">{log.action}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {log.actorName} · {formatDateTime(log.at)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-bold">{log.entity}</Badge>
                  </div>

                  {log.previousValue || log.newValue ? (
                    <p className="mt-3 rounded-lg bg-muted/70 p-2.5 font-mono text-xs">
                      {log.previousValue ? (
                        <>
                          <span className="text-destructive">{log.previousValue}</span>
                          <span className="mx-2 text-muted-foreground">→</span>
                        </>
                      ) : null}
                      <span className="text-success">{log.newValue}</span>
                    </p>
                  ) : null}

                  <p className="mt-2 font-mono text-[0.68rem] text-muted-foreground">
                    {log.entityId} · {log.ip} · {log.device}
                  </p>
                </Card>
              </li>
            ))}
          </ol>

          <Pager
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={result.pageSize}
            basePath="/portal/admin/audit-logs"
            params={{ q, entity }}
          />
        </>
      )}
    </>
  );
}
