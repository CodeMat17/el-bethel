import type { NextConfig } from "next";

// Shared hosting (Hostinger) caps how many threads one account may run. The
// Rust tooling (SWC, Tailwind) sizes its thread pools to the server's CPU count
// and panics with "OS can't spawn worker thread" when it hits that cap, so keep
// production builds small. Build workers inherit these variables.
const isBuild = process.argv.includes("build");
if (isBuild) {
  process.env.TOKIO_WORKER_THREADS ??= "2";
  process.env.RAYON_NUM_THREADS ??= "2";
  process.env.UV_THREADPOOL_SIZE ??= "2";
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com", pathname: "/photos/**" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  experimental: {
    // Enables the `unauthorized()` and `forbidden()` server guards used by the portals.
    authInterrupts: true,
    // One static-generation worker instead of one per CPU (see note above).
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
