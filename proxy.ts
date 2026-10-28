import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Optimistic gate only: signed-out visitors to the portals are sent to sign in.
 * Real authorization happens in Convex on every query and mutation.
 *
 * Clerk runs only where it is needed — sign-in, the portals and the certificate and
 * document downloads. The public website never touches Clerk.
 */
const isPortal = createRouteMatcher(["/portal(.*)"]);

export default clerkMiddleware(
  async (auth, request) => {
    if (isPortal(request)) await auth.protect();
  },
  { signInUrl: "/login" },
);

export const config = {
  matcher: ["/login", "/portal/:path*", "/api/certificates/:path*", "/api/documents/:path*"],
};
