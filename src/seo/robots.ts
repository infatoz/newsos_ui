import { themeConfig } from "@/config/theme";

export interface RobotsRules {
  userAgent: string;
  allow?: string[];
  disallow?: string[];
  crawlDelay?: number;
}

export interface RobotsConfig {
  host?: string;
  sitemap?: string | string[];
  rules: RobotsRules[];
}

/**
 * Default robots.txt configuration for the news portal.
 * Use with Next.js `app/robots.ts` MetadataRoute.Robots.
 */
export function getRobotsConfig(): RobotsConfig {
  const host = themeConfig.siteUrl.replace(/\/$/, "");

  return {
    host,
    sitemap: [
      `${host}/sitemap.xml`,
      `${host}/sitemaps/pages.xml`,
      `${host}/sitemaps/posts.xml`,
      `${host}/sitemaps/news.xml`,
      `${host}/sitemaps/news-daily.xml`,
      `${host}/sitemaps/images.xml`,
      `${host}/sitemaps/videos.xml`,
      `${host}/sitemaps/stories.xml`,
      `${host}/sitemaps/photos.xml`,
      `${host}/sitemaps/shorts.xml`,
      `${host}/sitemaps/discover.xml`,
      `${host}/news-sitemap.xml`,
    ],
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/api/",
          "/preview/",
          "/admin/",
          "/login/",
          "/search?",
          "/*?*utm_",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/"],
        disallow: ["/api/", "/preview/", "/admin/"],
      },
      {
        userAgent: "Googlebot-News",
        allow: ["/"],
        disallow: ["/api/", "/preview/"],
      },
    ],
  };
}

/**
 * Shape compatible with Next.js `MetadataRoute.Robots`.
 */
export function buildRobotsMetadata(): {
  rules:
    | {
        userAgent: string | string[];
        allow?: string | string[];
        disallow?: string | string[];
        crawlDelay?: number;
      }
    | Array<{
        userAgent: string | string[];
        allow?: string | string[];
        disallow?: string | string[];
        crawlDelay?: number;
      }>;
  sitemap?: string | string[];
  host?: string;
} {
  const config = getRobotsConfig();

  return {
    host: config.host,
    sitemap: config.sitemap,
    rules: config.rules.map((rule) => ({
      userAgent: rule.userAgent,
      allow: rule.allow,
      disallow: rule.disallow,
      crawlDelay: rule.crawlDelay,
    })),
  };
}

/** Check if a path should be noindexed (preview, draft, internal). */
export function shouldNoIndexPath(pathname: string): boolean {
  const blocked = ["/preview", "/api", "/admin", "/login", "/draft"];
  return blocked.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
