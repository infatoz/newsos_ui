"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface ArticleFontConfig {
  enabled?: boolean;
  defaultPx: number;
  minPx: number;
  maxPx: number;
  stepPx: number;
  lineHeight: number;
  scaleLineHeight?: boolean;
  showReset?: boolean;
  showSizeLabel?: boolean;
  storageKey?: string;
  decreaseLabel?: string;
  increaseLabel?: string;
  resetLabel?: string;
  toolbarLabel?: string;
}

interface ArticleFontContextValue {
  enabled: boolean;
  sizePx: number;
  lineHeight: number;
  percent: number;
  canDecrease: boolean;
  canIncrease: boolean;
  isDefault: boolean;
  config: ArticleFontConfig;
  decrease: () => void;
  increase: () => void;
  reset: () => void;
  styleVars: CSSProperties;
}

const ArticleFontContext = createContext<ArticleFontContextValue | null>(null);

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function readStored(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

export function ArticleFontProvider({
  config,
  children,
}: {
  config: ArticleFontConfig;
  children: ReactNode;
}) {
  const enabled = config.enabled !== false;
  const minPx = config.minPx;
  const maxPx = config.maxPx;
  const stepPx = Math.max(1, config.stepPx);
  const defaultPx = clamp(config.defaultPx, minPx, maxPx);
  const storageKey = config.storageKey || "np-article-font-size";
  const baseLh = config.lineHeight || 1.75;

  const [sizePx, setSizePx] = useState(defaultPx);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    setSizePx(clamp(readStored(storageKey, defaultPx), minPx, maxPx));
    setReady(true);
  }, [enabled, storageKey, defaultPx, minPx, maxPx]);

  useEffect(() => {
    if (!enabled || !ready) return;
    try {
      window.localStorage.setItem(storageKey, String(sizePx));
    } catch {
      /* ignore */
    }
  }, [enabled, ready, sizePx, storageKey]);

  const lineHeight = useMemo(() => {
    if (!config.scaleLineHeight) return baseLh;
    const ratio = sizePx / defaultPx;
    return (
      Math.round(clamp(baseLh * (0.92 + ratio * 0.08), 1.35, 2.4) * 100) / 100
    );
  }, [config.scaleLineHeight, baseLh, sizePx, defaultPx]);

  const decrease = useCallback(() => {
    setSizePx((s) => clamp(s - stepPx, minPx, maxPx));
  }, [stepPx, minPx, maxPx]);

  const increase = useCallback(() => {
    setSizePx((s) => clamp(s + stepPx, minPx, maxPx));
  }, [stepPx, minPx, maxPx]);

  const reset = useCallback(() => {
    setSizePx(defaultPx);
  }, [defaultPx]);

  const value = useMemo<ArticleFontContextValue>(
    () => ({
      enabled,
      sizePx,
      lineHeight,
      percent: Math.round((sizePx / defaultPx) * 100),
      canDecrease: sizePx > minPx,
      canIncrease: sizePx < maxPx,
      isDefault: sizePx === defaultPx,
      config,
      decrease,
      increase,
      reset,
      styleVars: {
        ["--article-font-size" as string]: `${sizePx}px`,
        ["--article-line-height" as string]: String(lineHeight),
      } as CSSProperties,
    }),
    [
      enabled,
      sizePx,
      lineHeight,
      defaultPx,
      minPx,
      maxPx,
      config,
      decrease,
      increase,
      reset,
    ],
  );

  return (
    <ArticleFontContext.Provider value={value}>
      {children}
    </ArticleFontContext.Provider>
  );
}

export function useArticleFont(): ArticleFontContextValue | null {
  return useContext(ArticleFontContext);
}

const btnClass =
  "inline-flex min-w-9 items-center justify-center rounded-sm border border-[var(--np-border)] bg-[var(--np-surface)] px-2 py-1.5 text-sm font-semibold text-[var(--np-text)] transition-colors hover:border-[var(--np-primary)] hover:text-[var(--np-primary)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--np-accent)]";

export function ArticleFontToolbar({ className }: { className?: string }) {
  const ctx = useArticleFont();
  if (!ctx?.enabled) return null;

  const { config } = ctx;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      role="group"
      aria-label={config.toolbarLabel || "Text size"}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--np-muted)]">
        {config.toolbarLabel || "Text size"}
      </span>
      <button
        type="button"
        className={btnClass}
        onClick={ctx.decrease}
        disabled={!ctx.canDecrease}
        aria-label="Decrease text size"
        title="Decrease"
      >
        {config.decreaseLabel || "A−"}
      </button>
      <button
        type="button"
        className={btnClass}
        onClick={ctx.increase}
        disabled={!ctx.canIncrease}
        aria-label="Increase text size"
        title="Increase"
      >
        <span className="text-base leading-none">
          {config.increaseLabel || "A+"}
        </span>
      </button>
      {config.showReset !== false ? (
        <button
          type="button"
          className={cn(btnClass, "text-xs font-medium")}
          onClick={ctx.reset}
          disabled={ctx.isDefault}
          aria-label="Reset text size"
          title="Reset"
        >
          {config.resetLabel || "Reset"}
        </button>
      ) : null}
      {config.showSizeLabel !== false ? (
        <span
          className="tabular-nums text-xs text-[var(--np-muted)]"
          aria-live="polite"
        >
          {ctx.sizePx}px · {ctx.percent}%
        </span>
      ) : null}
    </div>
  );
}

/** Applies font CSS variables to article body descendants. */
export function ArticleFontScope({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ctx = useArticleFont();
  if (!ctx?.enabled) {
    return <div className={className}>{children}</div>;
  }
  return (
    <div className={className} style={ctx.styleVars}>
      {children}
    </div>
  );
}
