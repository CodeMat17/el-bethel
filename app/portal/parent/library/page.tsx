import type { Metadata } from "next";

import { EmptyState } from "@/components/common";
import { LoanList } from "@/components/portal/library-views";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Holds, LogReadingDialog, ReadingDiary, ReadingStats } from "@/components/portal/reading-views";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { requireParent } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { studentName } from "@/lib/school/data";
import { getDirectory } from "@/lib/school/directory";

export const metadata: Metadata = { title: "Library" };

export default async function ParentLibraryPage() {
  const user = await requireParent();
  // Only this parent's own children (enforced in Convex).
  const [{ books, children }, dir] = await Promise.all([query(api.library.forParent, {}), getDirectory()]);
  const shelves = await Promise.all(children.map((c) => query(api.reading.shelf, { studentId: c.id })));

  return (
    <>
      <PortalPageHeader
        title="Library"
        description="What each child has borrowed and reserved, their reading diary and termly goal. Reading at home counts too — add it to the diary."
      />
      {children.length === 0 ? (
        <EmptyState icon="BookOpen" title="No children linked" description="Contact the school office to link your children to your account." />
      ) : (
        <div className="space-y-8">
          {children.map((child, i) => {
            const shelf = shelves[i];
            const out = child.loans.filter((l) => l.status !== "returned");
            const read = child.loans.length - out.length;
            return (
              <section key={child.id} aria-label={studentName(child)} className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-extrabold">{studentName(child)}</h2>
                    <p className="text-xs text-muted-foreground">
                      {dir.className(child.classId)} · {out.length} out · {read} read
                    </p>
                  </div>
                  <LogReadingDialog
                    studentId={child.id}
                    label={`Log ${child.firstName}'s reading`}
                    resources={shelf.resources.map((r) => ({ id: r.id, title: r.title }))}
                    books={child.loans.flatMap((l) => {
                      const b = books.find((x) => x.id === l.bookId);
                      return b ? [{ id: b.id, title: b.title }] : [];
                    })}
                  />
                </div>
                <ReadingStats stats={shelf.stats} />
                <div className="grid gap-5 lg:grid-cols-2">
                  <Card className="gap-0 p-5 sm:p-6">
                    <h3 className="font-heading text-base font-extrabold">Borrowed &amp; reserved</h3>
                    <Separator className="my-4" />
                    <LoanList loans={child.loans} books={books} emptyText="No books borrowed yet." />
                    {shelf.holds.length > 0 ? (
                      <div className="mt-4">
                        <Holds holds={shelf.holds} />
                      </div>
                    ) : null}
                  </Card>
                  <Card className="gap-0 p-5 sm:p-6">
                    <h3 className="font-heading text-base font-extrabold">Reading diary</h3>
                    <Separator className="my-4" />
                    <ReadingDiary logs={shelf.logs} viewerId={user.id} />
                  </Card>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
