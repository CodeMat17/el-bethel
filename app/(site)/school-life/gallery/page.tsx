import type { Metadata } from "next";

import { CtaBand, PageHero } from "@/components/common";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { getGallery } from "@/lib/school/data";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photographs from classrooms, sports, excursions, cultural events, science, arts and facilities at El-Bethel International Academy, Abuja.",
  alternates: { canonical: "/school-life/gallery" },
};

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="School life"
        title="Gallery"
        lede="Moments from across the school year. Images of children are published only where consent has been given by their family."
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "School Life", href: "/school-life" },
          { label: "Gallery", href: "/school-life/gallery" },
        ]}
      />

      <section className="eb-section">
        <div className="eb-container">
          <GalleryGrid items={getGallery()} />
        </div>
      </section>

      <CtaBand
        title="Want to see it in person?"
        text="Photographs only go so far. Book a tour and see a normal school day, unrehearsed."
        primary={{ label: "Book a school tour", href: "/contact/tour" }}
        secondary={{ label: "Read the latest news", href: "/news" }}
      />
    </>
  );
}
