import "server-only";

import { cache } from "react";

import { api } from "@/convex/_generated/api";
import { publicQuery } from "./convex";
import { getDirectory } from "./directory";

/** Public website data, read from Convex without any identity. Cached per request. */

const siteContent = cache(() => publicQuery(api.content.siteContent, {}));
const allEvents = cache(() => publicQuery(api.content.events, {}));

export const getPublishedNews = cache(() => publicQuery(api.content.publishedNews, {}));
export const getNewsBySlug = (slug: string) => publicQuery(api.content.newsBySlug, { slug });
export const getAllEvents = allEvents;
export const getUpcomingEvents = cache(async () => (await allEvents()).filter((e) => e.status === "upcoming"));
export const getEventBySlug = (slug: string) => publicQuery(api.content.eventBySlug, { slug });
export const getGallery = cache(() => publicQuery(api.content.gallery, {}));
export const getClubs = async () => (await siteContent()).clubs;
export const getAchievements = async () => (await siteContent()).achievements;
export const getTestimonials = async () => (await siteContent()).testimonials;
export const getFaqs = async () => (await siteContent()).faqs;
export const getPublicDocuments = async () => (await siteContent()).documents;
export const getActiveNotice = cache(() => publicQuery(api.content.activeNotice, {}));
export const getSubjects = async () => (await getDirectory()).subjects;
export const getTeachers = async () => (await getDirectory()).teachers.filter((t) => t.active);
export const getFeaturedTeachers = async () => (await getTeachers()).filter((t) => t.featured);
export const globalSearch = (q: string) => publicQuery(api.content.search, { q });
export const getPublicCatalogue = cache(() => publicQuery(api.content.publicCatalogue, {}));
export const verifyCertificate = (certificateNo: string) => publicQuery(api.awards.verify, { certificateNo });
export const getAlumniHub = cache(() => publicQuery(api.alumni.hub, {}));
export const getAlumniStory = (slug: string) => publicQuery(api.alumni.story, { slug });
export const getCampaign = (slug: string) => publicQuery(api.alumni.campaign, { slug });
export const getShopCatalogue = cache(() => publicQuery(api.store.catalogue, {}));
