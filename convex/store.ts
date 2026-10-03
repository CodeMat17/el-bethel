import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { assertStudentAccess, fail, isAdmin, parentStudentIds, requireAdmin, requireRole, requireViewer } from "./lib/access";
import { audit, notify, nowISO, slugify, withId } from "./lib/util";
import { cloudMedia } from "./validators";

/**
 * The school shop: uniforms, sportswear, books and stationery. Parents order
 * for a child in the portal; stock is held when the order is placed. Payment
 * is made at the bursary or by transfer, quoting the order number, and the
 * bursar marks it paid — nothing is marked paid from the browser. The child
 * collects from the school office (or it goes home in their bag).
 */

const CATEGORIES = ["uniform", "sportswear", "books", "stationery", "accessories"] as const;
type Category = (typeof CATEGORIES)[number];
const MAX_QTY = 10;

const publicProduct = (p: Doc<"products">) => ({
  id: p._id,
  slug: p.slug,
  name: p.name,
  category: p.category,
  description: p.description,
  price: p.price,
  image: p.image,
  photoSeed: p.photoSeed,
  sizes: p.variants.map((x) => ({ size: x.size, inStock: x.stock > 0, low: x.stock > 0 && x.stock <= 3 })),
});

/** Public catalogue: prices and whether each size is in stock (not exact stock). */
export const catalogue = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").withIndex("by_active", (q) => q.eq("active", true)).collect();
    return products.map(publicProduct).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  },
});

/** Catalogue plus the signed-in parent's orders. */
export const forParent = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, "parent");
    if (!viewer.parentId) return { products: [], orders: [] };
    const products = await ctx.db.query("products").withIndex("by_active", (q) => q.eq("active", true)).collect();
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_parent", (q) => q.eq("parentId", viewer.parentId!))
      .order("desc")
      .take(50);
    return { products: products.map(publicProduct), orders: orders.map(withId) };
  },
});

async function nextOrderNo(ctx: MutationCtx) {
  const year = new Date().getUTCFullYear();
  const count = (await ctx.db.query("orders").collect()).length + 1;
  let no = `ORD-${year}-${String(count).padStart(5, "0")}`;
  while (await ctx.db.query("orders").withIndex("by_order_no", (q) => q.eq("orderNo", no)).first()) no = `${no}A`;
  return no;
}

export const placeOrder = mutation({
  args: {
    studentId: v.id("students"),
    items: v.array(v.object({ productId: v.id("products"), size: v.string(), qty: v.number() })),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { studentId, items, note }) => {
    const viewer = await requireRole(ctx, "parent");
    if (!viewer.parentId) fail("FORBIDDEN", "Your account isn't linked to a parent record.");
    await assertStudentAccess(ctx, viewer, studentId);
    const student = await ctx.db.get(studentId);
    if (!student || student.status !== "active") fail("NOT_FOUND", "Choose one of your children.");
    if (items.length === 0) fail("INVALID", "Your basket is empty.");
    if (items.length > 20) fail("INVALID", "Please split very large orders.");

    // Merge repeated lines, then check and hold stock for each.
    const merged = new Map<string, { productId: Id<"products">; size: string; qty: number }>();
    for (const i of items) {
      if (!Number.isInteger(i.qty) || i.qty < 1 || i.qty > MAX_QTY) fail("INVALID", `Quantities must be between 1 and ${MAX_QTY}.`);
      const key = `${i.productId}::${i.size}`;
      const e = merged.get(key) ?? { ...i, qty: 0 };
      e.qty += i.qty;
      merged.set(key, e);
    }
    const lines: Doc<"orders">["items"] = [];
    const holds = new Map<Id<"products">, Doc<"products">["variants"]>();
    for (const i of merged.values()) {
      const p = await ctx.db.get(i.productId);
      if (!p || !p.active) fail("NOT_FOUND", "An item in your basket is no longer sold.");
      const variants = holds.get(p._id) ?? p.variants.map((x) => ({ ...x }));
      const variant = variants.find((x) => x.size === i.size);
      if (!variant) fail("INVALID", `Choose a size for ${p.name}.`);
      if (variant.stock < i.qty) fail("CONFLICT", variant.stock === 0 ? `${p.name} (${i.size}) is out of stock.` : `Only ${variant.stock} of ${p.name} (${i.size}) left.`);
      variant.stock -= i.qty;
      holds.set(p._id, variants);
      lines.push({ productId: p._id, name: p.name, size: i.size, qty: i.qty, unitPrice: p.price });
    }
    for (const [productId, variants] of holds) await ctx.db.patch(productId, { variants });

    const total = lines.reduce((n, l) => n + l.qty * l.unitPrice, 0);
    const orderNo = await nextOrderNo(ctx);
    const id = await ctx.db.insert("orders", {
      orderNo,
      parentId: viewer.parentId,
      studentId,
      items: lines,
      total,
      status: "placed",
      note: note?.trim().slice(0, 300) || undefined,
      placedAt: nowISO(),
    });
    await notify(ctx, viewer._id, {
      type: "store_order",
      title: `Order ${orderNo} placed`,
      body: `₦${total.toLocaleString("en-NG")} for ${student.firstName}. Pay at the bursary or by transfer quoting ${orderNo}; we'll tell you when it's ready to collect.`,
      href: "/portal/parent/shop",
    });
    await audit(ctx, viewer, { action: "Placed shop order", entity: "Shop", entityId: id, newValue: `${orderNo} ₦${total}` });
    return { id, orderNo, total };
  },
});

