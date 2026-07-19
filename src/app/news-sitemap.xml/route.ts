import { buildNewsSitemapResponse } from "@/lib/sitemaps/news-sitemap";

export const revalidate = 900;

/** Alias of /sitemaps/news.xml — local segment config (do not re-export). */
export async function GET() {
  return buildNewsSitemapResponse("news");
}
