import { CtaBand, PageHero } from "@/components/common";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { getGallery } from "@/lib/school/site-data";
import { pageMetadata } from "@/lib/school/seo";

export const generateMetadata = () =>
  pageMetadata({
    title: "Gallery",
    description:
      "Photographs from classrooms, sports, excursions, cultural events, science, arts and facilities at El-Bethel International Academy, Abuja.",
    path: "/school-life/gallery",
  });

export default async function GalleryPage() {
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
          <GalleryGrid items={await getGallery()} />
        </div>
      </section>

      <CtaBand
        title="Want to know more?"
        text="Photographs only go so far. Talk to our school office about admission, classes and school life."
        primary={{ label: "Contact the school", href: "/contact" }}
        secondary={{ label: "Read the latest news", href: "/news" }}
      />
    </>
  );
}
