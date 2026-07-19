import { buildNewsSitemapResponse } from "@/lib/sitemaps/news-sitemap";

export const revalidate = 900;

/** Alias optimized for Google Top Stories (freshest 24h news articles). */
export async function GET() {
  return buildNewsSitemapResponse("top-stories");
}
