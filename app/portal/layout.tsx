import { ClerkProvider } from "@clerk/nextjs";

/** Clerk is loaded only for sign-in and the portals, never on the public website. */
export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return (
    <ClerkProvider signInUrl="/login" signInFallbackRedirectUrl="/portal">
      {children}
    </ClerkProvider>
  );
}
