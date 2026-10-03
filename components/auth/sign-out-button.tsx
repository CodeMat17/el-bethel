"use client";

import * as React from "react";
import { useClerk } from "@clerk/nextjs";
import { LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function SignOutButton({ className }: { className?: string }) {
  const clerk = useClerk();
  const [pending, setPending] = React.useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={className ?? "h-11 w-full font-bold"}
      disabled={pending}
      onClick={() => {
        setPending(true);
        void clerk.signOut({ redirectUrl: "/login?signedOut=1" });
      }}
    >
      {pending ? <Spinner /> : <LogOutIcon />}
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
