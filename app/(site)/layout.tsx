import { EmergencyBanner } from "@/components/site/emergency-banner";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { PreviewBanner } from "@/components/site/preview-banner";
import { getActiveNotices } from "@/lib/school/site-data";
import { getContent, getPreviewToken, getSchool } from "@/lib/school/site-content";
import { SITE_URL } from "@/lib/school/config";
import { jsonLd, shareImage } from "@/lib/school/seo";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [notices, SCHOOL, about, previewing] = await Promise.all([
    getActiveNotices(),
    getSchool(),
    getContent("about"),
    getPreviewToken(),
  ]);

  const schema = {
    "@context": "https://schema.org",
    "@type": "School",
    name: SCHOOL.name,
    alternateName: SCHOOL.shortName,
    url: SITE_URL,
    logo: SCHOOL.logo?.url ?? `${SITE_URL}/logo.webp`,
    image: shareImage(null, SCHOOL.name).url,
    slogan: SCHOOL.motto,
    description: about.vision.mission,
    email: SCHOOL.email,
    telephone: SCHOOL.phoneHref || SCHOOL.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: SCHOOL.address,
      addressLocality: SCHOOL.city,
      addressRegion: SCHOOL.state,
      addressCountry: "NG",
    },
    sameAs: Object.values(SCHOOL.social).filter(Boolean),
  };

  return (
    <>
      {/* Structured data for search engines. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
      >
        Skip to content
      </a>
      {previewing ? <PreviewBanner /> : null}
      <EmergencyBanner notices={notices} />
      <SiteHeader school={SCHOOL} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter school={SCHOOL} />
    </>
  );
}
