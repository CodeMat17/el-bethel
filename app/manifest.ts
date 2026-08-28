import type { MetadataRoute } from "next";

import { SCHOOL } from "@/lib/school/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SCHOOL.name} — Digital School`,
    short_name: SCHOOL.shortName,
    description:
      "The Crestwood Heights Academy digital school platform: admissions, parent, pupil, teacher and administration portals.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf8f4",
    theme_color: "#232a3a",
    lang: "en-NG",
    categories: ["education"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Parent Portal", url: "/portal/parent" },
      { name: "Pupil Portal", url: "/portal/pupil" },
      { name: "Apply for Admission", url: "/admissions/apply" },
    ],
  };
}
