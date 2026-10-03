import { EmergencyBanner } from "@/components/site/emergency-banner";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { homeForUser, getSessionUser } from "@/lib/school/auth";
import { getActiveNotice } from "@/lib/school/site-data";
import { SCHOOL, SITE_URL, MISSION } from "@/lib/school/config";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  const notice = await getActiveNotice();

  const schema = {
    "@context": "https://schema.org",
    "@type": "School",
    name: SCHOOL.name,
    alternateName: SCHOOL.shortName,
    url: SITE_URL,
    slogan: SCHOOL.motto,
    description: MISSION,
    email: SCHOOL.email,
    telephone: SCHOOL.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "No.3 Engr. Demola Oduneye Avenue, Opposite Ushafa Mini Stadium, Ushafa",
      addressLocality: "Abuja",
      addressRegion: "Federal Capital Territory",
      addressCountry: "NG",
    },
    sameAs: Object.values(SCHOOL.social),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Structured data for search engines — static, school-owned content only.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
      >
        Skip to content
      </a>
      {notice ? <EmergencyBanner notice={notice} /> : null}
      <SiteHeader signedIn={Boolean(user)} portalHref={user ? homeForUser(user) : "/login"} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
