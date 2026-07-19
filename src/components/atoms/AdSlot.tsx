"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import type { Ad } from "@/types";
import { cn } from "@/lib/utils";
import {
  resolveSlotSize,
  type SlotSizeOverride,
} from "@/utils/ad-slot-size";

export type AdSlotRenderType = "html" | "js" | "adsense" | "gam";

export interface AdSlotProps {
  ad?: Ad | null;
  /** Explicit render mode; inferred from ad.provider when omitted. */
  type?: AdSlotRenderType;
  className?: string;
  /** Extra GPT targeting key/values. */
  targeting?: Record<string, string>;
  /** Homepage builder size override. */
  reserve?: SlotSizeOverride | null;
  /** Defer network creatives until near viewport (default true). */
  lazy?: boolean;
}

function inferType(ad: Ad): AdSlotRenderType {
  if (ad.provider === "gpt") return "gam";
  if (ad.provider === "adsense") return "adsense";
  if (ad.scriptSrc) return "js";
  return "html";
}

function ReserveBox({
  width,
  height,
  widthMobile,
  heightMobile,
  className,
  children,
}: {
  width: number;
  height: number;
  widthMobile: number;
  heightMobile: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("ad-slot-reserve mx-auto w-full overflow-hidden", className)}
      style={
        {
          maxWidth: `min(100%, ${width}px)`,
          aspectRatio: `${width} / ${height}`,
          ["--ad-w" as string]: String(width),
          ["--ad-h" as string]: String(height),
          ["--ad-mw" as string]: String(widthMobile),
          ["--ad-mh" as string]: String(heightMobile),
        } as CSSProperties
      }
      data-mobile-w={widthMobile}
      data-mobile-h={heightMobile}
    >
      {children}
    </div>
  );
}

