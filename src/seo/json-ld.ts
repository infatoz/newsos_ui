import { themeConfig } from "@/config/theme";
import { absoluteUrl } from "@/utils/urls";
import { defaultSiteLocale, resolveLocale } from "@/utils/locale";

export type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

/** Google Top Stories truncates long headlines; keep ≤110 chars. */
export const HEADLINE_MAX_CHARS = 110;

export function stripNulls<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      result[key] = value.filter((v) => v !== undefined && v !== null);
      continue;
    }
    result[key] = value;
  }
  return result as T;
}

export function schemaLanguage(locale?: string | null): string {
  return resolveLocale(locale || defaultSiteLocale().bcp47).bcp47;
}

/** Always emit ISO-8601 with timezone (Z) — required for reliable News dating. */
export function ensureIsoDate(value?: string | null, fallback?: string | null): string {
  const candidates = [value, fallback].filter(Boolean) as string[];
  for (const raw of candidates) {
    let trimmed = raw.trim();
    if (!trimmed) continue;

    // WordPress: "YYYY-MM-DD HH:MM:SS" → ISO local form
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(trimmed)) {
      trimmed = trimmed.replace(" ", "T");
    }

    // WPGraphQL dateGmt often omits timezone — treat as UTC
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(trimmed)) {
      trimmed = `${trimmed}Z`;
    }

    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function isPrivateOrLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return true;
  }
  if (/^10\.\d+\.\d+\.\d+$/.test(host)) return true;
  if (/^192\.168\.\d+\.\d+$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host)) return true;
  return false;
}

/**
 * Absolute media URL for JSON-LD / microdata.
 * Rewrites localhost/private WP hosts onto CDN or NEXT_PUBLIC_SCHEMA_ORIGIN
 * so Rich Results tests do not flag uncrawlable image URLs.
 */
export function schemaMediaUrl(url?: string | null): string {
  const fallback = absoluteUrl(themeConfig.logo);
  if (!url?.trim()) return fallback;

  let abs = absoluteUrl(url.trim());
  try {
    const parsed = new URL(abs);
    const cdn = themeConfig.cdnUrl?.replace(/\/$/, "") || "";
    const schemaOrigin = (
      process.env.NEXT_PUBLIC_SCHEMA_ORIGIN || ""
    ).trim().replace(/\/$/, "");

    if (cdn && parsed.pathname.includes("/wp-content/")) {
      return `${cdn}${parsed.pathname}${parsed.search}`;
    }

    if (schemaOrigin && isPrivateOrLocalHostname(parsed.hostname)) {
      const publicBase = new URL(schemaOrigin);
      parsed.protocol = publicBase.protocol;
      parsed.host = publicBase.host;
      return parsed.toString();
    }

    // Prefer the public site origin over bare WP localhost when both are local
    // and the site URL uses a different host/port (e.g. :3000 vs Laragon).
    if (isPrivateOrLocalHostname(parsed.hostname)) {
      const site = new URL(themeConfig.siteUrl);
      if (
        parsed.host !== site.host &&
        !isPrivateOrLocalHostname(site.hostname)
      ) {
        parsed.protocol = site.protocol;
        parsed.host = site.host;
        return parsed.toString();
      }
    }

    return parsed.toString();
  } catch {
    return abs;
  }
}

