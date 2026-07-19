import {
  getSitemapPages,
  getSitemapCategories,
} from "@/services/content.service";
import { absoluteUrl } from "@/utils/urls";
import { responseXml, urlset } from "@/lib/sitemaps/xml";

export const revalidate = 3600;

export async function GET() {
  const entries: Array<{
    loc: string;
    lastmod?: string | null;
    changefreq?: string;
    priority?: number;
  }> = [
    {
      loc: absoluteUrl("/"),
      lastmod: new Date().toISOString(),
      changefreq: "hourly",
      priority: 1,
    },
    {
      loc: absoluteUrl("/stories"),
      changefreq: "daily",
      priority: 0.8,
    },
    {
      loc: absoluteUrl("/videos"),
      changefreq: "daily",
      priority: 0.7,
    },
    {
      loc: absoluteUrl("/photos"),
      changefreq: "daily",
      priority: 0.7,
    },
    {
      loc: absoluteUrl("/shorts"),
      changefreq: "daily",
      priority: 0.7,
    },
    {
      loc: absoluteUrl("/search"),
      changefreq: "weekly",
      priority: 0.3,
    },
  ];

  try {
    const [pages, categories] = await Promise.all([
      getSitemapPages({ first: 200 }),
      getSitemapCategories(),
    ]);

    for (const page of pages.nodes ?? []) {
      entries.push({
        loc: absoluteUrl(page.uri || `/page/${page.slug}`),
        lastmod: page.modifiedGmt || page.modified,
        changefreq: "monthly",
        priority: 0.5,
      });
    }

    for (const cat of categories) {
      entries.push({
        loc: absoluteUrl(cat.uri || `/category/${cat.slug}`),
        changefreq: "hourly",
        priority: 0.6,
      });
    }
  } catch {
    // empty shell
  }

  return responseXml(urlset(entries));
}
