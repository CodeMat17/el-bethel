import { StatusPage } from "@/components/status-page";

export default function Unauthorized() {
  return (
    <StatusPage
      code="401"
      icon="ShieldCheck"
      title="Please sign in to continue"
      description="This part of the platform holds pupil, family and school records, so it is only available to signed-in members of the school community."
      actions={[
        { label: "Sign in", href: "/portal" },
        { label: "Back to website", href: "/", variant: "outline" },
      ]}
    />
  );
}
