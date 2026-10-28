"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { EyeIcon, EyeOffIcon, KeyRoundIcon, MailCheckIcon, SendIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type ClerkErrorDetail = { longMessage?: string; message?: string; code?: string };
type ClerkLikeError = (ClerkErrorDetail & { errors?: ClerkErrorDetail[] }) | null;

function describe(wrapped: ClerkLikeError, fallback: string): string {
  const error = wrapped?.errors?.[0] ?? wrapped;
  if (!error) return fallback;
  if (error.code === "form_identifier_not_found") {
    return "We couldn't send a code to that address. Check it's the email the school set up for you, or contact the school office.";
  }
  if (error.code === "form_code_incorrect") return "That code isn't right. Check the latest email and try again.";
  return error.longMessage ?? error.message ?? fallback;
}

/**
 * Set or reset a password with a code emailed by Clerk. New accounts made by
 * the school use this too: their invite email links here.
 */
export function ResetPasswordForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const { signIn } = useSignIn();
  const [email, setEmail] = React.useState(initialEmail);
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [step, setStep] = React.useState<"email" | "code">("email");
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function sendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Enter the email address the school set up for you.");
      return;
    }
    setPending(true);
    try {
      const created = await signIn.create({ identifier: email.trim() });
      if (created.error) return setMessage(describe(created.error, "We couldn't send a code. Please try again."));
      const sent = await signIn.resetPasswordEmailCode.sendCode();
      if (sent.error) return setMessage(describe(sent.error, "We couldn't send a code. Please try again."));
      setStep("code");
    } finally {
      setPending(false);
    }
  }

  async function setNewPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!code.trim()) return setMessage("Enter the code from your email.");
    if (password.length < 15) return setMessage("Choose a password of at least 15 characters.");
    setPending(true);
    try {
      if (signIn.status !== "needs_new_password") {
        const verified = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
        if (verified.error) return setMessage(describe(verified.error, "We couldn't check that code. Please try again."));
      }
      const submitted = await signIn.resetPasswordEmailCode.submitPassword({ password, signOutOfOtherSessions: true });
      if (submitted.error) return setMessage(describe(submitted.error, "We couldn't save that password. Please try another."));
      if (signIn.status !== "complete") {
        router.push("/login?passwordSet=1");
        return;
      }
      const finished = await signIn.finalize({
        navigate: async ({ decorateUrl }) => {
          const url = decorateUrl("/portal");
          if (url.startsWith("http")) window.location.href = url;
          else router.push(url);
        },
      });
      if (finished.error) setMessage(describe(finished.error, "Your password is saved. Please sign in."));
    } finally {
      setPending(false);
    }
  }

  const alert = message ? (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      {message}
    </div>
  ) : null;

  if (step === "code") {
    return (
      <form onSubmit={setNewPassword} className="mt-6 space-y-4" noValidate>
        <div className="flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm font-semibold">
          <MailCheckIcon className="mt-0.5 size-4 shrink-0 text-info" />
          We&apos;ve emailed a code to {email.trim()}.
        </div>
        {alert}
        <Field>
          <FieldLabel htmlFor="code">Code from the email</FieldLabel>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-11 tracking-[0.3em]"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-password">New password</FieldLabel>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pr-11"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-2 -translate-y-1/2"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </Button>
          </div>
          <FieldDescription>At least 15 characters.</FieldDescription>
        </Field>
        <Button type="submit" size="lg" className="h-11 w-full font-bold" disabled={pending}>
          {pending ? <Spinner /> : <KeyRoundIcon />}
          {pending ? "Saving…" : "Save password and sign in"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full font-bold"
          disabled={pending}
          onClick={() => {
            void signIn.reset();
            setStep("email");
            setCode("");
            setMessage(null);
          }}
        >
          Use a different email
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="mt-6 space-y-4" noValidate>
      {alert}
      <Field>
        <FieldLabel htmlFor="reset-email">Email address</FieldLabel>
        <Input
          id="reset-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-11"
        />
        <FieldDescription>We&apos;ll email you a code to set a new password.</FieldDescription>
      </Field>
      <Button type="submit" size="lg" className="h-11 w-full font-bold" disabled={pending}>
        {pending ? <Spinner /> : <SendIcon />}
        {pending ? "Sending…" : "Email me a code"}
      </Button>
      <Button variant="ghost" className="w-full font-bold" render={<Link href="/login" />}>
        Back to sign in
      </Button>
    </form>
  );
}
