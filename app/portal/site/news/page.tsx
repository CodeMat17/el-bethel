import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLinkIcon, TrashIcon } from "lucide-react";

import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { AdminFilters } from "@/components/portal/admin-filters";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Pager } from "@/components/portal/pager";
import { NewsDialog } from "@/components/admin/content-dialogs";
import { ToneImage } from "@/components/motion";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireSiteAdmin } from "@/lib/school/auth";
import { api } from "@/convex/_generated/api";
import { removeNews } from "@/lib/school/actions/admin";
import { query } from "@/lib/school/convex";
import { paginate } from "@/lib/school/data";
import { formatDate } from "@/lib/school/format";

export const metadata: Metadata = { title: "News" };

export default async function SiteNewsPage({ searchParams }: PageProps<"/portal/site/news">) {
  await requireSiteAdmin();
  const params = await searchParams;

  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const category = typeof params.category === "string" ? params.category : "all";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const db = { news: await query(api.content.adminNews, {}) };
  const categories = Array.from(new Set(db.news.map((n) => n.category))).sort();

  const filtered = db.news
    .filter((post) => {
      if (category !== "all" && post.category !== category) return false;
      if (!q) return true;
      return `${post.title} ${post.excerpt} ${post.authorName}`.toLowerCase().includes(q);
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const result = paginate(filtered, page, 10);

  return (
    <>
      <PortalPageHeader
        title="News & announcements"
        description="Everything published to the public website, with author, category and publication date."
        action={<NewsDialog categories={categories.length ? categories : ["School News"]} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Posts" value={db.news.length} icon="Newspaper" tone="info" />
        <StatCard label="Published" value={db.news.filter((n) => n.status === "published").length} icon="CircleCheck" tone="success" />
        <StatCard label="Featured" value={db.news.filter((n) => n.featured).length} icon="Star" tone="gold" />
        <StatCard label="Categories" value={categories.length} icon="Layers" tone="neutral" />
      </div>

      <Card className="gap-0 p-4 sm:p-5">
        <AdminFilters
          searchPlaceholder="Search by title, excerpt or author"
          filters={[
            { key: "category", label: "Categories", options: categories.map((c) => ({ value: c, label: c })) },
          ]}
        />
      </Card>

      {result.items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="Newspaper"
          title="No posts match your filters"
          description="Try a different title, author or category."
        />
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {result.items.map((post) => (
              <li key={post.id}>
                <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <ToneImage
                    tone={post.tone}
                    seed={post.slug}
                    media={post.cover}
                    label={post.title}
                    className="h-24 w-full shrink-0 rounded-xl sm:h-20 sm:w-32"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-bold">{post.category}</Badge>
                      {post.featured ? <StatusPill tone="gold">Featured</StatusPill> : null}
                      <StatusPill tone={post.status === "published" ? "success" : "neutral"}>
                        {post.status}
                      </StatusPill>
                    </div>
                    <h2 className="mt-2 font-heading text-base font-extrabold">{post.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {post.authorName} · {formatDate(post.publishedAt)} · /news/{post.slug}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1 sm:flex-col">
                    <NewsDialog post={post} categories={categories} />
                    {post.status === "published" ? (
                      <Button variant="ghost" size="sm" className="font-bold" render={<Link href={`/news/${post.slug}`} />}>
                        <ExternalLinkIcon />
                        View
                      </Button>
                    ) : null}
                    <ConfirmAction
                      action={removeNews.bind(null, post.id)}
                      icon={<TrashIcon />}
                      variant="ghost"
                      className="font-bold text-destructive"
                      pendingText="Deleting…"
                      destructive
                      confirm={{ title: "Delete this post?", description: "It will be removed from the website. This can't be undone.", confirmLabel: "Delete" }}
                    >
                      Delete
                    </ConfirmAction>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <Pager
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={result.pageSize}
            basePath="/portal/site/news"
            params={{ q, category }}
          />
        </>
      )}

    </>
  );
}
