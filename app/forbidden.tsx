import { StatusPage } from "@/components/status-page";

export default function Forbidden() {
  return (
    <StatusPage
      code="403"
      icon="Shield"
      title="You don't have permission to view this page"
      description="Your account does not have access to this area. If you believe this is a mistake, please contact the school office."
      actions={[
        { label: "Back to my portal", href: "/portal" },
        { label: "Contact the school", href: "/contact", variant: "outline" },
      ]}
    />
  );
}
