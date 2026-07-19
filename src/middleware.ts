import { NextResponse, type NextRequest } from "next/server";
import { encodeSlugForPath, safeDecodeSlug } from "@/utils/slug";

export const PREVIEW_COOKIE = "np_preview";
export const PREVIEW_SECRET_HEADER = "x-np-preview-secret";

/** First path segments reserved by the Next.js app (not WP category/post permalinks). */
const RESERVED_ROOT = new Set([
  "article",
  "category",
  "tag",
  "author",
  "amp",
  "api",
  "icons",
  "stories",
  "videos",
  "photos",
  "shorts",
  "page",
  "search",
  "poll",
  "live-blog",
  "sitemaps",
  "sitemap.xml",
  "news-sitemap.xml",
  "ads.txt",
  "app-ads.txt",
  "robots.txt",
  "llms.txt",
  "llms-full.txt",
  "feed.xml",
  "manifest.webmanifest",
  "publisher-logo",
  "publisher-logo.png",
  "_next",
  ".well-known",
  "favicon.ico",
]);

/**
 * Trailing `/amp` → internal AMP article route (URL bar unchanged).
 * e.g. /india/my-headline/amp → /amp/article/my-headline
 *      /article/my-headline/amp → /amp/article/my-headline
 */
function ampPermalinkRewrite(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!pathname || pathname === "/") return null;

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  if (parts[parts.length - 1].toLowerCase() !== "amp") return null;

  const slugPart = parts[parts.length - 2];
  if (!slugPart || slugPart.toLowerCase() === "amp") return null;
  // Keep Web Stories AMP at /amp/stories/{slug}
  if (parts[0]?.toLowerCase() === "amp" && parts[1]?.toLowerCase() === "stories") {
    return null;
  }

  const decoded = safeDecodeSlug(slugPart);
  const url = request.nextUrl.clone();
  url.pathname = `/amp/article/${encodeSlugForPath(decoded)}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-np-pathname", pathname);

  return NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  });
}

/**
 * Keep meaningful WordPress permalinks in the browser
 * (e.g. /india/my-headline/) while internally serving the article page.
 */
function wordpressPermalinkRewrite(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!pathname || pathname === "/") return null;

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  const root = parts[0].toLowerCase();

  // Legacy /article/{slug} stays as a real route (page may 301 to WP uri).
  // /article/{slug}/amp is handled by ampPermalinkRewrite.
  if (root === "article") {
    return null;
  }

  // /{category}/{slug}/… → rewrite to /article/{slug} (URL bar unchanged)
  if (parts.length >= 2 && !RESERVED_ROOT.has(root)) {
    const slugPart = parts[parts.length - 1];
    if (/^page-\d+$/i.test(slugPart) || /^\d+$/.test(slugPart)) {
      return null;
    }
    const decoded = safeDecodeSlug(slugPart);
    const url = request.nextUrl.clone();
    url.pathname = `/article/${encodeSlugForPath(decoded)}`;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-np-pathname", pathname);

    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  return null;
}

/**
 * Next.js 16 prefers `proxy.ts`, but `middleware.ts` remains supported.
 * Handles security headers, preview cookies, and WP permalink rewrites.
 */
export function middleware(request: NextRequest) {
  const ampRewritten = ampPermalinkRewrite(request);
  if (ampRewritten) {
    ampRewritten.headers.set("X-Frame-Options", "SAMEORIGIN");
    ampRewritten.headers.set("X-Content-Type-Options", "nosniff");
    ampRewritten.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return ampRewritten;
  }

  const rewritten = wordpressPermalinkRewrite(request);
  if (rewritten) {
    // Still attach security headers on rewrites.
    rewritten.headers.set("X-Frame-Options", "SAMEORIGIN");
    rewritten.headers.set("X-Content-Type-Options", "nosniff");
    rewritten.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return rewritten;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-np-pathname", request.nextUrl.pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  const { pathname, searchParams } = request.nextUrl;

  const previewFlag = searchParams.get("preview");
  const previewSecret = searchParams.get("secret");
  const envSecret = process.env.PREVIEW_SECRET;

  if (previewFlag === "true" && previewSecret && envSecret) {
    if (previewSecret === envSecret) {
      response.cookies.set(PREVIEW_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60,
      });
      response.headers.set(PREVIEW_SECRET_HEADER, "1");
    }
  }

  if (searchParams.get("preview") === "false") {
    response.cookies.delete(PREVIEW_COOKIE);
  }

  if (request.cookies.get(PREVIEW_COOKIE)?.value === "1") {
    response.headers.set("x-np-is-preview", "1");
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$/)
  ) {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
