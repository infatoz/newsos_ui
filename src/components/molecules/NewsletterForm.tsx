"use client";

import { useState, type FormEvent } from "react";
import { themeConfig } from "@/config/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NewsletterFormProps {
  action?: string;
  heading?: string;
  description?: string;
  ctaLabel?: string;
  className?: string;
  /** Use mailto fallback when API is not ready. */
  useMailtoFallback?: boolean;
}

export function NewsletterForm({
  action = "/api/newsletter",
  heading = "Get the daily briefing",
  description = "Top stories delivered to your inbox every morning.",
  ctaLabel = "Subscribe",
  className,
  useMailtoFallback = true,
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("You’re subscribed. Check your inbox.");
        setEmail("");
        return;
      }

      // Placeholder API may 404 — fall back to mailto.
      if (useMailtoFallback && (res.status === 404 || res.status === 501)) {
        const subject = encodeURIComponent(`Newsletter signup: ${email.trim()}`);
        window.location.href = `mailto:${themeConfig.contactEmail}?subject=${subject}`;
        setStatus("idle");
        return;
      }

      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    } catch {
      if (useMailtoFallback) {
        const subject = encodeURIComponent(`Newsletter signup: ${email.trim()}`);
        window.location.href = `mailto:${themeConfig.contactEmail}?subject=${subject}`;
        setStatus("idle");
        return;
      }
      setStatus("error");
      setMessage("Unable to subscribe right now.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("flex flex-col gap-3", className)}
      noValidate
    >
      {heading ? (
        <h3 className="font-heading text-lg font-bold text-[var(--np-primary)]">
          {heading}
        </h3>
      ) : null}
      {description ? (
        <p className="text-sm text-[var(--np-muted)]">{description}</p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-sm border border-[var(--np-border)] bg-[var(--np-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--np-primary)] focus:ring-1 focus:ring-[var(--np-primary)]/20"
        />
        <Button
          type="submit"
          disabled={status === "loading"}
          className="bg-[var(--np-accent)] text-white hover:bg-[var(--np-accent)]/90"
        >
          {status === "loading" ? "…" : ctaLabel}
        </Button>
      </div>
      {message ? (
        <p
          role="status"
          className={cn(
            "text-xs",
            status === "error" ? "text-[var(--np-live)]" : "text-[var(--np-muted)]",
          )}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
