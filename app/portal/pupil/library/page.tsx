import type { Metadata } from "next";

import { EmptyState, StatCard } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { LoanList } from "@/components/portal/library-views";
import { PortalPageHeader } from "@/components/portal/page-header";
import { DigitalShelf, Holds, LogReadingDialog, ReadingDiary, ReadingStats, ReserveButton } from "@/components/portal/reading-views";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requirePupil } from "@/lib/school/auth";
import { api } from "@/convex/_generated/api";
import { query } from "@/lib/school/convex";
import { param } from "@/lib/school/data";

export const metadata: Metadata = { title: "My library" };

export default async function PupilLibraryPage({ searchParams }: PageProps<"/portal/pupil/library">) {
  const user = await requirePupil();
  if (!user.studentId) {
    return <EmptyState icon="Backpack" title="No pupil record" description="Please ask your class teacher." />;
  }
  const params = await searchParams;
  const q = param(params.q).trim().toLowerCase();
  const category = param(params.category, "all");

  // A pupil only ever sees their own borrowing record and diary (enforced in Convex).
  const [db, shelf] = await Promise.all([
    query(api.library.forStudent, { studentId: user.studentId }),
    query(api.reading.shelf, { studentId: user.studentId }),
  ]);
  const current = db.loans.filter((b) => b.status !== "returned");
  const returned = db.loans.filter((b) => b.status === "returned");
  const categories = Array.from(new Set(db.books.map((b) => b.category))).sort();
  const held = new Set(shelf.holds.map((h) => h.bookId as string));
  const shelfBooks = db.books
    .filter((b) => (category === "all" || b.category === category) && (!q || `${b.title} ${b.author}`.toLowerCase().includes(q)))
    .sort((a, b) => Number(b.copiesAvailable > 0) - Number(a.copiesAvailable > 0) || a.title.localeCompare(b.title));

  return (
    <>
      <PortalPageHeader
        title="My library"
        description="Books you have borrowed, e-books and read-alongs for your class, and your reading diary."
        action={
          <LogReadingDialog
            studentId={user.studentId}
            resources={shelf.resources.map((r) => ({ id: r.id, title: r.title }))}
            books={[...current, ...returned].flatMap((l) => {
              const b = db.books.find((x) => x.id === l.bookId);
              return b ? [{ id: b.id, title: b.title }] : [];
            })}
          />
        }
      />

      <ReadingStats stats={shelf.stats} pupil />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Books out now" value={current.length} icon="BookOpen" tone={current.length > 0 ? "info" : "neutral"} />
        <StatCard label="Books I have read" value={returned.length} icon="CircleCheck" tone="success" />
        <StatCard
          label="Overdue"
          value={current.filter((b) => b.status === "overdue").length}
          icon="CircleAlert"
          tone={current.some((b) => b.status === "overdue") ? "danger" : "success"}
        />
      </div>

      <Card className="mt-6 gap-0 p-5 sm:p-6">
        <h2 className="font-heading text-base font-extrabold">Digital shelf</h2>
        <p className="mt-1 text-xs text-muted-foreground">E-books, audiobooks and read-alongs picked for your class. Suggestions are based on what you like reading.</p>
        <Separator className="my-4" />
        <DigitalShelf shelf={shelf} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">My books</h2>
            <Separator className="my-4" />
            <LoanList loans={db.loans} books={db.books} emptyText="You haven't borrowed any books yet. Visit the library desk to borrow one." />
            {shelf.holds.length > 0 ? (
              <>
                <h3 className="mt-5 mb-2 text-sm font-extrabold">Reserved</h3>
                <Holds holds={shelf.holds} />
              </>
            ) : null}
          </Card>
          <Card className="gap-0 p-5 sm:p-6">
            <h2 className="font-heading text-base font-extrabold">My reading diary</h2>
            <Separator className="my-4" />
            <ReadingDiary logs={shelf.logs} viewerId={user.id} />
          </Card>
        </div>

        <Card className="gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">Find a book</h2>
          <div className="mt-4">
            <AdminFilters searchPlaceholder="Search by title or author" filters={[{ key: "category", label: "All kinds", options: categories.map((c) => ({ value: c, label: c })) }]} />
          </div>
          <Separator className="my-4" />
          {shelfBooks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No books match. Try another word.</p>
          ) : (
            <ul className="space-y-2.5">
              {shelfBooks.slice(0, 30).map((book) => (
                <li key={book.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{book.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {book.author} · {book.category} · ages {book.ageRange}
                    </p>
                  </div>
                  {book.copiesAvailable > 0 ? (
                    <span className="shrink-0 rounded-lg bg-success/12 px-2.5 py-1 text-xs font-bold text-success">{book.copiesAvailable} on the shelf</span>
                  ) : held.has(book.id) ? (
                    <span className="shrink-0 rounded-lg bg-info/12 px-2.5 py-1 text-xs font-bold text-info">Reserved</span>
                  ) : current.some((l) => l.bookId === book.id) ? (
                    <span className="shrink-0 rounded-lg bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">You have it</span>
                  ) : (
                    <ReserveButton bookId={book.id} studentId={user.studentId!} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
