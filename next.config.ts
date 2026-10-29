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
        // Private portals must never be indexed.
        source: "/portal/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
