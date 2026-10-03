import type { Metadata } from "next";
import { PackageCheckIcon, PhoneIcon, TruckIcon, XIcon } from "lucide-react";

import { MarkPaidDialog, ProductDialog } from "@/components/admin/premium-dialogs";
import { EmptyState, StatCard, StatusPill } from "@/components/common";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { advanceOrder, cancelOrder } from "@/lib/school/actions/premium";
import { requireAdmin } from "@/lib/school/auth";
import { query } from "@/lib/school/convex";
import { ORDER_STATUS, SHOP_CATEGORY, formatDate, money } from "@/lib/school/format";

export const metadata: Metadata = { title: "School shop" };

export default async function AdminShopPage() {
  await requireAdmin();
  const { products, orders, totals } = await query(api.store.adminOverview, {});
  const open = orders.filter((o) => o.status === "placed" || o.status === "paid" || o.status === "ready");
  const closed = orders.filter((o) => o.status === "collected" || o.status === "cancelled").slice(0, 40);

  const OrderRow = ({ o }: { o: (typeof orders)[number] }) => {
    const status = ORDER_STATUS[o.status];
    return (
      <li className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-heading font-extrabold">{o.orderNo}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(o.placedAt)} · for {o.studentName} · {o.parent.name}
              {o.parent.phone ? (
                <a href={`tel:${o.parent.phone.replace(/\s/g, "")}`} className="ml-1.5 inline-flex items-center gap-0.5 font-bold text-primary dark:text-gold">
                  <PhoneIcon className="size-3" />
                  {o.parent.phone}
                </a>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            <span className="font-heading text-lg font-extrabold tabular-nums">{money(o.total)}</span>
          </div>
        </div>
        <p className="mt-2 text-sm">{o.items.map((i) => `${i.qty} × ${i.name}${i.size !== "One size" ? ` (${i.size})` : ""}`).join(", ")}</p>
        {o.note ? <p className="mt-1 text-xs text-muted-foreground">Note: {o.note}</p> : null}
        {o.paymentReference ? <p className="mt-1 text-xs text-muted-foreground">Payment ref: {o.paymentReference}</p> : null}
        {o.status !== "collected" && o.status !== "cancelled" ? (
          <div className="mt-3 flex flex-wrap justify-end gap-1.5">
            {o.status === "placed" ? <MarkPaidDialog orderId={o.id} orderNo={o.orderNo} total={money(o.total)} /> : null}
            {o.status === "paid" ? (
              <ConfirmAction action={advanceOrder.bind(null, o.id, "ready")} icon={<PackageCheckIcon />} variant="default" pendingText="Saving…">
                Ready to collect
              </ConfirmAction>
            ) : null}
            {o.status === "ready" || o.status === "paid" ? (
              <ConfirmAction action={advanceOrder.bind(null, o.id, "collected")} icon={<TruckIcon />} pendingText="Saving…">
                Collected
              </ConfirmAction>
            ) : null}
            <ConfirmAction
              action={cancelOrder.bind(null, o.id)}
              variant="ghost"
              icon={<XIcon />}
              className="font-bold text-destructive"
              destructive
              pendingText="Cancelling…"
              confirm={{
                title: `Cancel ${o.orderNo}?`,
                description: o.status === "placed" ? "Stock is returned and the parent is told." : "Stock is returned and the parent is told. Arrange their refund through the bursary.",
                confirmLabel: "Cancel order",
              }}
            >
              Cancel
            </ConfirmAction>
          </div>
        ) : null}
      </li>
    );
  };

  return (
    <>
      <PortalPageHeader
        title="School shop"
        description="Products, stock and orders. Parents order in the portal; the bursary confirms payment here and the office hands orders over."
        action={<ProductDialog />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Awaiting payment" value={totals.awaitingPayment} icon="Receipt" tone={totals.awaitingPayment ? "warning" : "neutral"} />
        <StatCard label="To prepare" value={totals.toPrepare} icon="ShoppingBag" tone={totals.toPrepare ? "info" : "neutral"} />
        <StatCard label="Ready to collect" value={totals.readyToCollect} icon="CircleCheck" tone="success" />
        <StatCard label="Paid sales" value={money(totals.revenue)} icon="Wallet" tone="gold" />
        <StatCard label="Low stock" value={totals.lowStock} hint="Products with a size at 3 or fewer" icon="CircleAlert" tone={totals.lowStock ? "warning" : "success"} />
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders" className="font-bold">
            Open orders ({open.length})
          </TabsTrigger>
          <TabsTrigger value="products" className="font-bold">
            Products ({products.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="font-bold">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          {open.length === 0 ? (
            <EmptyState icon="ShoppingBag" title="No open orders" description="New orders from parents appear here." />
          ) : (
            <ul className="space-y-3">
              {open.map((o) => (
                <OrderRow key={o.id} o={o} />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          {products.length === 0 ? (
            <EmptyState icon="ShoppingBag" title="No products yet" description="Add uniforms, kits and books to start selling." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {products.map((p) => (
                <Card key={p.id} className="gap-0 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-muted-foreground uppercase">{SHOP_CATEGORY[p.category]}</p>
                      <h2 className="font-heading text-base font-extrabold">{p.name}</h2>
                      <p className="font-bold">{money(p.price)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!p.active ? <StatusPill tone="neutral">Not on sale</StatusPill> : null}
                      <ProductDialog product={p} />
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <ul className="flex flex-wrap gap-1.5">
                    {p.variants.map((x) => (
                      <li key={x.size} className={`rounded-lg px-2 py-1 text-xs font-semibold ${x.stock === 0 ? "bg-destructive/10 text-destructive" : x.stock <= 3 ? "bg-warning/15 text-warning" : "bg-muted"}`}>
                        {x.size}: {x.stock}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {closed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No collected or cancelled orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {closed.map((o) => (
                <OrderRow key={o.id} o={o} />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
