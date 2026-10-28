import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeftIcon, ShieldCheckIcon } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Brand } from "@/components/site/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";

import { getSessionUser, homeForUser, NO_ACCESS } from "@/lib/school/auth";
import { getSchool } from "@/lib/school/site-content";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the El-Bethel International Academy parent, pupil, teacher or admin portal.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const SCHOOL = await getSchool();
  const user = await getSessionUser();
  if (user) redirect(homeForUser(user));
  // Signed in with Clerk, but no active school account is linked to this sign-in.
  const { userId } = await auth();
  if (userId) redirect(NO_ACCESS);
  const params = await searchParams;
  const signedOut = params.signedOut === "1";
  const passwordSet = params.passwordSet === "1";
  // ?setup=1 comes from the invite email for a new account; ?reset=1 from "Forgot password?".
  const setup = params.setup === "1";
  const resetting = setup || params.reset === "1";
  const inviteEmail = typeof params.email === "string" ? params.email : "";

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
          © {new Date().getFullYear()} {SCHOOL.name}
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

            <h2 className="mt-8 font-heading text-2xl sm:text-3xl">
              {setup ? "Set your password" : resetting ? "Reset your password" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {setup
                ? "Your school portal account is ready. Choose a password to finish setting it up."
                : resetting
                  ? "We'll email you a code, then you can choose a new password."
                  : "Sign in to your parent, pupil, teacher or administrator account."}
            </p>

            {signedOut ? (
              <div className="mt-5 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
                You have been signed out safely.
              </div>
            ) : null}

            {passwordSet ? (
              <div className="mt-5 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
                Your password is saved. Sign in with it below.
              </div>
            ) : null}

            {resetting ? <ResetPasswordForm initialEmail={inviteEmail} /> : <LoginForm />}

            {!resetting ? (
              <p className="mt-4 text-center text-sm">
                <Link href="/login?reset=1" className="font-bold text-primary underline-offset-4 hover:underline dark:text-gold">
                  Forgot your password? Reset it by email
                </Link>
              </p>
            ) : null}

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Accounts are created by the school. Forgotten your password? Ask the school office for a new one.
            </p>

            <p className="mt-4 text-center text-sm text-muted-foreground">
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
