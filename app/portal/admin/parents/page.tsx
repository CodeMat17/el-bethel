import Link from "next/link";
import type { Metadata } from "next";

import { ParentDialog } from "@/components/admin/people-dialogs";
import { EmptyState, StatCard } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { pageParam, param } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { avatarTone, initials } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Parents" };

export default async function AdminParentsPage({ searchParams }: PageProps<"/portal/admin/parents">) {
  await requireAdmin();
  const params = await searchParams;
  const q = param(params.q);
  const page = pageParam(params.page);
  const [result, dir] = await Promise.all([query(api.people.listParents, { search: q, page, pageSize: 12 }), getDirectory()]);

  return (
    <>
      <PortalPageHeader
        title="Parents & guardians"
        description="Families linked to pupils. Open a parent to link children or create their sign-in."
        action={<ParentDialog />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Parents on record" value={result.counts.all} icon="Users" tone="info" />
        <StatCard label="Matching search" value={result.total} icon="Search" tone="gold" />
        <StatCard label="With a sign-in (this page)" value={result.items.filter((p) => p.account?.hasLogin).length} icon="KeyRound" tone="neutral" />
      </div>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters searchPlaceholder="Search by name, email or phone" filters={[]} />
      </Card>

      {result.items.length === 0 ? (
        <EmptyState className="mt-6" icon="Search" title="No parents match your search" description="Try a different name or phone number." />
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Children</TableHead>
                  <TableHead>Sign-in</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((parent) => (
                  <TableRow key={parent.id}>
                    <TableCell>
                      <Link href={`/portal/admin/parents/${parent.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar className="size-8 shrink-0">
                          {parent.photo ? <AvatarImage src={parent.photo.url} alt="" /> : null}
                          <AvatarFallback className={cn("text-[0.65rem] font-bold", avatarTone(parent.avatarSeed))}>
                            {initials(parent.firstName, parent.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          <span className="block font-bold">
                            {parent.title} {parent.firstName} {parent.lastName}
                          </span>
                          <span className="block text-xs text-muted-foreground">{parent.relationship}</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="block">{parent.phone}</span>
                      <span className="block max-w-56 truncate">{parent.email}</span>
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        {parent.children.map((c) => (
                          <Badge key={c.id} variant="secondary" className="font-bold">
                            {c.name} · {dir.className(c.classId)}
                          </Badge>
                        ))}
                      </span>
                    </TableCell>
                    <TableCell>
                      {parent.account?.hasLogin ? (
                        <span className="font-mono text-xs">@{parent.account.username}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="font-bold" render={<Link href={`/portal/admin/parents/${parent.id}`} />}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pager page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} basePath="/portal/admin/parents" params={{ q }} />
        </>
      )}
    </>
  );
}