export function truncateHeadline(
  headline: string,
  max = HEADLINE_MAX_CHARS,
): string {
  const t = headline.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export type SchemaImageInput =
  | string
  | {
      url: string;
      width?: number | null;
      height?: number | null;
      caption?: string | null;
      alt?: string | null;
    };

export function toImageObject(input: SchemaImageInput): Record<string, unknown> {
  if (typeof input === "string") {
    const url = schemaMediaUrl(input);
    return stripNulls({
      "@type": "ImageObject",
      url,
      contentUrl: url,
    });
  }
  const url = schemaMediaUrl(input.url);
  return stripNulls({
    "@type": "ImageObject",
    url,
    contentUrl: url,
    width: input.width ?? undefined,
    height: input.height ?? undefined,
    caption: input.caption ?? input.alt ?? undefined,
    name: input.alt ?? undefined,
  });
}

/**
 * Build image list for Article / NewsArticle.
 * Google recommends high-res images; when only one URL exists, still emit ImageObject.
 */
export function buildArticleImages(
  images?: SchemaImageInput | SchemaImageInput[] | null,
  fallbackUrl?: string | null,
): Record<string, unknown>[] {
  const list = (Array.isArray(images) ? images : images ? [images] : [])
    .map((img) => {
      if (typeof img === "string") return img.trim() ? toImageObject(img) : null;
      return img?.url?.trim() ? toImageObject(img) : null;
    })
    .filter(Boolean) as Record<string, unknown>[];

  if (list.length > 0) return list;

  const fb = schemaMediaUrl(fallbackUrl || themeConfig.logo);
  return [
    stripNulls({
      "@type": "ImageObject",
      url: fb,
      contentUrl: fb,
      width: 1200,
      height: 675,
    }),
  ];
}

export function publisherOrganization(input?: {
  name?: string | null;
  logoUrl?: string | null;
  url?: string | null;
}): Record<string, unknown> {
  const logo = schemaMediaUrl(input?.logoUrl || themeConfig.logo);
  return stripNulls({
    "@type": "NewsMediaOrganization",
    name: input?.name?.trim() || themeConfig.siteName,
    url: input?.url?.trim() || themeConfig.siteUrl,
    logo: {
      "@type": "ImageObject",
      url: logo,
      contentUrl: logo,
      width: 600,
      height: 60,
    },
  });
}

export function personAuthor(input: {
  name?: string | string[] | null;
  url?: string | null;
}): Record<string, unknown>[] {
  const names = (
    Array.isArray(input.name)
      ? input.name
      : [input.name ?? themeConfig.defaultAuthor]
  ).filter(Boolean) as string[];

  return names.map((name) =>
    stripNulls({
      "@type": "Person",
      name,
      url: input.url ?? undefined,
    }),
  );
}

export function organizationJsonLd(overrides: Record<string, unknown> = {}) {
  // Language belongs on ContactPoint (availableLanguage) and Organization
  // (knowsLanguage) — never as availableLanguage on NewsMediaOrganization.
  const {
    inLanguage: inLanguageOverride,
    availableLanguage: availableLanguageOverride,
    knowsLanguage: knowsLanguageOverride,
    ...rest
  } = overrides;

  const lang = schemaLanguage(
    typeof knowsLanguageOverride === "string"
      ? knowsLanguageOverride
      : typeof inLanguageOverride === "string"
        ? inLanguageOverride
        : typeof availableLanguageOverride === "string"
          ? availableLanguageOverride
          : null,
  );

  return stripNulls({
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: themeConfig.siteName,
    url: themeConfig.siteUrl,
    logo: {
      "@type": "ImageObject",
      url: schemaMediaUrl(themeConfig.logo),
      width: 600,
      height: 60,
    },
    sameAs: [
      themeConfig.facebook,
      themeConfig.x,
      themeConfig.instagram,
      themeConfig.youtube,
      themeConfig.linkedin,
    ].filter(Boolean),
    knowsLanguage: lang,
    contactPoint: {
      "@type": "ContactPoint",
      email: themeConfig.contactEmail,
      telephone: themeConfig.phone,
      contactType: "editorial",
      areaServed: themeConfig.country,
      availableLanguage: lang,
    },
    ...rest,
  });
}

export function websiteJsonLd(overrides: Record<string, unknown> = {}) {
  const { inLanguage: inLanguageOverride, ...rest } = overrides;
  const lang = schemaLanguage(
    typeof inLanguageOverride === "string" ? inLanguageOverride : null,
  );
  return stripNulls({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: themeConfig.siteName,
    url: themeConfig.siteUrl,
    description: themeConfig.siteDescription,
    inLanguage: lang,
    publisher: publisherOrganization(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${themeConfig.siteUrl.replace(/\/$/, "")}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    ...rest,
  });
}

export interface NewsArticleJsonLdInput {
  headline: string;
  description?: string | null;
  url: string;
  image?: SchemaImageInput | SchemaImageInput[] | null;
  datePublished: string;
  dateModified?: string | null;
  authorName?: string | string[] | null;
  authorUrl?: string | null;
  section?: string | null;
  keywords?: string[] | null;
  wordCount?: number | null;
  articleBody?: string | null;
  isAccessibleForFree?: boolean;
  publisherName?: string | null;
  publisherLogoUrl?: string | null;
  inLanguage?: string | null;
  /** Optional subtype e.g. ReportageNewsArticle — keep NewsArticle for Top Stories. */
  articleType?: "NewsArticle" | "Article" | "BlogPosting";
}

export function newsArticleJsonLd(input: NewsArticleJsonLdInput) {
  const datePublished = ensureIsoDate(input.datePublished);
  const dateModified = ensureIsoDate(input.dateModified, datePublished);
  const images = buildArticleImages(input.image, input.publisherLogoUrl);

  return stripNulls({
    "@context": "https://schema.org",
    "@type": input.articleType ?? "NewsArticle",
    headline: truncateHeadline(input.headline),
    description: input.description?.trim() || undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
      url: input.url,
    },
    url: input.url,
    image: images,
    datePublished,
    dateModified,
    author: personAuthor({
      name: input.authorName,
      url: input.authorUrl,
    }),
    publisher: publisherOrganization({
      name: input.publisherName,
      logoUrl: input.publisherLogoUrl,
    }),
    articleSection: input.section ?? undefined,
    keywords: input.keywords?.filter(Boolean).join(", ") || undefined,
    wordCount: input.wordCount ?? undefined,
    articleBody: input.articleBody ?? undefined,
    isAccessibleForFree: input.isAccessibleForFree ?? true,
    inLanguage: schemaLanguage(input.inLanguage),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [
        "[itemprop=headline]",
        "[itemprop=description]",
        "[data-speakable]",
        "h1",
      ],
    },
  });
}

