import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/school/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private, authenticated areas must never be indexed.
        disallow: ["/portal/", "/login", "/api/", "/admissions/status"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