export function AdSlot({
  ad,
  type,
  className,
  targeting,
  reserve,
  lazy = true,
}: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(!lazy);
  const size = resolveSlotSize(ad, reserve);
  const isActive = Boolean(ad?.isActive);
  const renderType = ad ? (type ?? inferType(ad)) : "html";
  const hasCreative = Boolean(
    ad &&
      isActive &&
      (ad.html ||
        ad.imageUrl ||
        ad.scriptSrc ||
        renderType === "gam" ||
        renderType === "adsense"),
  );

  useEffect(() => {
    if (!lazy || inView) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lazy, inView]);

  useEffect(() => {
    if (!ad || !isActive || !inView || renderType !== "js" || !ad.scriptSrc) {
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const existing = el.querySelector(`script[data-ad-id="${ad.id}"]`);
    if (existing) return;

    const script = document.createElement("script");
    script.src = ad.scriptSrc;
    script.async = true;
    script.dataset.adId = ad.id;
    el.appendChild(script);

    return () => {
      script.remove();
    };
  }, [ad, isActive, renderType, inView]);

  useEffect(() => {
    if (!ad || !isActive || !inView || renderType !== "adsense") return;
    try {
      // @ts-expect-error adsbygoogle global
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ignore */
    }
  }, [ad, isActive, renderType, inView]);

  const disclosure =
    ad && ad.showDisclosure !== false ? (
      <p className="mb-1 h-4 text-center text-[10px] uppercase leading-4 tracking-widest text-[var(--np-muted)]">
        {ad.label ?? "Advertisement"}
      </p>
    ) : null;

  // Always reserve space when we know dimensions (prevents CLS).
  if (!ad || !isActive || !hasCreative) {
    const hasExplicitReserve =
      (Number(reserve?.adWidth) > 0 && Number(reserve?.adHeight) > 0) ||
      Boolean(ad?.slotWidth && ad?.slotHeight);
    if (!hasExplicitReserve && !ad) {
      return null;
    }
    if (!hasExplicitReserve && ad && !isActive) {
      return null;
    }
    return (
      <aside
        ref={rootRef}
        className={cn("ad-slot ad-slot--empty flex flex-col items-center", className)}
        aria-hidden="true"
      >
        <ReserveBox {...size} className="bg-[var(--np-surface)]" />
      </aside>
    );
  }

  if (renderType === "gam") {
    const sizes =
      ad.sizes
        ?.map((s) => (Array.isArray(s) ? s.join("x") : String(s)))
        .join(",") ?? `${size.width}x${size.height}`;

    return (
      <aside
        ref={rootRef}
        className={cn("ad-slot ad-slot--gam flex flex-col items-center", className)}
        aria-label="Advertisement"
      >
        {disclosure}
        <ReserveBox {...size}>
          {inView ? (
            <div
              ref={containerRef}
              id={ad.slotId ?? `ad-${ad.id}`}
              data-ad-provider="gam"
              data-ad-unit={ad.adUnitPath ?? undefined}
              data-ad-sizes={sizes || undefined}
              data-ad-slot={ad.slotId ?? undefined}
              data-ad-targeting={
                targeting || ad.targeting
                  ? JSON.stringify({ ...ad.targeting, ...targeting })
                  : undefined
              }
              className="h-full w-full"
            />
          ) : null}
        </ReserveBox>
      </aside>
    );
  }

  if (renderType === "adsense") {
    return (
      <aside
        ref={rootRef}
        className={cn(
          "ad-slot ad-slot--adsense flex flex-col items-center",
          className,
        )}
        aria-label="Advertisement"
      >
        {disclosure}
        <ReserveBox {...size}>
          {inView ? (
            <ins
              className="adsbygoogle block h-full w-full"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
              }}
              data-ad-client={ad.adUnitPath ?? undefined}
              data-ad-slot={ad.slotId ?? undefined}
              data-ad-width={String(size.width)}
              data-ad-height={String(size.height)}
            />
          ) : null}
        </ReserveBox>
      </aside>
    );
  }

  if (renderType === "js") {
    return (
      <aside
        ref={rootRef}
        className={cn("ad-slot ad-slot--js flex flex-col items-center", className)}
        aria-label="Advertisement"
      >
        {disclosure}
        <ReserveBox {...size}>
          {inView ? (
            <div ref={containerRef} className="h-full w-full" />
          ) : null}
        </ReserveBox>
      </aside>
    );
  }

  if (ad.html) {
    return (
      <aside
        ref={rootRef}
        className={cn(
          "ad-slot ad-slot--html flex flex-col items-center",
          className,
        )}
        aria-label="Advertisement"
      >
        {disclosure}
        <ReserveBox {...size}>
          {inView ? (
            <div
              className="h-full w-full [&_img]:mx-auto [&_img]:h-full [&_img]:max-h-full [&_img]:w-full [&_img]:object-contain [&_>div]:h-full [&_>div]:w-full"
              dangerouslySetInnerHTML={{ __html: ad.html }}
            />
          ) : null}
        </ReserveBox>
      </aside>
    );
  }

  if (ad.imageUrl && ad.clickUrl) {
    return (
      <aside
        ref={rootRef}
        className={cn(
          "ad-slot ad-slot--image flex flex-col items-center",
          className,
        )}
        aria-label="Advertisement"
      >
        {disclosure}
        <ReserveBox {...size}>
          <a
            href={ad.clickUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="relative block h-full w-full"
          >
            <Image
              src={ad.imageUrl}
              alt={ad.name}
              width={size.width}
              height={size.height}
              className="h-full w-full object-contain"
              sizes={`(max-width: 767px) ${size.widthMobile}px, ${size.width}px`}
            />
          </a>
        </ReserveBox>
      </aside>
    );
  }

  return (
    <aside
      ref={rootRef}
      className={cn("ad-slot ad-slot--empty flex flex-col items-center", className)}
      aria-hidden="true"
    >
      <ReserveBox {...size} className="bg-[var(--np-surface)]" />
    </aside>
  );
}