export interface LiveBlogPostingJsonLdInput {
  headline: string;
  description?: string | null;
  url: string;
  image?: SchemaImageInput | SchemaImageInput[] | null;
  datePublished: string;
  dateModified?: string | null;
  coverageStartTime: string;
  /**
   * Required by Google for LiveBlogPosting rich results.
   * If still live, pass a future end (e.g. start + 24h) and refresh as coverage continues.
   */
  coverageEndTime?: string | null;
  /** When true and coverageEndTime is missing, end is set to start + 24 hours. */
  isLive?: boolean;
  authorName?: string | null;
  authorUrl?: string | null;
  publisherName?: string | null;
  publisherLogoUrl?: string | null;
  inLanguage?: string | null;
  updates?: Array<{
    headline?: string | null;
    articleBody: string;
    datePublished: string;
    dateModified?: string | null;
    url?: string | null;
    image?: SchemaImageInput | null;
    authorName?: string | null;
    authorUrl?: string | null;
  }>;
  /** Section / vertical label, e.g. "Live". */
  articleSection?: string | null;
  /** Topic keywords for the coverage. */
  keywords?: string[] | null;
  /** Optional about / topic entity. */
  about?: string | null;
}

/**
 * LiveBlogPosting JSON-LD aligned with Google Rich Results expectations.
 * @see https://schema.org/LiveBlogPosting
 *
 * Google requires: coverageStartTime, coverageEndTime, and ≥1 liveBlogUpdate
 * with headline + datePublished + articleBody (ISO-8601 with timezone).
 */
