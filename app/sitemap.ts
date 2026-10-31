import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/school/config";
import { getAlumniHub, getAllEvents, getPublishedNews } from "@/lib/school/site-data";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/about", priority: 0.9, changeFrequency: "monthly" },
  { path: "/about/team", priority: 0.7, changeFrequency: "monthly" },
  { path: "/academics", priority: 0.9, changeFrequency: "monthly" },
  { path: "/admissions", priority: 1, changeFrequency: "weekly" },
  { path: "/admissions/apply", priority: 0.9, changeFrequency: "monthly" },
  { path: "/school-life", priority: 0.8, changeFrequency: "weekly" },
  { path: "/school-life/events", priority: 0.8, changeFrequency: "weekly" },
  { path: "/school-life/gallery", priority: 0.6, changeFrequency: "weekly" },
  { path: "/alumni", priority: 0.5, changeFrequency: "weekly" },
  { path: "/news", priority: 0.9, changeFrequency: "daily" },
  { path: "/calendar", priority: 0.7, changeFrequency: "monthly" },
  { path: "/documents", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.8, changeFrequency: "monthly" },
  { path: "/verify", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${SITE_URL}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...(await getPublishedNews()).map((post) => ({
      url: `${SITE_URL}/news/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...(await getAllEvents()).map((event) => ({
      url: `${SITE_URL}/school-life/events/${event.slug}`,
      lastModified: new Date(event.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...(await getAlumniHub()).stories.map((story) => ({
      url: `${SITE_URL}/alumni/stories/${story.slug}`,
      ...(story.publishedAt ? { lastModified: new Date(story.publishedAt) } : {}),
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
  ];
}
