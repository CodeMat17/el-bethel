import Link from "next/link";
import type { Metadata } from "next";

import { PageHero, SectionHeading } from "@/components/common";
import { ProductImage } from "@/components/portal/shop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SCHOOL } from "@/lib/school/config";
import { SHOP_CATEGORY, money } from "@/lib/school/format";
import { getShopCatalogue } from "@/lib/school/site-data";

export const metadata: Metadata = {
  title: "School Shop",
  description: "Uniforms, sportswear, books and stationery from El-Bethel International Academy. Parents order in the Parent Portal and collect at school.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const products = await getShopCatalogue();
  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <>
      <PageHero
        eyebrow="School shop"
        title="Uniforms, kits and books"
        lede="Everything your child needs for school, at school prices. Order in the Parent Portal, pay at the bursary or by transfer, and collect from the school office."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "School Shop", href: "/shop" },
        ]}
      >
        <Button size="lg" className="h-12 bg-gold font-bold text-gold-foreground hover:bg-gold/85" render={<Link href="/portal/parent/shop" />}>
          Order in the Parent Portal
        </Button>
      </PageHero>

      <section className="eb-section">
        <div className="eb-container space-y-12">
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground">The shop is being stocked. Please contact the school office on {SCHOOL.phone}.</p>
          ) : (
            categories.map((c) => (
              <div key={c}>
                <SectionHeading title={SHOP_CATEGORY[c]} />
                <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {products
                    .filter((p) => p.category === c)
                    .map((p) => (
                      <li key={p.id}>
                        <Card className="h-full gap-0 overflow-hidden p-0">
                          <ProductImage product={p} className="aspect-4/3" />
                          <div className="p-4">
                            <h3 className="text-sm font-bold">{p.name}</h3>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                            <p className="mt-2 font-heading text-lg font-extrabold">{money(p.price)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {p.sizes.length > 1 ? `Sizes: ${p.sizes.map((s) => s.size).join(", ")}` : null}
                              {p.sizes.every((s) => !s.inStock) ? " · Out of stock" : ""}
                            </p>
                          </div>
                        </Card>
                      </li>
                    ))}
                </ul>
              </div>
            ))
          )}
          <p className="text-center text-sm text-muted-foreground">
            New families receive the uniform list with their offer letter. Questions? Call {SCHOOL.phone}, {SCHOOL.officeHours}.
          </p>
        </div>
      </section>
    </>
  );
}
