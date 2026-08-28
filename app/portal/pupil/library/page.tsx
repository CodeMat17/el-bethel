import type { Metadata } from "next";
import { BookOpenIcon } from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requirePupil } from "@/lib/school/auth";
import { getStudent } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";
import { getDb } from "@/lib/school/store";
import { DEMO_TODAY } from "@/lib/school/seed";

export const metadata: Metadata = { title: "My library" };

export default async function PupilLibraryPage() {
  const user = await requirePupil();
  const student = user.studentId ? getStudent(user.studentId) : null;
  if (!student) {
    return <EmptyState icon="Backpack" title="No pupil record" description="Please ask your class teacher." />;
  }

  const db = getDb();
  // A pupil only ever sees their own borrowing record.
  const mine = db.borrowings
    .filter((b) => b.studentId === student.id)
    .sort((a, b) => b.borrowedAt.localeCompare(a.borrowedAt));
  const current = mine.filter((b) => b.status !== "returned");
  const returned = mine.filter((b) => b.status === "returned");
  const available = db.books.filter((b) => b.copiesAvailable > 0).slice(0, 8);

  return (
    <>
      <PortalPageHeader
        title="My library"
        description="Books you have borrowed, when they are due back, and what is on the shelves."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Books out now" value={current.length} icon="BookOpen" tone={current.length > 0 ? "info" : "neutral"} />
        <StatCard label="Books returned" value={returned.length} icon="CircleCheck" tone="success" />
        <StatCard
          label="Overdue"
          value={current.filter((b) => b.status === "overdue").length}
          icon="CircleAlert"
          tone={current.some((b) => b.status === "overdue") ? "danger" : "success"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Books I have out</h2>
          <Separator className="my-4" />
          {current.length === 0 ? (
            <div className="py-8 text-center">
              <BookOpenIcon className="mx-auto size-9 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                You do not have any books out. Visit the library desk to borrow one.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {current.map((borrowing) => {
                const book = db.books.find((b) => b.id === borrowing.bookId);
                const overdue = new Date(borrowing.dueDate) < DEMO_TODAY;
                return (
                  <li key={borrowing.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold">{book?.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{book?.author}</p>
                      </div>
                      <StatusPill tone={overdue ? "danger" : "info"}>
                        {overdue ? "Overdue" : "Due soon"}
                      </StatusPill>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Borrowed {formatDate(borrowing.borrowedAt)} · return by {formatDate(borrowing.dueDate)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">On the shelves now</h2>
          <Separator className="my-4" />
          <ul className="space-y-2.5">
            {available.map((book) => (
              <li key={book.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{book.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {book.author} · ages {book.ageRange}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-success/12 px-2.5 py-1 text-xs font-bold text-success">
                  {book.copiesAvailable} left
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {returned.length > 0 ? (
        <Card className="mt-6 gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Books I have read</h2>
          <Separator className="my-4" />
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {returned.map((borrowing) => {
              const book = db.books.find((b) => b.id === borrowing.bookId);
              return (
                <li key={borrowing.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{book?.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      returned {borrowing.returnedAt ? formatDate(borrowing.returnedAt) : "—"}
                    </p>
                  </div>
                  <StatusPill tone="success">Read</StatusPill>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
