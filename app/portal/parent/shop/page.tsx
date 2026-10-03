import type { Metadata } from "next";
import { XIcon } from "lucide-react";

import { EmptyState, StatusPill } from "@/components/common";
import { ConfirmAction } from "@/components/portal/confirm-action";
import { PortalPageHeader } from "@/components/portal/page-header";
import { ShopFront } from "@/components/portal/shop";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { cancelOrder } from "@/lib/school/actions/premium";
import { requireParent } from "@/lib/school/auth";
import { SCHOOL } from "@/lib/school/config";
import { query } from "@/lib/school/convex";
import { ORDER_STATUS, formatDate, money } from "@/lib/school/format";

export const metadata: Metadata = { title: "School shop" };

export default async function ParentShopPage() {
  await requireParent();
  const [{ products, orders }, children] = await Promise.all([query(api.store.forParent, {}), query(api.store.myChildren, {})]);

  return (
    <>
      <PortalPageHeader
        title="School shop"
        description="Uniforms, sportswear, books and stationery. Order here, pay at the bursary or by transfer, and collect from the school office."
      />

      {orders.length > 0 ? (
        <Card className="mb-6 gap-0 p-5 sm:p-6">
          <h2 className="font-heading text-base font-extrabold">My orders</h2>
          <Separator className="my-4" />
          <ul className="space-y-3">
            {orders.map((o) => {
              const status = ORDER_STATUS[o.status];
              return (
                <li key={o.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-heading font-extrabold">{o.orderNo}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(o.placedAt)} · {children.find((c) => c.id === o.studentId)?.name ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      <span className="font-heading text-lg font-extrabold tabular-nums">{money(o.total)}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{o.items.map((i) => `${i.qty} × ${i.name}${i.size !== "One size" ? ` (${i.size})` : ""}`).join(", ")}</p>
                  {status.next ? <p className="mt-2 text-xs font-semibold">{status.next}</p> : null}
                  {o.status === "placed" ? (
                    <div className="mt-2 flex justify-end">
                      <ConfirmAction
                        action={cancelOrder.bind(null, o.id)}
                        variant="ghost"
                        icon={<XIcon />}
                        pendingText="Cancelling…"
                        confirm={{ title: `Cancel ${o.orderNo}?`, description: "The items go back on the shelf.", confirmLabel: "Cancel order" }}
                      >
                        Cancel order
                      </ConfirmAction>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Questions about an order? Call the school office on {SCHOOL.phone} ({SCHOOL.officeHours}).
          </p>
        </Card>
      ) : null}

      {products.length === 0 ? (
        <EmptyState icon="ShoppingBag" title="The shop is being stocked" description="Check back soon, or contact the school office." />
      ) : children.length === 0 ? (
        <EmptyState icon="Users" title="No children linked" description="Orders are placed for a child. Contact the school office to link your children." />
      ) : (
        <ShopFront products={products} pupils={children} />
      )}
    </>
  );
}
