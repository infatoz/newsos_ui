import { themeConfig } from "@/config/theme";
import { absoluteUrl } from "@/utils/urls";

export interface CdnImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "jpg" | "png" | "auto";
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

/**
 * Resolve an image URL through the CDN when configured.
 * Without a CDN, returns a clean absolute URL (no fake transform query params —
 * those break WordPress media + Next.js `/_next/image`).
 */
export function cdnImageUrl(
  source?: string | null,
  options: CdnImageOptions = {},
): string {
  if (!source) {
    return absoluteUrl(themeConfig.logo);
  }

  if (source.startsWith("data:") || source.startsWith("blob:")) {
    return source;
  }

  const absolute = absoluteUrl(source);
  const cdnBase = themeConfig.cdnUrl?.replace(/\/$/, "");

  // No CDN: pass through clean WordPress / absolute URLs for next/image.
  if (!cdnBase) {
    try {
      const parsed = new URL(absolute);
      parsed.search = "";
      return parsed.toString();
    } catch {
      return absolute.split("?")[0] ?? absolute;
    }
  }

  let url = absolute;
  try {
    const parsed = new URL(absolute);
    const siteHost = new URL(themeConfig.siteUrl).host;
    // Rewrite WordPress / site media hosts onto CDN origin
    if (
      parsed.host === siteHost ||
      parsed.hostname.includes("localhost") ||
      parsed.pathname.includes("/wp-content/")
    ) {
      url = `${cdnBase}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    url = absolute;
  }

  const params = new URLSearchParams();
  if (options.width) params.set("w", String(options.width));
  if (options.height) params.set("h", String(options.height));
  if (options.quality) params.set("q", String(options.quality));
  if (options.format && options.format !== "auto") {
    params.set("fm", options.format);
  }
  if (options.fit) params.set("fit", options.fit);

  const qs = params.toString();
  if (!qs) return url;

  return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
}

export type ImageSizePreset =
  | "thumbnail"
  | "card"
  | "hero"
  | "og"
  | "full"
  | "avatar";

const SIZE_PRESETS: Record<
  ImageSizePreset,
  { width: number; height?: number; sizes: string }
> = {
  thumbnail: {
    width: 150,
    height: 150,
    sizes: "150px",
  },
  card: {
    width: 640,
    height: 360,
    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  },
  hero: {
    width: 1280,
    height: 720,
    // Homepage/article heroes sit in max-w-7xl (~1280px); often ~2/3 width on lg.
    sizes: "(max-width: 1024px) 100vw, (max-width: 1280px) 66vw, 854px",
  },
  og: {
    width: 1200,
    height: 630,
    sizes: "1200px",
  },
  full: {
    width: 1920,
    sizes: "100vw",
  },
  avatar: {
    width: 96,
    height: 96,
    sizes: "96px",
  },
};

export interface ImageSizesResult {
  width: number;
  height?: number;
  sizes: string;
  src: string;
}

/**
 * Get responsive `sizes` attribute and preferred dimensions for news imagery.
 */
export function getImageSizes(
  source: string | null | undefined,
  preset: ImageSizePreset = "card",
  overrides: Partial<CdnImageOptions> = {},
): ImageSizesResult {
  const config = SIZE_PRESETS[preset];
  const width = overrides.width ?? config.width;
  const height = overrides.height ?? config.height;

  return {
    width,
    height,
    sizes: config.sizes,
    src: cdnImageUrl(source, {
      width,
      height,
      quality: overrides.quality ?? 75,
      format: overrides.format ?? "auto",
      fit: overrides.fit ?? "cover",
    }),
  };
}

/** Build a simple srcSet for a few widths. */
export function buildSrcSet(
  source: string | null | undefined,
  widths: number[] = [320, 640, 960, 1280],
): string {
  return widths
    .map((w) => `${cdnImageUrl(source, { width: w, format: "auto" })} ${w}w`)
    .join(", ");
}

/** Tiny gray blur used by next/image while the real photo loads (CLS-safe). */
export const IMAGE_BLUR_DATA_URL =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9" viewBox="0 0 16 9"><rect width="16" height="9" fill="%23e5e7eb"/></svg>`,
  );

/**
 * Sync default placeholder (env / public SVG). Prefer branding.imagePlaceholder
 * when available from getSiteBranding().
 */
export function getDefaultImagePlaceholder(): string {
  return themeConfig.imagePlaceholder || "/image-placeholder.svg";
}

export function resolveImagePlaceholder(
  override?: string | null,
): string {
  const value = override?.trim();
  if (value) return value.startsWith("data:") ? value : absoluteUrl(value);
  const fallback = getDefaultImagePlaceholder();
  return fallback.startsWith("data:") || fallback.startsWith("/")
    ? fallback.startsWith("data:")
      ? fallback
      : absoluteUrl(fallback)
    : absoluteUrl(fallback);
}

/** First <img src> in HTML content, if any. */
export function extractFirstContentImageUrl(
  html?: string | null,
): string | null {
  if (!html) return null;
  const match =
    /<img\b[^>]*\bsrc=["']([^"']+)["']/i.exec(html) ||
    /<img\b[^>]*\bdata-src=["']([^"']+)["']/i.exec(html);
  const src = match?.[1]?.trim();
  if (!src || src.startsWith("data:")) return null;
  return src;
}

export interface ResolvedArticleImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** True when using the site placeholder (no real photo). */
  isPlaceholder: boolean;
  /** Plain-text caption for the hero figure, when available. */
  caption?: string | null;
}

/**
 * Featured → first in-content image → configured SVG placeholder.
 */
export function resolveArticleDisplayImage(input: {
  featuredUrl?: string | null;
  featuredAlt?: string | null;
  featuredWidth?: number | null;
  featuredHeight?: number | null;
  featuredCaption?: string | null;
  contentHtml?: string | null;
  title?: string | null;
  placeholderUrl?: string | null;
}): ResolvedArticleImage {
  if (input.featuredUrl?.trim()) {
    return {
      src: input.featuredUrl.trim(),
      alt: input.featuredAlt?.trim() || input.title || "",
      width: input.featuredWidth ?? undefined,
      height: input.featuredHeight ?? undefined,
      isPlaceholder: false,
      caption: input.featuredCaption ?? null,
    };
  }

  const fromContent = extractFirstContentImageUrl(input.contentHtml);
  if (fromContent) {
    return {
      src: fromContent,
      alt: input.title || "",
      width: 1200,
      height: 675,
      isPlaceholder: false,
      caption: null,
    };
  }

  return {
    src: resolveImagePlaceholder(input.placeholderUrl),
    alt: input.title || "Image placeholder",
    width: 1200,
    height: 675,
    isPlaceholder: true,
    caption: null,
  };
}

/**
 * Prepare article HTML images for CLS-safe lazy loading:
 * loading=lazy, decoding=async, width/height or aspect-ratio, placeholder bg class.
 */
export function enhanceArticleBodyImages(html: string): string {
  if (!html || !html.includes("<img")) return html;

  return html.replace(/<img\b([^>]*?)>/gi, (_full, attrs: string) => {
    let next = attrs;

    if (!/\bloading\s*=/i.test(next)) {
      next += ` loading="lazy"`;
    }
    if (!/\bdecoding\s*=/i.test(next)) {
      next += ` decoding="async"`;
    }

    const width = /(?:^|\s)width=["']?(\d+)/i.exec(next)?.[1];
    const height = /(?:^|\s)height=["']?(\d+)/i.exec(next)?.[1];
    const styleMatch = /\bstyle=["']([^"']*)["']/i.exec(next);
    let style = styleMatch?.[1] ?? "";

    if (width && height && !/aspect-ratio/i.test(style)) {
      style = `${style};aspect-ratio:${width}/${height};width:100%;height:auto;background:var(--np-border)`.replace(
        /^;/,
        "",
      );
    } else if (!/aspect-ratio/i.test(style) && !width) {
      // Reserve a reasonable box when WP omitted dimensions (reduces CLS).
      style = `${style};aspect-ratio:16/9;width:100%;height:auto;object-fit:cover;background:var(--np-border) var(--np-image-placeholder) center / cover no-repeat`.replace(
        /^;/,
        "",
      );
    }

    if (style) {
      if (styleMatch) {
        next = next.replace(styleMatch[0], `style="${style}"`);
      } else {
        next += ` style="${style}"`;
      }
    }

    if (!/\bclass=["']/i.test(next)) {
      next += ` class="np-lazy-img"`;
    } else if (!/\bnp-lazy-img\b/.test(next)) {
      next = next.replace(
        /\bclass=["']([^"']*)["']/i,
        (_m, cls: string) => `class="${cls} np-lazy-img"`,
      );
    }

    return `<img${next}>`;
  });
}
