import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeftIcon, ShieldCheckIcon } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { Brand } from "@/components/site/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { demoLoginAction } from "@/lib/school/actions/auth";
import { getSessionUser, homeForUser } from "@/lib/school/auth";
import { SCHOOL } from "@/lib/school/config";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the El-Bethel International Academy parent, pupil, teacher or admin portal.",
  robots: { index: false, follow: false },
};

const DEMO_ACCOUNTS = [
  { label: "Parent", name: "Mrs. Ada Chukwu", email: "parent@elbethel.edu.ng", detail: "Three children across Primary 1, Primary 3 and Primary 5", icon: "Users" },
  { label: "Pupil", name: "David Chukwu", email: "pupil@elbethel.edu.ng", detail: "Primary 4A · EIA-2026-00482", icon: "Backpack" },
  { label: "Teacher", name: "Miss Chiamaka Obi", email: "teacher@elbethel.edu.ng", detail: "Class teacher, Primary 4A", icon: "GraduationCap" },
  { label: "Administrator", name: "Ngozi Adeleke", email: "admin@elbethel.edu.ng", detail: "Full school control centre", icon: "LayoutDashboard" },
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getSessionUser();
  if (user) redirect(homeForUser(user));
  const params = await searchParams;
  const signedOut = params.signedOut === "1";

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-navy text-navy-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(40rem 26rem at 20% 10%, color-mix(in oklch, var(--gold) 34%, transparent), transparent 68%), radial-gradient(36rem 24rem at 90% 80%, color-mix(in oklch, var(--info) 40%, transparent), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <Brand className="[&_span]:text-navy-foreground" />
        </div>
        <div className="relative max-w-md">
          <h1 className="font-heading text-3xl leading-tight">
            One platform for the whole school community.
          </h1>
          <p className="mt-4 leading-relaxed text-navy-foreground/70">
            Parents follow their children. Pupils submit their work. Teachers grade and record.
            Administrators run the school. All in one place, with every boundary enforced on the server.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-navy-foreground/80">
            {[
              "Role-based access on every page and action",
              "Children's records visible only to authorised adults",
              "Every administrative change written to an audit log",
            ].map((point) => (
              <li key={point} className="flex items-start gap-3">
                <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-navy-foreground/50">
          © {new Date().getFullYear()} {SCHOOL.name} · Demo environment
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Button variant="ghost" size="sm" className="font-bold" render={<Link href="/" />}>
            <ArrowLeftIcon />
            Back to website
          </Button>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-6">
          <div className="w-full max-w-md">
            <div className="lg:hidden">
              <Brand />
            </div>

            <h2 className="mt-8 font-heading text-2xl sm:text-3xl">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your parent, pupil, teacher or administrator account.
            </p>

            {signedOut ? (
              <div className="mt-5 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
                You have been signed out safely.
              </div>
            ) : null}

            <LoginForm />

            <div className="mt-8">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 eb-hairline" />
                <span className="text-[0.68rem] font-extrabold tracking-[0.16em] text-muted-foreground uppercase">
                  Demo accounts
                </span>
                <span className="h-px flex-1 eb-hairline" />
              </div>

              <div className="mt-4 grid gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <Card key={account.email} className="gap-0 p-0">
                    <form action={demoLoginAction} className="flex items-center gap-3 p-3">
                      <input type="hidden" name="email" value={account.email} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold">
                          {account.name}
                          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-bold text-muted-foreground">
                            {account.label}
                          </span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{account.detail}</p>
                      </div>
                      <Button type="submit" size="sm" variant="outline" className="shrink-0 font-bold">
                        Sign in
                      </Button>
                    </form>
                  </Card>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Every demo account uses the password <code className="rounded bg-muted px-1.5 py-0.5 font-semibold">elbethel</code>.
              </p>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Applying for admission?{" "}
              <Link href="/admissions/apply" className="font-bold text-primary underline-offset-4 hover:underline dark:text-gold">
                Start an application
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
