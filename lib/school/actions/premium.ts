"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { destroyAsset } from "@/lib/school/cloudinary";
import { convexErrorMessage, publicMutation, tryMutation } from "@/lib/school/convex";
import type { CloudMedia } from "@/lib/school/types";

/**
 * Actions for the premium modules: digital library,
 * parent insights, alumni and the school shop. Each forwards to Convex, which
 * checks who the caller is and what they may do.
 */

export interface PremiumResult {
  ok: boolean;
  message?: string;
  id?: string;
}

const str = (f: FormData, key: string) => String(f.get(key) ?? "").trim();
const opt = (f: FormData, key: string) => str(f, key) || undefined;
const bool = (f: FormData, key: string) => f.get(key) === "on" || f.get(key) === "true";

function done(message: string, ...paths: string[]): PremiumResult {
  for (const path of paths) revalidatePath(path);
  return { ok: true, message };
}

/* ----------------------------- digital library ---------------------------- */

export async function saveDigitalResource(formData: FormData, media?: CloudMedia): Promise<PremiumResult> {
  const minutes = Number(str(formData, "minutes"));
  const result = await tryMutation(api.reading.saveResource, {
    id: opt(formData, "id") as Id<"digitalResources"> | undefined,
    title: str(formData, "title"),
    author: str(formData, "author"),
    kind: (str(formData, "kind") || "ebook") as "ebook" | "audiobook" | "video" | "article",
    description: str(formData, "description"),
    category: str(formData, "category"),
    levelIds: formData.getAll("levelIds").map(String),
    url: opt(formData, "url"),
    media,
    minutes: Number.isFinite(minutes) && minutes > 0 ? minutes : undefined,
    published: bool(formData, "published"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data.previousMedia) await destroyAsset(result.data.previousMedia);
  return done("Saved to the digital library.", "/portal/admin/library/digital");
}

export async function removeDigitalResource(id: string): Promise<PremiumResult> {
  const result = await tryMutation(api.reading.removeResource, { id: id as Id<"digitalResources"> });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data.publicId) await destroyAsset(result.data.publicId);
  return done("Removed from the digital library.", "/portal/admin/library/digital");
}

export async function logReading(formData: FormData): Promise<PremiumResult> {
  const pick = str(formData, "pick");
  const [kind, pickedId] = pick.split(":");
  const result = await tryMutation(api.reading.logReading, {
    studentId: str(formData, "studentId") as Id<"students">,
    title: str(formData, "title"),
    resourceId: kind === "r" ? (pickedId as Id<"digitalResources">) : undefined,
    bookId: kind === "b" ? (pickedId as Id<"books">) : undefined,
    minutes: Number(str(formData, "minutes")),
    date: str(formData, "date"),
    finished: bool(formData, "finished"),
    note: opt(formData, "note"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Reading logged. Keep it up!", "/portal/pupil/library", "/portal/parent/library");
}

export async function removeReadingLog(id: string): Promise<PremiumResult> {
  const result = await tryMutation(api.reading.removeLog, { id: id as Id<"readingLogs"> });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Entry removed.", "/portal/pupil/library", "/portal/parent/library");
}

export async function reserveBook(bookId: string, studentId: string): Promise<PremiumResult> {
  const result = await tryMutation(api.reading.reserve, { bookId: bookId as Id<"books">, studentId: studentId as Id<"students"> });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Reserved. You'll get a notification when it's waiting at the desk.", "/portal/pupil/library", "/portal/parent/library");
}

export async function cancelReservation(id: string): Promise<PremiumResult> {
  const result = await tryMutation(api.reading.cancelReservation, { id: id as Id<"bookReservations"> });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Reservation cancelled.", "/portal/pupil/library", "/portal/parent/library");
}

export async function releaseHold(id: string): Promise<PremiumResult> {
  const result = await tryMutation(api.reading.releaseHold, { id: id as Id<"bookReservations"> });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Reservation released.", "/portal/admin/library/digital");
}

/** Count an opening and return the link to open. */
export async function openResource(id: string): Promise<PremiumResult & { url?: string }> {
  const result = await tryMutation(api.reading.open, { id: id as Id<"digitalResources"> });
  if (!result.ok) return { ok: false, message: result.message };
  return { ok: true, url: result.data };
}

/* ----------------------------- parent insights ---------------------------- */

export async function generateWeeklyInsights(): Promise<PremiumResult> {
  const result = await tryMutation(api.parentInsights.generateNow, {});
  if (!result.ok) return { ok: false, message: result.message };
  return done("Writing this week's summaries. Families are notified as each one is ready.", "/portal/admin/reports");
}

/* --------------------------------- alumni --------------------------------- */

export interface PublicFormState {
  ok: boolean;
  message?: string;
  reference?: string;
  amount?: number;
}

/** Public: register a former pupil. */
export async function registerAlumnus(_prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  try {
    await publicMutation(api.alumni.register, {
      firstName: str(formData, "firstName"),
      lastName: str(formData, "lastName"),
      email: str(formData, "email"),
      phone: opt(formData, "phone"),
      graduationYear: Number(str(formData, "graduationYear")),
      lastClass: str(formData, "lastClass"),
      currently: opt(formData, "currently"),
      city: opt(formData, "city"),
      registeredBy: str(formData, "registeredBy") === "parent" ? "parent" : "self",
      confirmsAdult: bool(formData, "confirmsAdult"),
      directoryOptIn: bool(formData, "directoryOptIn"),
    });
    return { ok: true, message: "Thank you! The alumni office will confirm the registration by email." };
  } catch (error) {
    return { ok: false, message: convexErrorMessage(error) };
  }
}

/** Public: pledge a gift to a campaign. */
export async function pledgeGift(_prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  try {
    const res = await publicMutation(api.alumni.pledge, {
      campaignId: str(formData, "campaignId") as Id<"givingCampaigns">,
      name: str(formData, "name"),
      email: str(formData, "email"),
      phone: opt(formData, "phone"),
      // A typed amount wins over the quick-pick buttons.
      amount: Number((str(formData, "amount") || str(formData, "preset")).replace(/[,\s₦]/g, "")),
      anonymous: bool(formData, "anonymous"),
      message: opt(formData, "message"),
    });
    return { ok: true, reference: res.reference, amount: res.amount };
  } catch (error) {
    return { ok: false, message: convexErrorMessage(error) };
  }
}

export async function decideAlumnus(id: string, status: "approved" | "declined"): Promise<PremiumResult> {
  const result = await tryMutation(api.alumni.decide, { id: id as Id<"alumni">, status });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/alumni");
  return done(status === "approved" ? "Registration approved." : "Registration declined.", "/portal/admin/alumni");
}

export async function saveAlumniStory(formData: FormData, cover?: CloudMedia): Promise<PremiumResult> {
  const result = await tryMutation(api.alumni.saveStory, {
    id: opt(formData, "id") as Id<"alumniStories"> | undefined,
    title: str(formData, "title"),
    authorName: str(formData, "authorName"),
    graduationYear: Number(str(formData, "graduationYear")),
    excerpt: str(formData, "excerpt"),
    body: str(formData, "body"),
    cover,
    published: bool(formData, "published"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data.previousCover) await destroyAsset(result.data.previousCover);
  revalidatePath("/alumni", "layout");
  return done("Story saved.", "/portal/admin/alumni");
}

export async function removeAlumniStory(id: string): Promise<PremiumResult> {
  const result = await tryMutation(api.alumni.removeStory, { id: id as Id<"alumniStories"> });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data.publicId) await destroyAsset(result.data.publicId);
  revalidatePath("/alumni", "layout");
  return done("Story removed.", "/portal/admin/alumni");
}

export async function saveCampaign(formData: FormData): Promise<PremiumResult> {
  const result = await tryMutation(api.alumni.saveCampaign, {
    id: opt(formData, "id") as Id<"givingCampaigns"> | undefined,
    title: str(formData, "title"),
    summary: str(formData, "summary"),
    description: str(formData, "description"),
    goal: Number(str(formData, "goal").replace(/[,\s₦]/g, "")),
    endsAt: opt(formData, "endsAt"),
    open: bool(formData, "open"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/alumni", "layout");
  return done("Campaign saved.", "/portal/admin/alumni");
}

export async function settlePledge(id: string, status: "received" | "cancelled"): Promise<PremiumResult> {
  const result = await tryMutation(api.alumni.settlePledge, { id: id as Id<"pledges">, status });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/alumni", "layout");
  return done(status === "received" ? "Gift confirmed. It now counts towards the goal." : "Pledge cancelled.", "/portal/admin/alumni");
}

/* ---------------------------------- shop ---------------------------------- */

export async function placeOrder(input: {
  studentId: string;
  items: { productId: string; size: string; qty: number }[];
  note?: string;
}): Promise<PremiumResult> {
  const result = await tryMutation(api.store.placeOrder, {
    studentId: input.studentId as Id<"students">,
    items: input.items.map((i) => ({ productId: i.productId as Id<"products">, size: i.size, qty: i.qty })),
    note: input.note,
  });
  if (!result.ok) return { ok: false, message: result.message };
  return { ...done(`Order ${result.data.orderNo} placed.`, "/portal/parent/shop", "/portal/admin/shop"), id: result.data.orderNo };
}

export async function cancelOrder(id: string): Promise<PremiumResult> {
  const result = await tryMutation(api.store.cancelOrder, { id: id as Id<"orders"> });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Order cancelled.", "/portal/parent/shop", "/portal/admin/shop");
}

/** Sizes are entered one per line: "Age 6: 12". */
function parseVariants(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const at = l.lastIndexOf(":");
      return at < 0 ? { size: l, stock: 0 } : { size: l.slice(0, at).trim(), stock: Number(l.slice(at + 1).trim()) };
    });
}

export async function saveProduct(formData: FormData, image?: CloudMedia): Promise<PremiumResult> {
  const result = await tryMutation(api.store.saveProduct, {
    id: opt(formData, "id") as Id<"products"> | undefined,
    name: str(formData, "name"),
    category: str(formData, "category"),
    description: str(formData, "description"),
    price: Number(str(formData, "price").replace(/[,\s₦]/g, "")),
    variants: parseVariants(str(formData, "variants")),
    image,
    active: bool(formData, "active"),
  });
  if (!result.ok) return { ok: false, message: result.message };
  if (result.data.previousImage) await destroyAsset(result.data.previousImage);
  return done("Product saved.", "/portal/admin/shop", "/shop", "/portal/parent/shop");
}

export async function markOrderPaid(formData: FormData): Promise<PremiumResult> {
  const result = await tryMutation(api.store.advanceOrder, { id: str(formData, "id") as Id<"orders">, to: "paid", reference: str(formData, "reference") });
  if (!result.ok) return { ok: false, message: result.message };
  return done("Payment recorded. The parent has been told.", "/portal/admin/shop");
}

export async function advanceOrder(id: string, to: "ready" | "collected"): Promise<PremiumResult> {
  const result = await tryMutation(api.store.advanceOrder, { id: id as Id<"orders">, to });
  if (!result.ok) return { ok: false, message: result.message };
  return done(to === "ready" ? "Marked ready. The parent has been told." : "Marked collected.", "/portal/admin/shop");
}
