"use client";

import * as React from "react";
import { SendIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valid = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email.trim());
    if (!valid) {
      toast.error("That email address doesn't look right", {
        description: "Please check it and try again.",
      });
      return;
    }
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      setEmail("");
      toast.success("You're on the list", {
        description: "We'll send school news to your inbox. You can unsubscribe any time.",
      });
    }, 650);
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <Input
        id="newsletter-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 flex-1 border-navy-foreground/20 bg-navy-foreground/10 text-navy-foreground placeholder:text-navy-foreground/45"
      />
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-11 bg-gold font-bold text-gold-foreground hover:bg-gold/85"
      >
        {pending ? "Subscribing…" : "Subscribe"}
        <SendIcon />
      </Button>
    </form>
  );
}
