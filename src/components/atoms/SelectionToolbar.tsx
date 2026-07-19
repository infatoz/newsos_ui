"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Search, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectionToolbarConfig {
  enabled?: boolean;
  searchEnabled?: boolean;
  shareEnabled?: boolean;
  copyEnabled?: boolean;
  /** google | site | bing | duckduckgo */
  searchEngine?: string;
  minChars?: number;
  searchLabel?: string;
  shareLabel?: string;
  copyLabel?: string;
  siteSearchPath?: string;
}

export interface SelectionToolbarProps {
  /** CSS selector or element — selection must be inside this root. */
  rootSelector?: string;
  articleUrl: string;
  articleTitle: string;
  config?: SelectionToolbarConfig | null;
  className?: string;
}

type Pos = { top: number; left: number };

function buildSearchUrl(
  query: string,
  engine: string,
  siteSearchPath: string,
): string {
  const q = encodeURIComponent(query);
  switch (engine) {
    case "site":
      return `${siteSearchPath}${siteSearchPath.includes("?") ? "&" : "?"}q=${q}`;
    case "bing":
      return `https://www.bing.com/search?q=${q}`;
    case "duckduckgo":
      return `https://duckduckgo.com/?q=${q}`;
    case "google":
    default:
      return `https://www.google.com/search?q=${q}`;
  }
}

function buildShareLinks(text: string, url: string, title: string) {
  const quote = text.length > 280 ? `${text.slice(0, 277)}…` : text;
  const message = `"${quote}"\n\n${title}\n${url}`;
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${quote}"`)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(quote)}`,
  };
}

/**
 * Floating toolbar when readers select text in the article:
 * Search · Share · Copy
 */
export function SelectionToolbar({
  rootSelector = "[data-article-body]",
  articleUrl,
  articleTitle,
  config,
  className,
}: SelectionToolbarProps) {
  const enabled = config?.enabled !== false;
  const showSearch = config?.searchEnabled !== false;
  const showShare = config?.shareEnabled !== false;
  const showCopy = config?.copyEnabled !== false;
  const minChars = Math.max(1, config?.minChars ?? 3);
  const engine = config?.searchEngine || "google";
  const siteSearchPath = config?.siteSearchPath || "/search";

  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<Pos>({ top: 0, left: 0 });
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const hide = useCallback(() => {
    setVisible(false);
    setShareOpen(false);
    setCopied(false);
    setText("");
  }, []);

  const updateFromSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount < 1) {
      hide();
      return;
    }

    const selected = sel.toString().replace(/\s+/g, " ").trim();
    if (selected.length < minChars) {
      hide();
      return;
    }

    const root = document.querySelector(rootSelector);
    if (!root) {
      hide();
      return;
    }

    const anchor = sel.anchorNode;
    const focus = sel.focusNode;
    if (
      !anchor ||
      !focus ||
      !root.contains(anchor) ||
      !root.contains(focus)
    ) {
      hide();
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      hide();
      return;
    }

    const barW = barRef.current?.offsetWidth || 220;
    const left = Math.min(
      Math.max(8, rect.left + rect.width / 2 - barW / 2),
      window.innerWidth - barW - 8,
    );
    // Place above selection; if near top of viewport, place below.
    const above = rect.top - 44;
    const top = above < 8 ? rect.bottom + 8 : above;

    setText(selected);
    setPos({ top, left });
    setVisible(true);
    setShareOpen(false);
    setCopied(false);
  }, [hide, minChars, rootSelector]);

  useEffect(() => {
    if (!enabled) return;

    const onMouseUp = () => {
      // Defer so selection is finalized.
      window.setTimeout(updateFromSelection, 10);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
      else if (e.shiftKey) window.setTimeout(updateFromSelection, 10);
    };
    const onScroll = () => {
      if (visible) updateFromSelection();
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (barRef.current && t && barRef.current.contains(t)) {
        e.preventDefault(); // keep selection when clicking toolbar
      }
    };

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("scroll", onScroll, true);
    document.addEventListener("mousedown", onDown);

    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("mousedown", onDown);
    };
  }, [enabled, hide, updateFromSelection, visible]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [text]);

  const handleSearch = useCallback(() => {
    const url = buildSearchUrl(text, engine, siteSearchPath);
    window.open(url, "_blank", "noopener,noreferrer");
  }, [text, engine, siteSearchPath]);

  if (!enabled || (!showSearch && !showShare && !showCopy)) {
    return null;
  }

  const shares = buildShareLinks(text, articleUrl, articleTitle);
  const btn =
    "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-semibold text-white/95 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

  return (
    <div
      ref={barRef}
      role="toolbar"
      aria-label="Selection actions"
      className={cn(
        "z-[60] flex flex-col items-stretch rounded-md bg-[var(--np-primary)] shadow-lg transition-opacity",
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        className,
      )}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
      }}
    >
      <div className="flex items-center gap-0.5 p-1">
        {showSearch ? (
          <button type="button" className={btn} onClick={handleSearch}>
            <Search className="size-3.5" aria-hidden />
            {config?.searchLabel || "Search"}
          </button>
        ) : null}
        {showShare ? (
          <button
            type="button"
            className={btn}
            onClick={() => setShareOpen((o) => !o)}
            aria-expanded={shareOpen}
          >
            <Share2 className="size-3.5" aria-hidden />
            {config?.shareLabel || "Share"}
          </button>
        ) : null}
        {showCopy ? (
          <button type="button" className={btn} onClick={handleCopy}>
            {copied ? (
              <Check className="size-3.5 text-emerald-300" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
            {copied ? "Copied" : config?.copyLabel || "Copy"}
          </button>
        ) : null}
      </div>

      {shareOpen && showShare ? (
        <div className="flex border-t border-white/15 p-1">
          <a
            href={shares.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={btn}
            onClick={hide}
          >
            WhatsApp
          </a>
          <a
            href={shares.x}
            target="_blank"
            rel="noopener noreferrer"
            className={btn}
            onClick={hide}
          >
            X
          </a>
          <a
            href={shares.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className={btn}
            onClick={hide}
          >
            Facebook
          </a>
        </div>
      ) : null}
    </div>
  );
}
