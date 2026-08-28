import { StatusPage } from "@/components/status-page";

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      icon="Search"
      title="We couldn't find that page"
      description="The page you are looking for may have been moved or no longer exists. Try the homepage or search the site."
      actions={[
        { label: "Back to homepage", href: "/" },
        { label: "Contact the school", href: "/contact", variant: "outline" },
      ]}
    />
  );
}
