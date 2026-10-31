import type { NextConfig } from "next";

// Builds run on shared hosting (Hostinger), which caps threads and memory per
// account. scripts/build.mjs limits the native thread pools; the options below
// keep the rest of the build small.
const isBuild = process.argv.includes("build");

const nextConfig: NextConfig = {
  images: {
    // Cloudinary resizes photos on its CDN, so this server never runs the image optimizer.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
  experimental: {
    // Enables the `unauthorized()` and `forbidden()` server guards used by the portals.
    authInterrupts: true,
    // Lower peak memory during webpack compilation.
    webpackMemoryOptimizations: true,
    // Public pages read Convex while prerendering; retry a dropped connection instead of failing the build.
    staticGenerationRetryCount: 3,
    // One static-generation worker instead of one per CPU.
    ...(isBuild && { cpus: 1 }),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Pages and their RSC payloads. Next would mark static pages cacheable for a
        // year, and Hostinger's CDN would then keep serving its copy after a dashboard
        // edit (refreshSite clears this server's cache, not the CDN's). With this the
        // CDN passes every page request through, so edits show on the next visit.
        // Hashed /_next/static files and public images still cache normally.
        source: "/((?!_next/static|_next/image|.*\\.(?:webp|png|jpe?g|gif|svg|ico|woff2?)$).*)",
        headers: [{ key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" }],
      },
      {
        // Private portals must never be indexed.
        source: "/portal/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
