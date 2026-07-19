import type { Metadata } from "next";
import { themeConfig } from "@/config/theme";
import { absoluteUrl } from "@/utils/urls";
import { defaultSiteLocale, resolveLocale } from "@/utils/locale";
import { pwaMetadataIcons } from "@/utils/pwa-icons";

export interface PageMetadataInput {
  title?: string | null;
  description?: string | null;
  path?: string;
  canonical?: string | null;
  image?: string | null;
  imageAlt?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  favicon?: string | null;
  keywords?: string | string[] | null;
  /** Google News news_keywords meta (comma-separated topics). */
  newsKeywords?: string | string[] | null;
  noIndex?: boolean;
  noFollow?: boolean;
  type?: "website" | "article" | "profile";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: string[] | null;
  section?: string | null;
  tags?: string[] | null;
  siteName?: string | null;
  /** BCP-47 from ENM SEO (e.g. kn-IN). Drives og:locale + alternates. */
  locale?: string | null;
  /** Link rel amphtml absolute URL. */
  ampHtml?: string | null;
}

function resolveKeywords(
  keywords?: string | string[] | null,
): string[] | undefined {
  if (!keywords) {
    return themeConfig.metaKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }
  if (Array.isArray(keywords)) {
    return keywords.filter(Boolean);
  }
  return keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

function resolveNewsKeywords(
  keywords?: string | string[] | null,
): string | undefined {
  if (!keywords) return undefined;
  if (Array.isArray(keywords)) {
    const joined = keywords.filter(Boolean).join(", ");
    return joined || undefined;
  }
  return keywords.trim() || undefined;
}

function buildRobots(noIndex?: boolean, noFollow?: boolean): Metadata["robots"] {
  if (!noIndex && !noFollow) {
    return {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    };
  }

  return {
    index: !noIndex,
    follow: !noFollow,
    googleBot: {
      index: !noIndex,
      follow: !noFollow,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

/**
 * Build Next.js Metadata for generic pages (home, section, static).
 */
export function buildPageMetadata(input: PageMetadataInput = {}): Metadata {
  const siteName = input.siteName?.trim() || themeConfig.siteName;
  const title = input.title?.trim() || siteName;
  const description =
    input.description?.trim() || themeConfig.siteDescription;
  const canonical =
    input.canonical?.trim() ||
    absoluteUrl(input.path ?? "/");
  const image =
    input.image?.trim() ||
    absoluteUrl(themeConfig.logo);
  const imageAlt = input.imageAlt?.trim() || siteName;
  const keywords = resolveKeywords(input.keywords);
  const newsKeywords = resolveNewsKeywords(input.newsKeywords ?? input.tags);
  const locale = resolveLocale(input.locale || defaultSiteLocale().bcp47);

  const fullTitle =
    title === siteName ? siteName : `${title} | ${siteName}`;

  const other: Record<string, string> = {
    language: locale.bcp47,
    "content-language": locale.bcp47,
  };
  if (newsKeywords) {
    other.news_keywords = newsKeywords;
  }
  if (input.ampHtml) {
    other.amphtml = input.ampHtml;
  }

  return {
    title: fullTitle,
    description,
    keywords,
    authors: [{ name: themeConfig.defaultAuthor }],
    creator: themeConfig.defaultAuthor,
    publisher: siteName,
    metadataBase: new URL(themeConfig.siteUrl),
    category: input.section ?? undefined,
    alternates: {
      canonical,
      // Self-referencing hreflang helps Google News / Discover locale targeting.
      languages: {
        [locale.bcp47]: canonical,
        [locale.newsLanguage]: canonical,
        "x-default": canonical,
      },
    },
    robots: buildRobots(input.noIndex, input.noFollow),
    openGraph: {
      type: input.type ?? "website",
      locale: locale.ogLocale,
      url: canonical,
      siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          alt: imageAlt,
          width: input.imageWidth ?? 1200,
          height: input.imageHeight ?? 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
    // Always use sized PNG routes — CMS logos are not 192×192 / 512×512.
    icons: pwaMetadataIcons(),
    other,
  };
}

export interface ArticleMetadataInput extends PageMetadataInput {
  headline: string;
  authors?: string[] | null;
  section?: string | null;
  tags?: string[] | null;
  publishedTime?: string | null;
  modifiedTime?: string | null;
}

/**
 * Build Next.js Metadata for news articles / posts / live blogs / photo essays.
 * Tuned for Google News, Discover, and Top Stories (large image preview + article OG).
 */
export function buildArticleMetadata(input: ArticleMetadataInput): Metadata {
  const authors =
    input.authors?.filter(Boolean) ?? [themeConfig.defaultAuthor];
  const base = buildPageMetadata({
    ...input,
    title: input.title ?? input.headline,
    type: "article",
    newsKeywords: input.newsKeywords ?? input.tags,
  });

  return {
    ...base,
    authors: authors.map((name) => ({ name })),
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: input.publishedTime ?? undefined,
      modifiedTime: input.modifiedTime ?? undefined,
      authors,
      section: input.section ?? undefined,
      tags: input.tags ?? undefined,
    },
    other: {
      ...(typeof base.other === "object" && base.other ? base.other : {}),
      "article:publisher": themeConfig.facebook || themeConfig.siteUrl,
      "googlebot-news": input.noIndex ? "noindex" : "index,follow",
    },
  };
}
