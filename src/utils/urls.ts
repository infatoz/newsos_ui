import { themeConfig } from "@/config/theme";
import { encodeSlugForPath } from "@/utils/slug";

/**
 * Build an absolute URL from a path or return the input if already absolute.
 */
export function absoluteUrl(pathOrUrl = "/"): string {
  if (!pathOrUrl) {
    return themeConfig.siteUrl.replace(/\/$/, "");
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  if (pathOrUrl.startsWith("//")) {
    const protocol = themeConfig.siteUrl.startsWith("https") ? "https:" : "http:";
    return `${protocol}${pathOrUrl}`;
  }

  const base = themeConfig.siteUrl.replace(/\/$/, "");
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

/** Join site path segments safely. */
export function joinSitePath(...segments: string[]): string {
  const cleaned = segments
    .filter(Boolean)
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);
  return `/${cleaned.join("/")}`;
}

/**
 * Prefer WordPress GraphQL `uri` for public links (e.g. /india/my-story/).
 * Falls back to /article/{slug} only when URI is missing.
 */
export function contentPath(
  uri?: string | null,
  slug?: string | null,
): string {
  if (uri?.trim()) {
    let path = uri.trim();
    if (/^https?:\/\//i.test(path) || path.startsWith("//")) {
      try {
        path = new URL(path, themeConfig.siteUrl).pathname;
      } catch {
        // keep as-is
      }
    }
    if (!path.startsWith("/")) path = `/${path}`;
    return path;
  }
  if (slug?.trim()) {
    return `/article/${encodeSlugForPath(slug)}`;
  }
  return "/";
}

/** Normalize paths for comparison (ignore trailing slash). */
export function pathsEqual(a: string, b: string): boolean {
  const norm = (p: string) => p.replace(/\/+$/, "") || "/";
  return norm(a) === norm(b);
}

/**
 * AMP article path: append `/amp` to the canonical article path.
 * e.g. `/india/my-story/` → `/india/my-story/amp`
 */
export function ampArticlePath(canonicalPath: string): string {
  const trimmed = (canonicalPath || "/").trim();
  const base = trimmed.replace(/\/+$/, "") || "";
  if (!base || base === "/") return "/amp";
  if (/\/amp$/i.test(base)) return base;
  return `${base}/amp`;
}

/** Article canonical path helper. */
export function articlePath(slug: string, categorySlug?: string): string {
  if (categorySlug) {
    return joinSitePath(categorySlug, slug);
  }
  return joinSitePath(slug);
}

/** Extract pathname from a full URL or path. */
export function getPathname(urlOrPath: string): string {
  try {
    if (/^https?:\/\//i.test(urlOrPath)) {
      return new URL(urlOrPath).pathname;
    }
  } catch {
    // fall through
  }
  return urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;
}

/** Ensure trailing slash (or not) consistently. */
export function withTrailingSlash(url: string, enabled = false): string {
  if (!enabled) {
    return url.replace(/\/+$/, "") || "/";
  }
  if (url.endsWith("/")) return url;
  return `${url}/`;
}
