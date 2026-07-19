"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
  className?: string;
  variant?: "icon" | "labeled";
}

export function ShareButton({
  url,
  title,
  text,
  className,
  variant = "icon",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  const share = useCallback(async () => {
    const payload = { title, text: text ?? title, url };

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch {
      // User cancelled or share failed — fall through to copy.
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable.
    }
  }, [title, text, url]);

  return (
    <Button
      type="button"
      variant="outline"
      size={variant === "icon" ? "icon-sm" : "sm"}
      onClick={share}
      className={cn("border-[var(--np-border)]", className)}
      aria-label={copied ? "Link copied" : "Share article"}
    >
      {copied ? (
        <Check className="size-4 text-[var(--np-accent)]" aria-hidden />
      ) : canNativeShare ? (
        <Share2 className="size-4" aria-hidden />
      ) : (
        <Link2 className="size-4" aria-hidden />
      )}
      {variant === "labeled" ? (
        <span>{copied ? "Copied" : "Share"}</span>
      ) : null}
    </Button>
  );
}
