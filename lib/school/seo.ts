import type { Metadata } from "next";

import { SITE_URL } from "./config";
import { getSchool } from "./site-content";

/**
 * Search and link-preview metadata for the public site. Next.js replaces a parent's
 * `openGraph` and `twitter` objects wholesale when a page sets its own, so every page
 * builds both here — otherwise a shared link would show the home page's title or no image.
 */

/** Shown when a page has no photo of its own (1200 × 630, in /public/images). */
const DEFAULT_IMAGE = { url: "/images/opengraph-image.png", width: 1200, height: 630 };

type Media = { url: string; resourceType: "image" | "video" } | null | undefined;

/** A link-preview image: the page's own Cloudinary photo cropped to 1200 × 630, or the school's default. */
export function shareImage(media: Media, alt: string) {
  const marker = "/image/upload/";
  const at = media?.url.indexOf(marker) ?? -1;
  if (!media || media.resourceType !== "image" || !media.url.startsWith("https://res.cloudinary.com/") || at < 0) {
    return { ...DEFAULT_IMAGE, url: `${SITE_URL}${DEFAULT_IMAGE.url}`, alt };
  }
  // JPEG rather than f_auto: some link-preview crawlers (WhatsApp among them) cannot read AVIF.
  const rest = media.url.slice(at + marker.length).replace(/^f_auto,q_auto\//, "");
  const url = `${media.url.slice(0, at + marker.length)}c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/${rest}`;
  return { url, width: 1200, height: 630, alt };
}

export async function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  robots,
}: {
  title: string;
  description: string;
  path: string;
  image?: Media;
  type?: "website" | "article";
  robots?: Metadata["robots"];
}): Promise<Metadata> {
  const SCHOOL = await getSchool();
  const shareTitle = path === "/" ? `${SCHOOL.name} | ${title}` : `${title} | ${SCHOOL.name}`;
  const images = [shareImage(image, title)];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type, locale: "en_NG", siteName: SCHOOL.name, url: `${SITE_URL}${path}`, title: shareTitle, description, images },
    twitter: { card: "summary_large_image", title: shareTitle, description, images },
    ...(robots ? { robots } : {}),
  };
}

/** JSON-LD for a <script> tag; "<" is escaped so edited text can never close the tag. */
export const jsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");
