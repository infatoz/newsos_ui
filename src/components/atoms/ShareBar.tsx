"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShareChannels {
  whatsapp?: boolean;
  x?: boolean;
  facebook?: boolean;
  copy?: boolean;
}

export interface GooglePreferredSourceConfig {
  enabled?: boolean;
  url?: string | null;
  label?: string | null;
}

export interface ShareBarProps {
  url: string;
  title: string;
  text?: string;
  className?: string;
  channels?: ShareChannels;
  preferredSource?: GooglePreferredSourceConfig | null;
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.722-8.828L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function buildShareLinks(url: string, title: string, text?: string) {
  const message = [text?.trim() || title, url].filter(Boolean).join("\n");
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };
}

const btnClass =
  "inline-flex size-9 items-center justify-center rounded-sm border border-[var(--np-border)] bg-[var(--np-surface)] text-[var(--np-text)] transition-colors hover:border-[var(--np-primary)] hover:text-[var(--np-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--np-accent)]";

/**
 * Article share bar: WhatsApp, X, Facebook, copy/native, Google preferred source.
 */
export function ShareBar({
  url,
  title,
  text,
  className,
  channels,
  preferredSource,
}: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const links = useMemo(
    () => buildShareLinks(url, title, text),
    [url, title, text],
  );

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  const show = {
    whatsapp: channels?.whatsapp !== false,
    x: channels?.x !== false,
    facebook: channels?.facebook !== false,
    copy: channels?.copy !== false,
  };

  const showPreferred =
    Boolean(preferredSource?.enabled) && Boolean(preferredSource?.url);

  const copyOrNative = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title, text: text ?? title, url });
        return;
      }
    } catch {
      /* cancelled */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [title, text, url]);

  if (
    !show.whatsapp &&
    !show.x &&
    !show.facebook &&
    !show.copy &&
    !showPreferred
  ) {
    return null;
  }

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      role="group"
      aria-label="Share this article"
    >
      <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-[var(--np-muted)]">
        Share
      </span>

      {show.whatsapp ? (
        <a
          href={links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          aria-label="Share on WhatsApp"
          title="WhatsApp"
        >
          <IconWhatsApp className="size-4 text-[#25D366]" />
        </a>
      ) : null}

      {show.x ? (
        <a
          href={links.x}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          aria-label="Share on X"
          title="X"
        >
          <IconX className="size-4" />
        </a>
      ) : null}

      {show.facebook ? (
        <a
          href={links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
          aria-label="Share on Facebook"
          title="Facebook"
        >
          <IconFacebook className="size-4 text-[#1877F2]" />
        </a>
      ) : null}

      {show.copy ? (
        <button
          type="button"
          onClick={copyOrNative}
          className={btnClass}
          aria-label={copied ? "Link copied" : "Copy link or share"}
          title={copied ? "Copied" : "Copy link"}
        >
          {copied ? (
            <Check className="size-4 text-[var(--np-accent)]" aria-hidden />
          ) : canNativeShare ? (
            <Share2 className="size-4" aria-hidden />
          ) : (
            <Link2 className="size-4" aria-hidden />
          )}
        </button>
      ) : null}

      {showPreferred ? (
        <a
          href={preferredSource!.url!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--np-border)] bg-[var(--np-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--np-primary)] transition-colors hover:border-[#4285F4] hover:text-[#4285F4]"
          title={preferredSource?.label || "Preferred source on Google"}
        >
          <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="max-w-[11rem] truncate sm:max-w-none">
            {preferredSource?.label || "Preferred on Google"}
          </span>
        </a>
      ) : null}
    </div>
  );
}
