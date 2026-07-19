import { getSeoSettings } from "@/services/seo-settings.service";
import { absoluteUrl } from "@/utils/urls";
import { responseXml, sitemapIndex } from "@/lib/sitemaps/xml";

export const revalidate = 3600;

/**
 * Sitemap index for Google Search Console.
 * Submit this single URL in GSC; children cover News, Discover, Stories, Top Stories.
 */
export async function GET() {
  const seo = await getSeoSettings();
  const now = new Date().toISOString();

  const children: Array<{ path: string; enabled: boolean }> = [
    { path: "/sitemaps/pages.xml", enabled: true },
    { path: "/sitemaps/posts.xml", enabled: true },
    { path: "/sitemaps/news.xml", enabled: seo.enableNewsSitemap },
    { path: "/sitemaps/news-daily.xml", enabled: seo.enableDailyNewsSitemap },
    { path: "/sitemaps/top-stories.xml", enabled: seo.enableNewsSitemap },
    { path: "/sitemaps/images.xml", enabled: seo.enableImageSitemap },
    { path: "/sitemaps/videos.xml", enabled: seo.enableVideoSitemap },
    { path: "/sitemaps/stories.xml", enabled: seo.enableStoriesSitemap },
    { path: "/sitemaps/photos.xml", enabled: true },
    { path: "/sitemaps/shorts.xml", enabled: true },
    { path: "/sitemaps/discover.xml", enabled: seo.enableDiscoverSitemap },
  ];

  const xml = sitemapIndex(
    children
      .filter((c) => c.enabled)
      .map((c) => ({ loc: absoluteUrl(c.path), lastmod: now })),
  );

  return responseXml(xml);
}
