import { getSeoSettings } from "@/services/seo-settings.service";
import {
  discoverImagesFromPosts,
  getSitemapImagePosts,
} from "@/services/media.service";
import { getSitemapStories } from "@/services/content.service";
import { absoluteUrl } from "@/utils/urls";
import { responseXml, urlset, type SitemapUrlEntry } from "@/lib/sitemaps/xml";

export const revalidate = 3600;

/**
 * Google Discover–oriented sitemap.
 * Recent articles + Web Stories with large images (max-image-preview:large helps too).
 * Discover has no special sitemap type — image-rich URLs in a regular sitemap help discovery.
 */
export async function GET() {
  const seo = await getSeoSettings();
  if (!seo.enableDiscoverSitemap) {
    return responseXml(urlset([], { image: true }));
  }

  const entries: SitemapUrlEntry[] = [];
  const seen = new Set<string>();

  const posts = await getSitemapImagePosts({ first: 150 });
  const rows = discoverImagesFromPosts(posts.nodes ?? [], 1200);

  for (const row of rows) {
    const loc = absoluteUrl(row.pageUrl);
    if (seen.has(loc)) continue;
    seen.add(loc);
    entries.push({
      loc,
      lastmod: row.lastmod,
      changefreq: "hourly",
      priority: 0.8,
      images: [
        {
          loc: row.imageUrl,
          title: row.title,
          caption: row.caption,
        },
      ],
    });
  }

  if (seo.enableStoriesSitemap) {
    const stories = await getSitemapStories({ first: 100 });
    const ampOn = Boolean(seo.enableAmp && seo.ampStoriesEnabled);

    for (const story of stories.nodes ?? []) {
      const slug = story.slug || "";
      if (!slug) continue;
      const loc = ampOn
        ? absoluteUrl(`/amp/stories/${slug}`)
        : absoluteUrl(story.uri || `/stories/${slug}`);
      if (seen.has(loc)) continue;
      seen.add(loc);
      const cover = story.coverImageUrl;
      entries.push({
        loc,
        lastmod: story.modifiedGmt || story.modified,
        changefreq: "daily",
        priority: 0.7,
        images: cover
          ? [{ loc: cover, title: story.title, caption: story.title }]
          : undefined,
      });
    }
  }

  return responseXml(urlset(entries, { image: true }));
}
