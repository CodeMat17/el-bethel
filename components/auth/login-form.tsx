"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { EyeIcon, EyeOffIcon, LogInIcon, MailCheckIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type ClerkLikeError = { longMessage?: string; message?: string; code?: string } | null;

function describe(error: ClerkLikeError): string {
  if (!error) return "We couldn't sign you in. Please try again.";
  if (error.code === "form_password_incorrect" || error.code === "form_identifier_not_found") {
    // Deliberately vague: never reveal whether an account exists.
    return "We couldn't sign you in with those details. Please check them and try again.";
  }
  if (error.code === "user_locked") return "This account has been locked. Please contact the school office.";
  return error.longMessage ?? error.message ?? "We couldn't sign you in. Please try again.";
}

export function LoginForm() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{ identifier?: string; password?: string }>({});
  const [step, setStep] = React.useState<"credentials" | "code">("credentials");

  async function finish() {
    const { error } = await signIn.finalize({
      navigate: async ({ decorateUrl }) => {
        const url = decorateUrl("/portal");
        if (url.startsWith("http")) window.location.href = url;
        else router.push(url);
      },
    });
    if (error) setMessage(describe(error));
  }

  async function afterFirstFactor() {
    if (signIn.status === "complete") return finish();
    if (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) {
        setMessage("This device needs to be verified, but no email code could be sent. Please contact the school office.");
        return;
      }
      setStep("code");
      return;
    }
    if (signIn.status === "needs_new_password") {
      setMessage("Your password must be changed before you can sign in. Please contact the school office.");
      return;
    }
    setMessage("We couldn't finish signing you in. Please contact the school office.");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const errors: typeof fieldErrors = {};
    if (!identifier.trim()) errors.identifier = "Enter your email address";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) errors.identifier = "Enter a valid email address";
    if (!password) errors.password = "Enter your password";
    setFieldErrors(errors);
    if (errors.identifier || errors.password) return;

    setPending(true);
    try {
      const { error } = await signIn.password({ identifier: identifier.trim(), password });
      if (error) {
        setMessage(describe(error));
        return;
      }
      await afterFirstFactor();
    } finally {
      setPending(false);
    }
  }

  async function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!code.trim()) {
      setMessage("Enter the code from your email.");
      return;
    }
    setPending(true);
    try {
      const { error } = await signIn.mfa.verifyEmailCode({ code: code.trim() });
      if (error) {
        setMessage(describe(error));
        return;
      }
      if (signIn.status === "complete") await finish();
      else setMessage("We couldn't verify that code. Please try again.");
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
      <form onSubmit={onVerify} className="mt-6 space-y-4" noValidate>
        <div className="flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm font-semibold">
          <MailCheckIcon className="mt-0.5 size-4 shrink-0 text-info" />
          We&apos;ve emailed you a verification code to confirm this device.
        </div>
        {alert}
        <Field>
          <FieldLabel htmlFor="code">Verification code</FieldLabel>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-11 tracking-[0.3em]"
          />
        </Field>
        <Button type="submit" size="lg" className="h-11 w-full font-bold" disabled={pending}>
          {pending ? <Spinner /> : <LogInIcon />}
          {pending ? "Verifying…" : "Verify and sign in"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full font-bold"
          disabled={pending}
          onClick={() => {
            void signIn.reset();
            setStep("credentials");
            setCode("");
            setMessage(null);
          }}
        >
          Use a different account
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      {alert}

      <Field data-invalid={Boolean(fieldErrors.identifier) || undefined}>
        <FieldLabel htmlFor="identifier">Email address</FieldLabel>
        <Input
          id="identifier"
          name="identifier"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={Boolean(fieldErrors.identifier) || undefined}
          className="h-11"
        />
        {fieldErrors.identifier ? (
          <FieldError>{fieldErrors.identifier}</FieldError>
        ) : (
          <FieldDescription>Use the email address the school set up for your account.</FieldDescription>
        )}
      </Field>

      <Field data-invalid={Boolean(fieldErrors.password) || undefined}>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            aria-invalid={Boolean(fieldErrors.password) || undefined}
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
        {fieldErrors.password ? <FieldError>{fieldErrors.password}</FieldError> : null}
      </Field>

      <Button type="submit" size="lg" className="h-11 w-full font-bold" disabled={pending}>
        {pending ? <Spinner /> : <LogInIcon />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
