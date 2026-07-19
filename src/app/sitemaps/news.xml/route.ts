import { buildNewsSitemapResponse } from "@/lib/sitemaps/news-sitemap";

export const revalidate = 900;

/** Google News sitemap — posts from the last N hours (default 48). */
export async function GET() {
  return buildNewsSitemapResponse("news");
}
