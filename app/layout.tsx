import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";

import { Providers } from "@/components/providers";
import { SITE_URL } from "@/lib/school/config";
import { shareImage } from "@/lib/school/seo";
import { getSchool } from "@/lib/school/site-content";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
  // Variable font: one file covers every weight, instead of one download per weight.
});

export async function generateMetadata(): Promise<Metadata> {
  const SCHOOL = await getSchool();
  const title = `${SCHOOL.name} | Creche, Primary & Junior Secondary School in Abuja`;
  const description = `${SCHOOL.name} is a private creche, nursery, primary and junior secondary school in Ushafa, Abuja, providing quality, child-centred education in a safe, stimulating and technology-enabled environment.`;
  const images = [shareImage(null, SCHOOL.name)];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${SCHOOL.name}` },
    description,
    applicationName: SCHOOL.name,
    keywords: [
      "primary school Abuja",
      "nursery school Abuja",
      "creche Abuja",
      "junior secondary school Abuja",
      "primary school Ushafa",
      "private school Ushafa",
      "El-Bethel International Academy",
      "school admission Abuja",
    ],
    authors: [{ name: SCHOOL.name }],
    manifest: "/manifest.webmanifest",
    // Fallbacks for pages that set none of their own; public pages build theirs with pageMetadata.
    openGraph: { type: "website", locale: "en_NG", siteName: SCHOOL.name, title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
    robots: { index: true, follow: true },
    icons: { icon: "/favicon.ico", apple: "/logo.webp" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#171c26" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" data-scroll-behavior="smooth" suppressHydrationWarning className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
