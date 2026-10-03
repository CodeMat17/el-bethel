import type { AuthConfig } from "convex/server";

/**
 * Clerk issues the JWTs; Convex verifies them. Set CLERK_JWT_ISSUER_DOMAIN on the
 * Convex deployment to your Clerk Frontend API URL (Clerk Dashboard → Integrations
 * → Convex), e.g. `npx convex env set CLERK_JWT_ISSUER_DOMAIN https://xxx.clerk.accounts.dev`.
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
