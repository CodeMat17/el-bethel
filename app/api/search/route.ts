import { NextResponse } from "next/server";

import { globalSearch } from "@/lib/school/site-data";
import { formatDate } from "@/lib/school/format";

/** Public site search. Only ever returns published, public content. */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (query.trim().length < 2) return NextResponse.json({ results: [] });

  const found = await globalSearch(query.slice(0, 80));
  const results = [
    ...found.news.map((n) => ({
      group: "News",
      label: n.title,
      sub: `${n.category} · ${formatDate(n.publishedAt)}`,
      href: `/news/${n.slug}`,
    })),
    ...found.events.map((e) => ({
      group: "Events",
      label: e.title,
      sub: `${formatDate(e.date)} · ${e.venue}`,
      href: `/school-life/events/${e.slug}`,
    })),
    ...found.staff.map((t) => ({
      group: "Staff",
      label: `${t.title} ${t.firstName} ${t.lastName}`,
      sub: t.position,
      href: "/about/team#teachers",
    })),
    ...found.faqs.map((f) => ({
      group: "Questions & Answers",
      label: f.question,
      sub: f.category,
      href: "/admissions#faqs",
    })),
    ...found.documents.map((d) => ({
      group: "Documents",
      label: d.title,
      sub: d.category,
      href: "/documents",
    })),
  ];

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
