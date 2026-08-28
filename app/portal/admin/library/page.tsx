import type { Metadata } from "next";
import { PlusIcon } from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/school/auth";
import { classDisplayName, getStudent, studentName } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";

export const metadata: Metadata = { title: "Library" };

export default async function AdminLibraryPage({ searchParams }: PageProps<"/portal/admin/library">) {
  await requireAdmin();
  const params = await searchParams;

  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const category = typeof params.category === "string" ? params.category : "all";

  const db = getDb();
  const categories = Array.from(new Set(db.books.map((b) => b.category))).sort();

  const books = db.books.filter((book) => {
    if (category !== "all" && book.category !== category) return false;
    if (!q) return true;
    return `${book.title} ${book.author} ${book.isbn}`.toLowerCase().includes(q);
  });

  const onLoan = db.borrowings.filter((b) => b.status !== "returned");
  const overdue = db.borrowings.filter((b) => b.status === "overdue");

  return (
    <>
      <PortalPageHeader
        title="Library"
        description="Catalogue, availability and current loans."
        action={
          <Button size="lg" className="font-bold" disabled>
            <PlusIcon />
            Add title
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Titles" value={db.books.length} icon="BookOpenCheck" tone="info" />
        <StatCard label="Copies" value={db.books.reduce((s, b) => s + b.copiesTotal, 0)} icon="Layers" tone="neutral" />
        <StatCard label="On loan" value={onLoan.length} icon="BookOpen" tone="gold" />
        <StatCard label="Overdue" value={overdue.length} icon="CircleAlert" tone={overdue.length > 0 ? "danger" : "success"} />
      </div>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by title, author or ISBN"
          filters={[
            { key: "category", label: "Categories", options: categories.map((c) => ({ value: c, label: c })) },
          ]}
        />
      </Card>

      {books.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="BookOpenCheck"
          title="No titles match your search"
          description="Try a different title, author or category."
        />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Ages</TableHead>
                <TableHead className="text-right">Copies</TableHead>
                <TableHead className="text-right">Availability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-bold">{book.title}</TableCell>
                  <TableCell className="text-muted-foreground">{book.author}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{book.isbn}</TableCell>
                  <TableCell className="text-muted-foreground">{book.category}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{book.ageRange}</TableCell>
                  <TableCell className="text-right tabular-nums">{book.copiesTotal}</TableCell>
                  <TableCell className="text-right">
                    <StatusPill tone={book.copiesAvailable > 0 ? "success" : "warning"}>
                      {book.copiesAvailable > 0 ? `${book.copiesAvailable} available` : "All on loan"}
                    </StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Card className="mt-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Current loans</h2>
        <Separator className="my-5" />
        {onLoan.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No books are currently on loan.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Pupil</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Borrowed</TableHead>
                  <TableHead>Due back</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onLoan.slice(0, 20).map((loan) => {
                  const book = db.books.find((b) => b.id === loan.bookId);
                  const student = getStudent(loan.studentId);
                  return (
                    <TableRow key={loan.id}>
                      <TableCell className="font-bold">{book?.title ?? "—"}</TableCell>
                      <TableCell>{student ? studentName(student) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {student ? classDisplayName(student.classId) : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(loan.borrowedAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(loan.dueDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusPill tone={loan.status === "overdue" ? "danger" : "info"}>
                          {loan.status}
                        </StatusPill>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </>
  );
}
