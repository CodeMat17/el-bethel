/**
 * Photography for the public site, served from Cloudinary.
 *
 * Keys are the `seed` values already passed to `<ToneImage />`. The maps below record
 * where each photo originally came from (Pexels, free to use, or /public/images);
 * `node scripts/upload-photos.mjs` copies them to Cloudinary under the public id from
 * `photoPublicId`, and the site only ever loads the Cloudinary copy. To swap in new
 * photography, change the source here and run the script again — no page edits.
 */

export const CLOUDINARY_CLOUD_NAME = "obuovfvi";

/** Delivery URL for an uploaded image; next/image handles the final resizing. */
const cloudinaryUrl = (publicId: string) =>
  `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${publicId}`;

/** Pexels CDN URL for a photo id (the original source of a stock photo). */
const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

/**
 * Intrinsic pixel size of each file under /public/images. Recorded here so the
 * school's own photography can be laid out at its natural aspect ratio instead of
 * being cropped into a fixed-ratio box.
 */
const LOCAL_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "/images/kid-1.jpg": { width: 524, height: 993 },
  "/images/kid-2.jpg": { width: 528, height: 989 },
  "/images/kid-3.jpg": { width: 520, height: 985 },
  "/images/school-1.jpg": { width: 500, height: 667 },
  "/images/school-2.jpg": { width: 500, height: 667 },
  "/images/school-3.jpg": { width: 500, height: 667 },
  "/images/the-kids-1.png": { width: 500, height: 332 },
  "/images/head-teacher.webp": { width: 405, height: 424 },
};

/** seed -> original photo. Seeds come from page literals, slugs, ids and titles. */
export const PHOTO_SOURCES: Record<string, string> = {
  // Home page
  "hero-a": "/images/kid-1.jpg",
  "hero-b": "/images/kid-2.jpg",
  "hero-c": "/images/kid-3.jpg",
  "hero-d": "/images/school-1.jpg",
  intro: "/images/the-kids-1.png",
  headteacher: "/images/school-2.jpg",

  // About
  "about-story": "/images/school-3.jpg",
  "headteacher-portrait": "/images/head-teacher.webp",

  // Academics
  approach: px(14554003),
  curriculum: px(34211750),
  "primary-stage": px(28646079),
  "Lower Primary": px(35610368),
  "Upper Primary": px(34162713),

  // Admissions / contact
  "why-el-bethel": px(31773583),
  "map-jabi": px(16237804),

  // Facilities
  "smart-classrooms": px(31773582),
  "ict-innovation-lab": px(30879378),
  "science-laboratory": px(8471913),
  "school-library": px(10638216),
  "creative-arts-studio": px(33997126),
  "football-pitch": px(27021683),

  // Sports houses
  Emerald: px(29264493),
  Sapphire: px(10044869),
  Ruby: px(2898317),
  Amber: px(31827757),

  // News
  "welcome-back-2026-2027": px(19982406),
  "robotics-club-regional-finals": px(7868890),
  "reading-challenge-2026": px(26855714),
  "new-science-laboratory-opens": px(8471886),
  "inter-house-sports-preparations": px(35135977),
  "parents-welcome-meeting-recap": px(33488298),
  "safeguarding-refresher-training": px(8423069),
  "french-club-cultural-morning": px(30050943),
  "digital-report-cards-launch": px(10638075),
  "art-exhibition-preview": px(37713592),
  "nutrition-and-lunch-menu": px(8466918),

  // News (auto-generated titles in seed.ts)
  "primary-3-visits-the-national-children-s-library": px(10638219),
  "chess-club-launches-a-lunchtime-ladder": px(8465434),
  "handwriting-champions-announced": px(30058879),
  "our-gardening-club-harvests-its-first-crop": px(16850733),
  "mathematics-week-puzzles-across-the-school": px(249360),
  "primary-1-pupils-celebrate-colour-day": px(27915845),
  "debate-club-wins-the-inter-school-friendly": px(18506744),
  "new-books-added-to-the-school-library": px(10638225),

  // Events
  "resumption-day": px(11153566),
  "parents-welcome-meeting": px(5905488),
  "inter-house-sports": px(29264495),
  "cultural-day": px(13098709),
  "first-term-open-day": px(35745572),
  "first-term-examinations": px(37456293),
  "pta-general-meeting": px(33488298),
  "science-and-innovation-fair": px(8471933),
  "excursion-to-national-museum": px(22616346),
  "christmas-carol-service": px(7567337),
  "mid-term-break": px(11167049),
  "end-of-term-closing": px(24033151),

  // Gallery (ids follow GALLERY_TITLES order in seed.ts)
  "gal-1": px(11153566),
  "gal-2": px(28638748),
  "gal-3": px(35135977),
  "gal-4": px(7868824),
  "gal-5": px(30050943),
  "gal-6": px(30575961),
  "gal-7": px(16850898),
  "gal-8": px(4393383),
  "gal-9": px(12471794),
  "gal-10": px(22427851),
  "gal-11": px(10638230),
  "gal-12": px(7868885),
  "gal-13": px(28808455),
  "gal-14": px(27915845),
  "gal-15": px(8471839),
  "gal-16": px(7568516),
  "gal-17": px(20333031),
  "gal-18": px(31864438),
  "gal-19": px(29607136),
  "gal-20": px(12891262),
  "gal-21": px(8466771),
  "gal-22": px(10638065),
  "gal-23": px(8465436),
  "gal-24": px(5801306),
  "gal-25": px(16850895),
  "gal-26": px(30441569),
  "gal-27": px(20706908),
  "gal-28": px(29264386),
  "gal-29": px(29264495),
  "gal-30": px(8471835),
  "gal-31": px(7577331),
  "gal-32": px(36467885),
};

/** Staff portraits. Names in the demo data are generated, so a seed picks one by hash. */
export const PORTRAIT_SOURCES = [
  px(5905743), px(5905744), px(5905746), px(5905753), px(5905757),
  px(13565831), px(8423062), px(8423069), px(8423388), px(14441568),
  px(6209566), px(8617935), px(8617936), px(6683448), px(8617766),
  px(5306461),
];

/** Cloudinary public id for a photo seed ("Lower Primary" -> "elbethel/site/lower-primary"). */
export function photoPublicId(seed: string): string {
  return `elbethel/site/${seed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

/** Cloudinary public id for the nth staff portrait. */
export const portraitPublicId = (index: number) => `elbethel/people/portrait-${index + 1}`;

/** Intrinsic size of the school's own photography, keyed by its Cloudinary URL. */
const DIMENSIONS = new Map(
  Object.entries(PHOTO_SOURCES)
    .filter(([, source]) => LOCAL_DIMENSIONS[source])
    .map(([seed, source]) => [cloudinaryUrl(photoPublicId(seed)), LOCAL_DIMENSIONS[source]]),
);

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Photo for a seed, or `undefined` when there is none — callers fall back to the
 * generated gradient, so an unmapped seed is never a broken image.
 */
export function photoFor(seed: string | undefined, kind?: "portrait"): string | undefined {
  if (!seed) return undefined;
  if (kind === "portrait") return cloudinaryUrl(portraitPublicId(hash(seed) % PORTRAIT_SOURCES.length));
  return seed in PHOTO_SOURCES ? cloudinaryUrl(photoPublicId(seed)) : undefined;
}

/** Intrinsic size for the school's own photography, or `undefined` for the stock library. */
export function dimensionsFor(photo: string | undefined) {
  return photo ? DIMENSIONS.get(photo) : undefined;
}