async function restock(ctx: MutationCtx, order: Doc<"orders">) {
  for (const line of order.items) {
    const p = await ctx.db.get(line.productId);
    if (!p) continue;
    await ctx.db.patch(p._id, { variants: p.variants.map((x) => (x.size === line.size ? { ...x, stock: x.stock + line.qty } : x)) });
  }
}

/** Parents may cancel until they've paid; the office may cancel any order not yet handed over. */
export const cancelOrder = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, { id }) => {
    const viewer = await requireViewer(ctx);
    const order = await ctx.db.get(id);
    if (!order) fail("NOT_FOUND", "Order not found.");
    const admin = isAdmin(viewer);
    if (!admin && order.parentId !== viewer.parentId) fail("FORBIDDEN", "That isn't your order.");
    if (order.status === "cancelled") return;
    if (!admin && order.status !== "placed") fail("CONFLICT", "This order has been paid. Please contact the school office to change it.");
    if (order.status === "collected") fail("CONFLICT", "This order has already been collected.");
    await restock(ctx, order);
    await ctx.db.patch(id, { status: "cancelled", cancelledAt: nowISO() });
    await audit(ctx, viewer, { action: "Cancelled shop order", entity: "Shop", entityId: id, previousValue: order.status, newValue: order.orderNo });
    if (admin) {
      const parentUser = await ctx.db.query("users").withIndex("by_parent", (q) => q.eq("parentId", order.parentId)).first();
      if (parentUser) {
        await notify(ctx, parentUser._id, {
          type: "store_order",
          title: `Order ${order.orderNo} was cancelled`,
          body: order.status === "placed" ? "The school office cancelled this order." : "The school office cancelled this order and will arrange your refund.",
          href: "/portal/parent/shop",
        });
      }
    }
  },
});

/* ---------------------------------- admin --------------------------------- */

export const adminOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [products, orders] = await Promise.all([ctx.db.query("products").collect(), ctx.db.query("orders").collect()]);
    const names = new Map<string, string>();
    const parents = new Map<string, { name: string; phone: string }>();
    for (const o of orders) {
      if (!names.has(o.studentId)) {
        const s = await ctx.db.get(o.studentId);
        names.set(o.studentId, s ? `${s.firstName} ${s.lastName}` : "—");
      }
      if (!parents.has(o.parentId)) {
        const p = await ctx.db.get(o.parentId);
        parents.set(o.parentId, { name: p ? `${p.title} ${p.firstName} ${p.lastName}` : "—", phone: p?.phone ?? "" });
      }
    }
    const live = orders.filter((o) => o.status !== "cancelled");
    return {
      products: products.map(withId).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
      orders: orders
        .map((o) => ({ ...withId(o), studentName: names.get(o.studentId) ?? "—", parent: parents.get(o.parentId) ?? { name: "—", phone: "" } }))
        .sort((a, b) => b.placedAt.localeCompare(a.placedAt)),
      totals: {
        awaitingPayment: live.filter((o) => o.status === "placed").length,
        toPrepare: live.filter((o) => o.status === "paid").length,
        readyToCollect: live.filter((o) => o.status === "ready").length,
        revenue: live.filter((o) => o.status !== "placed").reduce((n, o) => n + o.total, 0),
        lowStock: products.filter((p) => p.active && p.variants.some((x) => x.stock <= 3)).length,
      },
    };
  },
});