export function liveBlogPostingJsonLd(input: LiveBlogPostingJsonLdInput) {
  const datePublished = ensureIsoDate(input.datePublished);
  const coverageStartTime = ensureIsoDate(input.coverageStartTime, datePublished);

  const rawUpdates = (input.updates ?? [])
    .map((update, index) => {
      const body = (update.articleBody || "").replace(/\s+/g, " ").trim();
      const headline = (update.headline || "").replace(/\s+/g, " ").trim();
      if (!body && !headline) return null;
      const published = ensureIsoDate(update.datePublished, datePublished);
      return {
        headline: truncateHeadline(headline || `Update ${index + 1}`),
        articleBody: body || headline || `Update ${index + 1}`,
        datePublished: published,
        dateModified: ensureIsoDate(update.dateModified, published),
        url: update.url || `${input.url}#update-${index + 1}`,
        image: update.image ?? null,
        authorName: update.authorName ?? null,
        authorUrl: update.authorUrl ?? null,
      };
    })
    .filter(Boolean) as Array<{
    headline: string;
    articleBody: string;
    datePublished: string;
    dateModified: string;
    url: string;
    image: SchemaImageInput | null;
    authorName: string | null;
    authorUrl: string | null;
  }>;

  // Guaranteed ≥1 update — empty live blogs still need a seed entry for RRT.
  const updates =
    rawUpdates.length > 0
      ? rawUpdates
      : [
          {
            headline: truncateHeadline(input.headline),
            articleBody:
              input.description?.trim() ||
              truncateHeadline(input.headline) ||
              "Live coverage",
            datePublished,
            dateModified: datePublished,
            url: `${input.url}#coverage-start`,
            image: null as SchemaImageInput | null,
            authorName: null as string | null,
            authorUrl: null as string | null,
          },
        ];

  const latestUpdate = updates.reduce(
    (latest, u) => (u.datePublished > latest ? u.datePublished : latest),
    updates[0].datePublished,
  );

  const dateModified = ensureIsoDate(
    input.dateModified || latestUpdate,
    datePublished,
  );

  // Google RRT treats coverageEndTime as required for LiveBlogPosting.
  let coverageEndTime: string;
  if (input.coverageEndTime) {
    coverageEndTime = ensureIsoDate(input.coverageEndTime);
  } else if (input.isLive !== false) {
    // Ongoing coverage: project 24h ahead of the latest update (or start).
    const startMs = Date.parse(latestUpdate || coverageStartTime);
    coverageEndTime = new Date(startMs + 24 * 60 * 60 * 1000).toISOString();
  } else {
    coverageEndTime = ensureIsoDate(latestUpdate, dateModified);
  }

  const authorName =
    (typeof input.authorName === "string" && input.authorName.trim()) ||
    themeConfig.defaultAuthor;
  const author = stripNulls({
    "@type": "Person",
    name: authorName,
    url: input.authorUrl ?? undefined,
  });

  const description =
    input.description?.trim() || truncateHeadline(input.headline);

  // Avoid SVG logos as the primary article image (Google Images / RRT issues).
  const images = buildArticleImages(
    input.image,
    preferRasterUrl(input.publisherLogoUrl) || preferRasterUrl(themeConfig.logo),
  );

  return stripNulls({
    "@context": "https://schema.org",
    "@type": "LiveBlogPosting",
    headline: truncateHeadline(input.headline),
    description,
    url: input.url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
      url: input.url,
    },
    image: images,
    datePublished,
    dateModified,
    coverageStartTime,
    coverageEndTime,
    articleSection: input.articleSection?.trim() || "Live",
    keywords:
      input.keywords?.filter(Boolean).join(", ") ||
      "live blog, live coverage, breaking news",
    about: input.about?.trim()
      ? {
          "@type": "Thing",
          name: input.about.trim(),
        }
      : {
          "@type": "Thing",
          name: truncateHeadline(input.headline),
        },
    inLanguage: schemaLanguage(input.inLanguage),
    author,
    publisher: publisherOrganization({
      name: input.publisherName,
      logoUrl: preferRasterUrl(input.publisherLogoUrl) || input.publisherLogoUrl,
    }),
    isAccessibleForFree: true,
    liveBlogUpdate: updates.map((update) => {
      const updateAuthor =
        typeof update.authorName === "string" && update.authorName.trim()
          ? stripNulls({
              "@type": "Person",
              name: update.authorName.trim(),
              url: update.authorUrl ?? undefined,
            })
          : author;
      return stripNulls({
        "@type": "BlogPosting",
        headline: update.headline,
        articleBody: update.articleBody,
        datePublished: update.datePublished,
        dateModified: update.dateModified,
        url: update.url,
        image: update.image ? toImageObject(update.image) : images[0],
        author: updateAuthor,
        publisher: publisherOrganization({
          name: input.publisherName,
          logoUrl:
            preferRasterUrl(input.publisherLogoUrl) || input.publisherLogoUrl,
        }),
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": update.url || input.url,
        },
        inLanguage: schemaLanguage(input.inLanguage),
        isPartOf: {
          "@type": "LiveBlogPosting",
          "@id": input.url,
          headline: truncateHeadline(input.headline),
        },
      });
    }),
  });
}

