import { getSeoSettings } from "@/services/seo-settings.service";
import { getNewsSitemapPosts } from "@/services/media.service";
import { absoluteUrl, contentPath } from "@/utils/urls";
import { resolveLocale } from "@/utils/locale";
import { responseXml, urlset } from "@/lib/sitemaps/xml";

export type NewsSitemapMode = "news" | "top-stories" | "daily";

/**
 * Google News / Top Stories sitemap.
 * Submit this in Search Console + Google News Publisher Center.
 * Top Stories eligibility uses these article URLs (not Web Stories).
 * Pair with amphtml on article pages for AMP in mobile search / carousels.
 */
export async function buildNewsSitemapResponse(
  mode: NewsSitemapMode = "news",
): Promise<Response> {
  const seo = await getSeoSettings();
  const enabled =
    mode === "daily" ? seo.enableDailyNewsSitemap : seo.enableNewsSitemap;
  if (!enabled) {
    return responseXml(urlset([], { news: true }));
  }

  const hours = mode === "daily" ? 24 : seo.sitemapNewsHours;
  let posts = await getNewsSitemapPosts(hours);

  if (mode === "daily") {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    posts = posts.filter((post) => {
      const d = post.dateGmt || post.date;
      if (!d) return false;
      return new Date(d).getTime() >= startOfDay.getTime();
    });
  }

  // Top Stories: prefer freshest window (last 24h) even when news hours is wider.
  if (mode === "top-stories") {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    posts = posts.filter((post) => {
      const d = post.dateGmt || post.date;
      if (!d) return false;
      return new Date(d).getTime() >= cutoff;
    });
  }

  const keywords = seo.googleNewsLabels?.trim() || null;
  const locale = resolveLocale(seo.newsPublicationLanguage);

  const entries = posts.map((post) => ({
    loc: absoluteUrl(contentPath(post.uri, post.slug)),
    news: {
      publicationName: seo.newsPublicationName,
      // Google News requires ISO 639 language code (e.g. kn, en).
      language: locale.newsLanguage,
      title: post.title || "News",
      publicationDate: post.dateGmt || post.date || new Date().toISOString(),
      keywords,
    },
  }));

  return responseXml(urlset(entries, { news: true }), 900);
}