export const saveProduct = mutation({
  args: {
    id: v.optional(v.id("products")),
    name: v.string(),
    category: v.string(),
    description: v.string(),
    price: v.number(),
    variants: v.array(v.object({ size: v.string(), stock: v.number() })),
    image: v.optional(cloudMedia),
    active: v.boolean(),
  },
  handler: async (ctx, { id, ...a }) => {
    const viewer = await requireAdmin(ctx);
    if (!CATEGORIES.includes(a.category as Category)) fail("INVALID", "Choose a category.");
    const variants = a.variants.map((x) => ({ size: x.size.trim().slice(0, 30), stock: x.stock }));
    if (variants.length === 0) fail("INVALID", 'Add at least one size, or "One size".');
    const seen = new Set<string>();
    for (const x of variants) {
      if (!x.size) fail("INVALID", "Every size needs a name.");
      if (seen.has(x.size.toLowerCase())) fail("INVALID", `Size "${x.size}" is listed twice.`);
      seen.add(x.size.toLowerCase());
      if (!Number.isInteger(x.stock) || x.stock < 0 || x.stock > 10_000) fail("INVALID", `Stock for "${x.size}" must be a whole number.`);
    }
    const fields = {
      name: a.name.trim().slice(0, 100),
      category: a.category as Category,
      description: a.description.trim().slice(0, 600),
      price: Math.round(a.price),
      variants,
      image: a.image,
      active: a.active,
      updatedAt: nowISO(),
    };
    if (fields.name.length < 2) fail("INVALID", "Enter the product name.");
    if (!Number.isFinite(fields.price) || fields.price < 50 || fields.price > 5_000_000) fail("INVALID", "Enter a price in naira.");
    if (id) {
      const before = await ctx.db.get(id);
      if (!before) fail("NOT_FOUND", "Product not found.");
      await ctx.db.patch(id, fields);
      await audit(ctx, viewer, { action: "Updated product", entity: "Shop", entityId: id, newValue: `${fields.name} ₦${fields.price}` });
      return { id, previousImage: before.image?.publicId !== fields.image?.publicId ? before.image?.publicId : undefined };
    }
    let slug = slugify(fields.name) || "item";
    while (await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", slug)).first()) slug = `${slug}-${Math.floor(Math.random() * 900 + 100)}`;
    const newId = await ctx.db.insert("products", { ...fields, slug });
    await audit(ctx, viewer, { action: "Added product", entity: "Shop", entityId: newId, newValue: fields.name });
    return { id: newId, previousImage: undefined };
  },
});

/** Move an order on: paid (with the bursary reference) → ready to collect → collected. */
export const advanceOrder = mutation({
  args: { id: v.id("orders"), to: v.union(v.literal("paid"), v.literal("ready"), v.literal("collected")), reference: v.optional(v.string()) },
  handler: async (ctx, { id, to, reference }) => {
    const viewer = await requireAdmin(ctx);
    const order = await ctx.db.get(id);
    if (!order) fail("NOT_FOUND", "Order not found.");
    const from: Record<typeof to, Doc<"orders">["status"][]> = { paid: ["placed"], ready: ["paid"], collected: ["ready", "paid"] };
    if (!from[to].includes(order.status)) fail("CONFLICT", `This order is ${order.status}; it can't be marked ${to}.`);
    const at = nowISO();
    if (to === "paid") {
      const ref = reference?.trim().slice(0, 60);
      if (!ref) fail("INVALID", "Enter the receipt or transfer reference.");
      await ctx.db.patch(id, { status: "paid", paidAt: at, paymentReference: ref });
    } else if (to === "ready") await ctx.db.patch(id, { status: "ready", readyAt: at });
    else await ctx.db.patch(id, { status: "collected", collectedAt: at });
    await audit(ctx, viewer, { action: `Marked order ${to}`, entity: "Shop", entityId: id, previousValue: order.status, newValue: order.orderNo });

    const parentUser = await ctx.db.query("users").withIndex("by_parent", (q) => q.eq("parentId", order.parentId)).first();
    const student = await ctx.db.get(order.studentId);
    if (parentUser && to !== "collected") {
      await notify(ctx, parentUser._id, {
        type: "store_order",
        title: to === "paid" ? `Payment received for ${order.orderNo}` : `${order.orderNo} is ready`,
        body:
          to === "paid"
            ? `₦${order.total.toLocaleString("en-NG")} received. We're preparing the order.`
            : `${student?.firstName ?? "Your child"}'s order is ready to collect from the school office.`,
        href: "/portal/parent/shop",
      });
    }
  },
});

/** For the parent page's child picker. */
export const myChildren = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireRole(ctx, "parent");
    if (!viewer.parentId) return [];
    const out = [];
    for (const id of await parentStudentIds(ctx, viewer.parentId)) {
      const s = await ctx.db.get(id);
      if (s?.status === "active") out.push({ id: s._id, name: `${s.firstName} ${s.lastName}` });
    }
    return out;
  },
});
