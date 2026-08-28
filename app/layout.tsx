import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";

import { Providers } from "@/components/providers";
import { SCHOOL, SITE_URL } from "@/lib/school/config";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SCHOOL.name} | Premium Primary School in Abuja`,
    template: `%s | ${SCHOOL.name}`,
  },
  description:
    "Crestwood Heights Academy is a private Primary School in Abuja providing quality, child-centred education in a safe, stimulating and technology-enabled environment.",
  applicationName: SCHOOL.name,
  keywords: [
    "primary school Abuja",
    "primary school Jabi",
    "private school Jabi",
    "Crestwood Heights Academy",
    "school admission Abuja",
  ],
  authors: [{ name: SCHOOL.name }],
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: SITE_URL,
    siteName: SCHOOL.name,
    title: `${SCHOOL.name} | Premium Primary School in Abuja`,
    description:
      "Quality, child-centred education in a safe, stimulating and technology-enabled environment in Abuja.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@CrestwoodHeights",
    title: `${SCHOOL.name} | Primary School in Abuja`,
    description: "Nurturing Minds, Building Futures — Crestwood Heights Academy, Abuja.",
  },
  robots: { index: true, follow: true },
  icons: { icon: [{ url: "/favicon.ico" }, { url: "/icon.svg", type: "image/svg+xml" }], apple: "/icon.svg" },
};

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
    <html lang="en-NG" suppressHydrationWarning className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
