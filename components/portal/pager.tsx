import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Server-rendered pagination. Page state lives in the URL, so lists stay linkable. */
export function Pager({
  page,
  pageCount,
  total,
  pageSize,
  basePath,
  params = {},
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) {
    return (
      <p className="mt-5 text-sm text-muted-foreground">
        Showing all <span className="font-bold text-foreground">{total}</span> records
      </p>
    );
  }

  const href = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    search.set("page", String(target));
    return `${basePath}?${search.toString()}`;
  };

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  const windowStart = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, i) => windowStart + i).filter(
    (p) => p >= 1 && p <= pageCount,
  );

  return (
    <nav className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row" aria-label="Pagination">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-bold text-foreground">{first}–{last}</span> of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous page"
          disabled={page <= 1}
          render={page <= 1 ? undefined : <Link href={href(page - 1)} />}
        >
          <ChevronLeftIcon />
        </Button>
        {pages.map((target) => (
          <Button
            key={target}
            variant={target === page ? "default" : "outline"}
            size="icon"
            aria-current={target === page ? "page" : undefined}
            className={cn("font-bold", target === page && "pointer-events-none")}
            render={<Link href={href(target)} />}
          >
            {target}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          aria-label="Next page"
          disabled={page >= pageCount}
          render={page >= pageCount ? undefined : <Link href={href(page + 1)} />}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  );
}