/** Prefer PNG/JPG/WebP over SVG for Google structured-data images. */
function preferRasterUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const lower = url.toLowerCase();
  if (lower.includes(".svg") || lower.endsWith("svg")) return null;
  return url.trim();
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface PersonJsonLdInput {
  name: string;
  url?: string | null;
  image?: string | null;
  description?: string | null;
  jobTitle?: string | null;
  sameAs?: string[] | null;
  email?: string | null;
}

export function personJsonLd(input: PersonJsonLdInput) {
  return stripNulls({
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    url: input.url ?? undefined,
    image: input.image ?? undefined,
    description: input.description ?? undefined,
    jobTitle: input.jobTitle ?? "Journalist",
    worksFor: publisherOrganization(),
    sameAs: input.sameAs ?? undefined,
    email: input.email ?? undefined,
  });
}

export interface VideoObjectJsonLdInput {
  name: string;
  description?: string | null;
  thumbnailUrl: string | string[];
  uploadDate: string;
  contentUrl?: string | null;
  embedUrl?: string | null;
  duration?: string | null;
  url?: string | null;
  publisherName?: string | null;
  publisherLogoUrl?: string | null;
  inLanguage?: string | null;
  isFamilyFriendly?: boolean;
}

export function videoObjectJsonLd(input: VideoObjectJsonLdInput) {
  const thumbs = Array.isArray(input.thumbnailUrl)
    ? input.thumbnailUrl.filter(Boolean)
    : [input.thumbnailUrl].filter(Boolean);

  return stripNulls({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: truncateHeadline(input.name),
    description: input.description?.trim() || truncateHeadline(input.name),
    thumbnailUrl: thumbs,
    uploadDate: ensureIsoDate(input.uploadDate),
    contentUrl: input.contentUrl ?? undefined,
    embedUrl: input.embedUrl ?? undefined,
    duration: input.duration ?? undefined,
    url: input.url ?? undefined,
    mainEntityOfPage: input.url
      ? { "@type": "WebPage", "@id": input.url, url: input.url }
      : undefined,
    inLanguage: schemaLanguage(input.inLanguage),
    isFamilyFriendly: input.isFamilyFriendly ?? true,
    publisher: publisherOrganization({
      name: input.publisherName,
      logoUrl: input.publisherLogoUrl,
    }),
  });
}

export interface ImageObjectJsonLdInput {
  url: string;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  creditText?: string | null;
  contentUrl?: string | null;
}

export function imageObjectJsonLd(input: ImageObjectJsonLdInput) {
  return stripNulls({
    "@context": "https://schema.org",
    "@type": "ImageObject",
    url: input.url,
    contentUrl: input.contentUrl ?? input.url,
    width: input.width ?? undefined,
    height: input.height ?? undefined,
    caption: input.caption ?? undefined,
    creditText: input.creditText ?? undefined,
  });
}

