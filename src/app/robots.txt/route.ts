import { themeConfig } from "@/config/theme";
import { getRobotsConfig } from "@/seo/robots";
import { getSeoSettings } from "@/services/seo-settings.service";
import { absoluteUrl } from "@/utils/urls";

export const revalidate = 3600;

const ALL_SITEMAPS = [
  "/sitemap.xml",
  "/sitemaps/pages.xml",
  "/sitemaps/posts.xml",
  "/sitemaps/news.xml",
  "/sitemaps/news-daily.xml",
  "/sitemaps/top-stories.xml",
  "/sitemaps/images.xml",
  "/sitemaps/videos.xml",
  "/sitemaps/stories.xml",
  "/sitemaps/photos.xml",
  "/sitemaps/shorts.xml",
  "/sitemaps/discover.xml",
  "/news-sitemap.xml",
];

function buildDefaultRobots(): string {
  const config = getRobotsConfig();
  const host = config.host || themeConfig.siteUrl.replace(/\/$/, "");
  const lines: string[] = [];

  for (const rule of config.rules) {
    lines.push(`User-agent: ${rule.userAgent}`);
    for (const allow of rule.allow ?? []) {
      lines.push(`Allow: ${allow}`);
    }
    for (const disallow of rule.disallow ?? []) {
      lines.push(`Disallow: ${disallow}`);
    }
    if (rule.crawlDelay != null) {
      lines.push(`Crawl-delay: ${rule.crawlDelay}`);
    }
    lines.push("");
  }

  lines.push(`Host: ${host}`);
  lines.push(`# AI index: ${absoluteUrl("/llms.txt")}`);
  lines.push(`# AI summaries: ${absoluteUrl("/llms-full.txt")}`);
  for (const path of ALL_SITEMAPS) {
    lines.push(`Sitemap: ${absoluteUrl(path)}`);
  }
  lines.push("");
  return lines.join("\n");
}

/**
 * robots.txt — custom from WP when set, otherwise generated defaults listing all sitemaps.
 */
export async function GET() {
  try {
    const seo = await getSeoSettings();
    const custom = seo.robotsTxt?.trim();
    const body = custom || buildDefaultRobots();

    return new Response(body.endsWith("\n") ? body : `${body}\n`, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    const body = buildDefaultRobots();
    return new Response(body.endsWith("\n") ? body : `${body}\n`, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }
}
