import "server-only";

import { cache } from "react";

import { api } from "@/convex/_generated/api";
import { publicQuery } from "./convex";
import { getPublicDirectory } from "./directory";
import { SITE_TAGS, siteCache } from "./site-cache";

/**
 * Public website data, read from Convex without any identity. Each read is kept
 * in the cross-request cache under a tag, so pages stay static until the
 * dashboard changes that data; React `cache` dedupes within one render.
 */

const { news, events, gallery, lists, documents, notices, levels, alumni } = SITE_TAGS;

const siteContent = cache(siteCache(() => publicQuery(api.content.siteContent, {}), "siteContent", [lists, documents]));
const allEvents = cache(siteCache(() => publicQuery(api.content.events, {}), "events", [events]));

export const getPublishedNews = cache(siteCache(() => publicQuery(api.content.publishedNews, {}), "news", [news]));
export const getNewsBySlug = cache(
  siteCache((slug: string) => publicQuery(api.content.newsBySlug, { slug }), "newsBySlug", [news]),
);
export const getAllEvents = allEvents;
export const getUpcomingEvents = cache(async () => (await allEvents()).filter((e) => e.status === "upcoming"));
export const getEventBySlug = cache(
  siteCache((slug: string) => publicQuery(api.content.eventBySlug, { slug }), "eventBySlug", [events]),
);
export const getGallery = cache(siteCache(() => publicQuery(api.content.gallery, {}), "gallery", [gallery]));
export const getClubs = async () => (await siteContent()).clubs;
export const getAchievements = async () => (await siteContent()).achievements;
export const getTestimonials = async () => (await siteContent()).testimonials;
export const getFaqs = async () => (await siteContent()).faqs;
export const getPublicDocuments = async () => (await siteContent()).documents;
/** Notices that have not ended; the banner shows whichever is live in the visitor's browser. */
export const getActiveNotices = cache(siteCache(() => publicQuery(api.content.activeNotices, {}), "notices", [notices]));
export const getSubjects = async () => (await getPublicDirectory()).subjects;
export const getLevelSummary = cache(siteCache(() => publicQuery(api.academics.levelSummary, {}), "levels", [levels]));
export const getTeachers = async () => (await getPublicDirectory()).teachers.filter((t) => t.active);
export const getFeaturedTeachers = async () => (await getTeachers()).filter((t) => t.featured);
/** Search and certificate checks answer one visitor's input, so they are never cached. */
export const globalSearch = (q: string) => publicQuery(api.content.search, { q });
export const getPublicCatalogue = cache(siteCache(() => publicQuery(api.content.publicCatalogue, {}), "catalogue", [documents]));
export const verifyCertificate = (certificateNo: string) => publicQuery(api.awards.verify, { certificateNo });
/** The hub lists upcoming alumni events, so it also follows the events tag. */
export const getAlumniHub = cache(siteCache(() => publicQuery(api.alumni.hub, {}), "alumniHub", [alumni, events]));
export const getAlumniStory = cache(siteCache((slug: string) => publicQuery(api.alumni.story, { slug }), "alumniStory", [alumni]));
