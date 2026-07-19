import { getSeoSettings } from "@/services/seo-settings.service";
import {
  featuredImagesFromPosts,
  getSitemapImagePosts,
} from "@/services/media.service";
import { absoluteUrl } from "@/utils/urls";
import { responseXml, urlset } from "@/lib/sitemaps/xml";

export const revalidate = 3600;

export async function GET() {
  const seo = await getSeoSettings();
  if (!seo.enableImageSitemap) {
    return responseXml(urlset([], { image: true }));
  }

  const posts = await getSitemapImagePosts({ first: 200 });
  const rows = featuredImagesFromPosts(posts.nodes ?? []);

  const entries = rows.map((row) => ({
    loc: absoluteUrl(row.pageUrl),
    lastmod: row.lastmod,
    images: [
      {
        loc: row.imageUrl,
        title: row.title,
        caption: row.caption,
      },
    ],
  }));

  return responseXml(urlset(entries, { image: true }));
}
