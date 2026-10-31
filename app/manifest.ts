import type { MetadataRoute } from "next";

import { getSchool } from "@/lib/school/site-content";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const SCHOOL = await getSchool();
  return {
    name: `${SCHOOL.name} — Digital School`,
    short_name: SCHOOL.shortName,
    description:
      "The El-Bethel International Academy digital school platform: admissions, parent, pupil, teacher and administration portals.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf8f4",
    theme_color: "#232a3a",
    lang: "en-NG",
    categories: ["education"],
    icons: [
      { src: "/logo.webp", sizes: "984x872", type: "image/webp", purpose: "any" },
    ],
    shortcuts: [
      { name: "Portal", url: "/portal" },
      { name: "Apply for Admission", url: "/admissions/apply" },
    ],
  };
}
