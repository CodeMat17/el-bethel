import type { Metadata } from "next";
import { RefreshCwIcon, TrashIcon, Undo2Icon } from "lucide-react";

import { BookDialog, IssueBookDialog } from "@/components/admin/operations-dialogs";
import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { removeBook, renewLoan, returnBook } from "@/lib/school/actions/operations";
import { requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { pageParam, paginate, param } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "Library" };

const LOAN_TONE = { borrowed: "info", overdue: "danger", returned: "success" } as const;

export default async function AdminLibraryPage({ searchParams }: PageProps<"/portal/admin/library">) {
  await requireAdmin();
  const params = await searchParams;
  const q = param(params.q).trim().toLowerCase();
  const category = param(params.category, "all");
  const loanFilter = param(params.loans, "all");

  const [db, dir] = await Promise.all([query(api.library.adminOverview, {}), getDirectory()]);
  const classNames = Object.fromEntries(dir.classes.map((c) => [c.id, c.name]));
  const categories = Array.from(new Set(db.books.map((b) => b.category))).sort();
  const titles = new Map(db.books.map((b) => [b.id as string, b.title]));

  const books = db.books
    .filter((book) => {
      if (category !== "all" && book.category !== category) return false;
      return !q || `${book.title} ${book.author} ${book.isbn}`.toLowerCase().includes(q);
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  const current = db.loans.filter((l) => l.status !== "returned");
  const overdue = current.filter((l) => l.status === "overdue");
  const loans = db.loans.filter((l) => {
    if (loanFilter === "current" && l.status === "returned") return false;
    if (loanFilter === "overdue" && l.status !== "overdue") return false;
    if (loanFilter === "returned" && l.status !== "returned") return false;
    return !q || `${l.studentName} ${titles.get(l.bookId) ?? ""}`.toLowerCase().includes(q);
  });
  const paged = paginate(loans, pageParam(params.page), 20);

  return (
    <>
      <PortalPageHeader
        title="Library"
        description="Catalogue, loans, returns and borrowing history. Families are reminded automatically the day before a book is due and when it is overdue."
        action={
          <div className="flex flex-wrap gap-2">
            <IssueBookDialog books={db.books} classNames={classNames} />
            <BookDialog categories={categories} />
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Titles" value={db.books.length} icon="BookOpenCheck" tone="info" />
        <StatCard label="Copies" value={db.books.reduce((s, b) => s + b.copiesTotal, 0)} icon="Layers" tone="neutral" />
        <StatCard label="On loan" value={current.length} icon="BookOpen" tone="gold" />
        <StatCard label="Overdue" value={overdue.length} icon="CircleAlert" tone={overdue.length > 0 ? "danger" : "success"} />
      </div>

      <Card className="mb-6 gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search titles, authors, ISBN or pupils"
          filters={[
            { key: "category", label: "Categories", options: categories.map((c) => ({ value: c, label: c })) },
            {
              key: "loans",
              label: "Loans",
              options: [
                { value: "current", label: "On loan" },
                { value: "overdue", label: "Overdue" },
                { value: "returned", label: "Returned" },
              ],
            },
          ]}
        />
      </Card>

      <Tabs defaultValue="loans">
        <TabsList>
          <TabsTrigger value="loans" className="font-bold">Loans ({loans.length})</TabsTrigger>
          <TabsTrigger value="catalogue" className="font-bold">Catalogue ({books.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="mt-5">
          {paged.items.length === 0 ? (
            <EmptyState icon="BookOpen" title="No loans to show" description="Issue a book, or change the filters above." />
          ) : (
            <Card className="gap-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Pupil</TableHead>
                      <TableHead>Borrowed</TableHead>
                      <TableHead>Due back</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.items.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-bold">{titles.get(loan.bookId) ?? "—"}</TableCell>
                        <TableCell>
                          {loan.studentName}
                          <span className="block text-xs text-muted-foreground">{dir.className(loan.classId)}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(loan.borrowedAt)}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {loan.status === "returned" && loan.returnedAt ? `Returned ${formatDate(loan.returnedAt)}` : formatDate(loan.dueDate)}
                        </TableCell>
                        <TableCell>
                          <StatusPill tone={LOAN_TONE[loan.status]}>{loan.status}</StatusPill>
                        </TableCell>
                        <TableCell className="text-right">
                          {loan.status !== "returned" ? (
                            <div className="flex justify-end gap-1">
                              <ConfirmAction action={renewLoan.bind(null, loan.id)} icon={<RefreshCwIcon />} variant="ghost" pendingText="Renewing…">
                                Renew
                              </ConfirmAction>
                              <ConfirmAction action={returnBook.bind(null, loan.id)} icon={<Undo2Icon />} pendingText="Saving…">
                                Returned
                              </ConfirmAction>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
          <Pager
            page={paged.page}
            pageCount={paged.pageCount}
            total={paged.total}
            pageSize={paged.pageSize}
            basePath="/portal/admin/library"
            params={{ q: q || undefined, category: category === "all" ? undefined : category, loans: loanFilter === "all" ? undefined : loanFilter }}
          />
        </TabsContent>

        <TabsContent value="catalogue" className="mt-5">
          {books.length === 0 ? (
            <EmptyState icon="BookOpenCheck" title="No titles match your search" description="Try a different title, author or category." />
          ) : (
            <Card className="gap-0 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Ages</TableHead>
                      <TableHead className="text-right">Availability</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell className="font-bold">{book.title}</TableCell>
                        <TableCell className="text-muted-foreground">{book.author}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{book.isbn || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{book.category}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">{book.ageRange}</TableCell>
                        <TableCell className="text-right">
                          <StatusPill tone={book.copiesAvailable > 0 ? "success" : "warning"}>
                            {book.copiesAvailable} of {book.copiesTotal} in
                          </StatusPill>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <BookDialog book={book} categories={categories} />
                            <ConfirmAction
                              action={removeBook.bind(null, book.id)}
                              icon={<TrashIcon />}
                              variant="ghost"
                              className="font-bold text-destructive"
                              destructive
                              pendingText="Removing…"
                              confirm={{ title: `Remove "${book.title}"?`, description: "Only books that have never been borrowed can be removed.", confirmLabel: "Remove" }}
                            >
                              Remove
                            </ConfirmAction>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

    </>
  );
}
