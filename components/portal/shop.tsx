"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { FunctionReturnType } from "convex/server";
import { MinusIcon, PlusIcon, ShoppingBagIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { api } from "@/convex/_generated/api";
import { placeOrder } from "@/lib/school/actions/premium";
import { SHOP_CATEGORY, money } from "@/lib/school/format";
import { cn } from "@/lib/utils";

export type ShopProduct = FunctionReturnType<typeof api.store.catalogue>[number];

export function ProductImage({ product, className }: { product: Pick<ShopProduct, "image" | "name">; className?: string }) {
  return (
    <div className={cn("relative grid place-items-center overflow-hidden bg-muted", className)}>
      {product.image ? (
        <Image src={product.image.url} alt={product.name} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover" />
      ) : (
        <ShoppingBagIcon className="size-8 text-muted-foreground/60" aria-hidden />
      )}
    </div>
  );
}

interface Line {
  productId: string;
  name: string;
  size: string;
  qty: number;
  price: number;
}

/** Catalogue with a basket. The order is placed for one child; stock is checked again in Convex. */
export function ShopFront({ products, pupils }: { products: ShopProduct[]; pupils: { id: string; name: string }[] }) {
  const router = useRouter();
  const [category, setCategory] = React.useState<ShopProduct["category"] | "all">("all");
  const [sizes, setSizes] = React.useState<Record<string, string>>({});
  const [basket, setBasket] = React.useState<Line[]>([]);
  const [childId, setChildId] = React.useState(pupils[0]?.id ?? "");
  const [note, setNote] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const shown = products.filter((p) => category === "all" || p.category === category);
  const total = basket.reduce((n, l) => n + l.qty * l.price, 0);

  function add(p: ShopProduct) {
    const size = sizes[p.id] ?? p.sizes.find((s) => s.inStock)?.size;
    if (!size) return;
    setBasket((b) => {
      const at = b.findIndex((l) => l.productId === p.id && l.size === size);
      if (at >= 0) return b.map((l, i) => (i === at ? { ...l, qty: Math.min(10, l.qty + 1) } : l));
      return [...b, { productId: p.id, name: p.name, size, qty: 1, price: p.price }];
    });
    toast.success(`${p.name} added`, { description: size === "One size" ? undefined : `Size ${size}` });
  }

  function checkout() {
    if (!childId) return toast.error("Choose which child the order is for.");
    startTransition(async () => {
      const res = await placeOrder({ studentId: childId, items: basket.map((l) => ({ productId: l.productId, size: l.size, qty: l.qty })), note: note.trim() || undefined });
      if (!res.ok) {
        toast.error("Order not placed", { description: res.message });
        return;
      }
      toast.success(res.message ?? "Order placed", { description: "Pay at the bursary or by transfer, quoting the order number." });
      setBasket([]);
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div>
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Category">
          {(["all", ...Object.keys(SHOP_CATEGORY)] as const).map((c) => (
            <Button key={c} size="sm" variant={category === c ? "default" : "outline"} className="font-bold" onClick={() => setCategory(c as typeof category)}>
              {c === "all" ? "Everything" : SHOP_CATEGORY[c]}
            </Button>
          ))}
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => {
            const anyStock = p.sizes.some((s) => s.inStock);
            const chosen = sizes[p.id] ?? p.sizes.find((s) => s.inStock)?.size;
            return (
              <li key={p.id}>
                <Card className="h-full gap-0 overflow-hidden p-0">
                  <ProductImage product={p} className="aspect-4/3" />
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase">{SHOP_CATEGORY[p.category]}</p>
                    <h3 className="mt-0.5 text-sm font-bold">{p.name}</h3>
                    <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted-foreground">{p.description}</p>
                    <p className="mt-2 font-heading text-lg font-extrabold">{money(p.price)}</p>
                    {p.sizes.length > 1 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Size for ${p.name}`}>
                        {p.sizes.map((s) => (
                          <button
                            key={s.size}
                            type="button"
                            role="radio"
                            aria-checked={chosen === s.size}
                            disabled={!s.inStock}
                            onClick={() => setSizes((m) => ({ ...m, [p.id]: s.size }))}
                            className={cn(
                              "rounded-lg border px-2 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-50",
                              chosen === s.size && "border-primary bg-primary text-primary-foreground",
                            )}
                          >
                            {s.size}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <Button size="sm" className="mt-3 font-bold" disabled={!anyStock} onClick={() => add(p)}>
                      <PlusIcon />
                      {anyStock ? "Add to basket" : "Out of stock"}
                    </Button>
                    {chosen && p.sizes.find((s) => s.size === chosen)?.low ? <p className="mt-1 text-center text-xs text-warning">Only a few left</p> : null}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="gap-0 p-5">
          <h2 className="flex items-center gap-2 font-heading text-base font-extrabold">
            <ShoppingBagIcon className="size-4" />
            Basket
          </h2>
          <Separator className="my-4" />
          {basket.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your basket is empty.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {basket.map((l, i) => (
                  <li key={`${l.productId}-${l.size}`} className="text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block font-semibold">{l.name}</span>
                        {l.size !== "One size" ? <span className="text-xs text-muted-foreground">{l.size}</span> : null}
                      </span>
                      <span className="font-bold tabular-nums">{money(l.qty * l.price)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <Button size="icon-sm" variant="outline" aria-label="One fewer" onClick={() => setBasket((b) => b.map((x, j) => (j === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))}>
                        <MinusIcon />
                      </Button>
                      <span className="w-6 text-center font-bold tabular-nums">{l.qty}</span>
                      <Button size="icon-sm" variant="outline" aria-label="One more" onClick={() => setBasket((b) => b.map((x, j) => (j === i ? { ...x, qty: Math.min(10, x.qty + 1) } : x)))}>
                        <PlusIcon />
                      </Button>
                      <Button size="icon-sm" variant="ghost" className="ml-auto" aria-label="Remove" onClick={() => setBasket((b) => b.filter((_, j) => j !== i))}>
                        <TrashIcon />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <Separator className="my-4" />
              <p className="flex justify-between font-heading text-lg font-extrabold">
                <span>Total</span>
                <span className="tabular-nums">{money(total)}</span>
              </p>
              <label className="mt-4 block text-sm font-bold">
                For
                <select value={childId} onChange={(e) => setChildId(e.target.value)} className="mt-1 h-10 w-full rounded-lg border bg-background px-2 text-sm font-semibold">
                  {pupils.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the office (optional)" maxLength={300} rows={2} className="mt-3" />
              <Button size="lg" className="mt-4 h-11 w-full font-bold" disabled={pending || pupils.length === 0} onClick={checkout}>
                {pending ? <Spinner /> : null}
                {pending ? "Placing order…" : "Place order"}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Items are held for you. Pay at the bursary or by transfer quoting your order number; we&apos;ll tell you when it&apos;s ready to collect.
              </p>
            </>
          )}
        </Card>
      </aside>
    </div>
  );
}
