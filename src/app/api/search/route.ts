import { NextResponse, type NextRequest } from "next/server";
import { getSearchResults } from "@/services/content.service";
import { stripHtml } from "@/lib/utils";
import { contentPath } from "@/utils/urls";

/**
 * Instant search JSON API for header / typeahead.
 * GET /api/search?q=query&limit=8
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") || 8) || 8,
    20,
  );

  if (!q || q.length < 2) {
    return NextResponse.json({ query: q, results: [] });
  }

  try {
    const data = await getSearchResults(
      q,
      { first: limit },
      { revalidate: 30, tags: ["search", "api-search"] },
    );

    const results = (data.nodes ?? []).map((post) => ({
      id: post.id,
      databaseId: post.databaseId,
      title: post.title,
      slug: post.slug,
      uri: contentPath(post.uri, post.slug),
      excerpt: stripHtml(post.excerpt || "").slice(0, 160),
      date: post.date,
      image: post.featuredImage?.node?.sourceUrl ?? null,
      category: post.categories?.nodes?.[0]
        ? {
            name: post.categories.nodes[0].name,
            slug: post.categories.nodes[0].slug,
          }
        : null,
    }));

    return NextResponse.json({ query: q, results });
  } catch {
    return NextResponse.json({ query: q, results: [] }, { status: 200 });
  }
}
