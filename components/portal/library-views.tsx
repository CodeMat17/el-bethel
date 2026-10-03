import { BookOpenIcon } from "lucide-react";

import { StatusPill } from "@/components/common";
import { formatDate } from "@/lib/school/format";
import type { Book, Borrowing } from "@/lib/school/types";

const TONE = { borrowed: "info", overdue: "danger", returned: "success" } as const;

/** A pupil's loans: current ones first, then their reading history. */
export function LoanList({ loans, books, emptyText }: { loans: Borrowing[]; books: Book[]; emptyText: string }) {
  if (loans.length === 0) {
    return (
      <div className="py-8 text-center">
        <BookOpenIcon className="mx-auto size-9 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }
  const titles = new Map(books.map((b) => [b.id, b]));
  const ordered = [...loans].sort((a, b) => Number(a.status === "returned") - Number(b.status === "returned") || b.borrowedAt.localeCompare(a.borrowedAt));
  return (
    <ul className="space-y-2.5">
      {ordered.map((loan) => {
        const book = titles.get(loan.bookId);
        return (
          <li key={loan.id} className="flex items-start justify-between gap-3 rounded-xl border bg-card p-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{book?.title ?? "A library book"}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {loan.status === "returned"
                  ? `Returned ${loan.returnedAt ? formatDate(loan.returnedAt) : ""}`
                  : `Borrowed ${formatDate(loan.borrowedAt)} · back by ${formatDate(loan.dueDate)}`}
              </p>
            </div>
            <StatusPill tone={TONE[loan.status]}>{loan.status === "returned" ? "Read" : loan.status === "overdue" ? "Overdue" : "Borrowed"}</StatusPill>
          </li>
        );
      })}
    </ul>
  );
}
