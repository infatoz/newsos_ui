import { buildNewsSitemapResponse } from "@/lib/sitemaps/news-sitemap";

export const revalidate = 900;

/** Daily news sitemap — posts published today (UTC). */
export async function GET() {
  return buildNewsSitemapResponse("daily");
}