export interface ImageGalleryJsonLdInput {
  name: string;
  description?: string | null;
  url: string;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
  authorUrl?: string | null;
  publisherName?: string | null;
  publisherLogoUrl?: string | null;
  inLanguage?: string | null;
  images: Array<{
    url: string;
    width?: number | null;
    height?: number | null;
    caption?: string | null;
  }>;
}

/** Photo essay / gallery — pairs with NewsArticle for Discover eligibility. */
export function imageGalleryJsonLd(input: ImageGalleryJsonLdInput) {
  const datePublished = ensureIsoDate(input.datePublished);
  return stripNulls({
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: truncateHeadline(input.name),
    description: input.description?.trim() || undefined,
    url: input.url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
      url: input.url,
    },
    datePublished,
    dateModified: ensureIsoDate(input.dateModified, datePublished),
    inLanguage: schemaLanguage(input.inLanguage),
    author: personAuthor({
      name: input.authorName,
      url: input.authorUrl,
    }),
    publisher: publisherOrganization({
      name: input.publisherName,
      logoUrl: input.publisherLogoUrl,
    }),
    image: input.images[0] ? toImageObject(input.images[0]) : undefined,
    associatedMedia: input.images.map((img) =>
      stripNulls({
        "@type": "ImageObject",
        url: img.url,
        contentUrl: img.url,
        width: img.width ?? undefined,
        height: img.height ?? undefined,
        caption: img.caption ?? undefined,
      }),
    ),
  });
}

export interface WebStoryJsonLdInput {
  headline: string;
  description?: string | null;
  url: string;
  image?: string | string[] | null;
  datePublished?: string | null;
  dateModified?: string | null;
  publisherName?: string | null;
  /** Prefer raster 1:1 ≥96px for AMP stories; 600×60 also OK for Article. */
  publisherLogoUrl?: string | null;
  authorName?: string | null;
  inLanguage?: string | null;
  /** When set, marks relationship to AMP Web Story URL. */
  ampUrl?: string | null;
}

/** Google Web Stories: Article JSON-LD on both HTML player and AMP story. */
export function webStoryJsonLd(input: WebStoryJsonLdInput) {
  const datePublished = ensureIsoDate(input.datePublished);
  const images = buildArticleImages(input.image, input.publisherLogoUrl);
  const logo = absoluteUrl(
    input.publisherLogoUrl || "/publisher-logo",
  );

  return stripNulls({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: truncateHeadline(input.headline),
    description: input.description?.trim() || undefined,
    url: input.url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
      url: input.url,
    },
    image: images,
    datePublished,
    dateModified: ensureIsoDate(input.dateModified, datePublished),
    inLanguage: schemaLanguage(input.inLanguage),
    author: {
      "@type": "Person",
      name: input.authorName?.trim() || input.publisherName || themeConfig.siteName,
    },
    publisher: {
      "@type": "Organization",
      name: input.publisherName || themeConfig.siteName,
      logo: {
        "@type": "ImageObject",
        url: logo,
        width: 96,
        height: 96,
      },
    },
    isPartOf: input.ampUrl
      ? {
          "@type": "CreativeWork",
          url: input.ampUrl,
          name: truncateHeadline(input.headline),
        }
      : undefined,
  });
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export interface SpeakableJsonLdInput {
  url: string;
  cssSelectors?: string[];
  xpath?: string[];
}

export function speakableJsonLd(input: SpeakableJsonLdInput) {
  return stripNulls({
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: input.url,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: input.cssSelectors ?? [
        "h1",
        ".article-headline",
        ".article-summary",
        ".article-dek",
      ],
      xpath: input.xpath ?? undefined,
    },
  });
}

/** Serialize JSON-LD for a `<script type="application/ld+json">` tag. */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
