import { getSitemapPosts } from "@/services/content.service";
import { absoluteUrl, contentPath } from "@/utils/urls";
import { responseXml, urlset } from "@/lib/sitemaps/xml";

export const revalidate = 3600;

export async function GET() {
  const entries: Array<{
    loc: string;
    lastmod?: string | null;
    changefreq?: string;
    priority?: number;
  }> = [];

  try {
    const posts = await getSitemapPosts({ first: 500 });
    for (const post of posts.nodes ?? []) {
      entries.push({
        loc: absoluteUrl(contentPath(post.uri, post.slug)),
        lastmod: post.modifiedGmt || post.modified,
        changefreq: "daily",
        priority: 0.7,
      });
    }
  } catch {
    // empty urlset
  }

  return responseXml(urlset(entries));
}
