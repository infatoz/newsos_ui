"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  IMAGE_BLUR_DATA_URL,
  getDefaultImagePlaceholder,
  getImageSizes,
  type ImageSizePreset,
} from "@/utils/images";

export type ArticleImageAspect = "16/9" | "16/10" | "4/3" | "1/1" | string;

export interface ArticleImageProps {
  src?: string | null;
  alt: string;
  /** Reserved box aspect ratio — prevents CLS before/while loading. */
  aspectRatio?: ArticleImageAspect;
  /** next/image sizes preset when using fill. */
  preset?: ImageSizePreset;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  /** Site placeholder when src is empty. */
  placeholderUrl?: string | null;
  /** Force treating src as the placeholder (skip blur photo treatment). */
  isPlaceholder?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}

function isSvgOrData(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.startsWith("data:image/svg") ||
    lower.includes(".svg") ||
    lower.startsWith("data:")
  );
}

/**
 * CLS-safe image: reserved aspect-ratio box + shimmer while lazy-loading.
 * Falls back to the configured SVG placeholder when there is no photo.
 */
export function ArticleImage({
  src,
  alt,
  aspectRatio = "16/9",
  preset = "card",
  sizes: sizesProp,
  priority = false,
  className,
  imgClassName,
  placeholderUrl,
  isPlaceholder: isPlaceholderProp,
  fill = true,
  width,
  height,
}: ArticleImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const placeholder =
    placeholderUrl?.trim() || getDefaultImagePlaceholder();
  const hasRealSrc = Boolean(src?.trim()) && !failed;
  const rawSrc = hasRealSrc ? src!.trim() : placeholder;
  const isPlaceholder =
    Boolean(isPlaceholderProp) || !hasRealSrc || rawSrc === placeholder;
  const useUnoptimized = isSvgOrData(rawSrc);

  const sized = getImageSizes(isPlaceholder ? null : rawSrc, preset);
  const displaySrc = isPlaceholder ? rawSrc : sized.src;
  const sizes = sizesProp || sized.sizes;

  // Priority / LCP images must never start at opacity-0 — Chrome ignores
  // invisible images for LCP until they become opaque (often after hydration).
  const showImmediately = priority || isPlaceholder;
  const isVisible = showImmediately || loaded;

  return (
    <span
      className={cn(
        "np-article-image relative block overflow-hidden bg-[var(--np-border)]",
        className,
      )}
      style={
        aspectRatio && aspectRatio !== "auto"
          ? { aspectRatio }
          : undefined
      }
      data-placeholder={isPlaceholder ? "true" : undefined}
    >
      {/* Shimmer — skip for priority so it never covers the LCP element */}
      {!showImmediately ? (
        <span
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            "np-image-shimmer",
            loaded && !isPlaceholder
              ? "opacity-0 pointer-events-none"
              : "opacity-100",
          )}
          aria-hidden
        />
      ) : null}

      {fill ? (
        <Image
          src={displaySrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          fetchPriority={priority ? "high" : undefined}
          unoptimized={useUnoptimized}
          placeholder={
            useUnoptimized || isPlaceholder || priority ? "empty" : "blur"
          }
          blurDataURL={
            useUnoptimized || isPlaceholder || priority
              ? undefined
              : IMAGE_BLUR_DATA_URL
          }
          className={cn(
            "object-cover",
            !showImmediately && "transition-opacity duration-300",
            isVisible ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
        />
      ) : (
        <Image
          src={displaySrc}
          alt={alt}
          width={width || sized.width}
          height={height || sized.height || Math.round((sized.width * 9) / 16)}
          sizes={sizes}
          priority={priority}
          fetchPriority={priority ? "high" : undefined}
          unoptimized={useUnoptimized}
          placeholder={
            useUnoptimized || isPlaceholder || priority ? "empty" : "blur"
          }
          blurDataURL={
            useUnoptimized || isPlaceholder || priority
              ? undefined
              : IMAGE_BLUR_DATA_URL
          }
          className={cn(
            "h-full w-full object-cover",
            !showImmediately && "transition-opacity duration-300",
            isVisible ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
        />
      )}
    </span>
  );
}

/** Re-export for callers that need ImageProps-compatible typing. */
export type { ImageProps };
