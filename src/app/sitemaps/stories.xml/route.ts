import { getSeoSettings } from "@/services/seo-settings.service";
import { getSitemapStories } from "@/services/content.service";
import { absoluteUrl } from "@/utils/urls";
import { responseXml, urlset } from "@/lib/sitemaps/xml";

export const revalidate = 3600;

/**
 * Web Stories sitemap for Google Search / Discover.
 * Lists self-canonical AMP Web Story URLs (required for Google Web Stories)
 * plus cover images for richer discovery.
 */
export async function GET() {
  const seo = await getSeoSettings();
  if (!seo.enableStoriesSitemap) {
    return responseXml(urlset([], { image: true }));
  }

  const stories = await getSitemapStories({ first: 500 });
  const ampOn = Boolean(seo.enableAmp && seo.ampStoriesEnabled);

  const entries = (stories.nodes ?? []).flatMap((story) => {
    const slug = story.slug || "";
    if (!slug) return [];
    const htmlLoc = absoluteUrl(story.uri || `/stories/${slug}`);
    const ampLoc = absoluteUrl(`/amp/stories/${slug}`);
    const cover = story.coverImageUrl || null;
    const lastmod = story.modifiedGmt || story.modified;
    const images = cover
      ? [{ loc: cover, title: story.title, caption: story.title }]
      : undefined;

    if (ampOn) {
      return [
        {
          loc: ampLoc,
          lastmod,
          changefreq: "daily" as const,
          priority: 0.7,
          images,
        },
        {
          loc: htmlLoc,
          lastmod,
          changefreq: "daily" as const,
          priority: 0.4,
        },
      ];
    }

    return [
      {
        loc: htmlLoc,
        lastmod,
        changefreq: "daily" as const,
        priority: 0.6,
        images,
      },
    ];
  });

  return responseXml(urlset(entries, { image: true }));
}
