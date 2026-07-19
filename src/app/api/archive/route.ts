import { NextResponse, type NextRequest } from "next/server";
import {
  getAuthorBySlug,
  getCategoryBySlug,
  getSearchResults,
  getStories,
  getTagBySlug,
} from "@/services/content.service";
import {
  getPhotoStories,
  getShorts,
  getVideos,
} from "@/services/media.service";

export const revalidate = 60;

const KINDS = [
  "category",
  "tag",
  "author",
  "search",
  "videos",
  "photos",
  "shorts",
  "stories",
] as const;

type ArchiveKind = (typeof KINDS)[number];

function isKind(value: string): value is ArchiveKind {
  return (KINDS as readonly string[]).includes(value);
}

/**
 * Paginated archive JSON for client “Load more”.
 * GET /api/archive?kind=category&slug=india&after=CURSOR&first=12
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const kindRaw = (sp.get("kind") || "").trim();
  const slug = (sp.get("slug") || "").trim();
  const q = (sp.get("q") || "").trim();
  const after = sp.get("after") || undefined;
  const first = Math.min(
    Math.max(Number.parseInt(sp.get("first") || "12", 10) || 12, 1),
    48,
  );

  if (!isKind(kindRaw)) {
    return NextResponse.json({ message: "Invalid kind" }, { status: 400 });
  }

  try {
    let nodes: unknown[] = [];
    let pageInfo: {
      hasNextPage?: boolean;
      endCursor?: string | null;
    } | null = null;

    switch (kindRaw) {
      case "category": {
        if (!slug) {
          return NextResponse.json({ message: "slug required" }, { status: 400 });
        }
        const category = await getCategoryBySlug(
          slug,
          { first, after },
          { revalidate: 60 },
        );
        nodes = category?.posts?.nodes ?? [];
        pageInfo = category?.posts?.pageInfo ?? null;
        break;
      }
      case "tag": {
        if (!slug) {
          return NextResponse.json({ message: "slug required" }, { status: 400 });
        }
        const tag = await getTagBySlug(slug, { first, after }, { revalidate: 60 });
        nodes = tag?.posts?.nodes ?? [];
        pageInfo = tag?.posts?.pageInfo ?? null;
        break;
      }
      case "author": {
        if (!slug) {
          return NextResponse.json({ message: "slug required" }, { status: 400 });
        }
        const author = await getAuthorBySlug(
          slug,
          { first, after },
          { revalidate: 60 },
        );
        nodes = author?.posts?.nodes ?? [];
        pageInfo = author?.posts?.pageInfo ?? null;
        break;
      }
      case "search": {
        if (q.length < 2) {
          return NextResponse.json({ items: [], pageInfo: { hasNextPage: false } });
        }
        const result = await getSearchResults(
          q,
          { first, after },
          { revalidate: 30 },
        );
        nodes = result.nodes ?? [];
        pageInfo = result.pageInfo ?? null;
        break;
      }
      case "videos": {
        const result = await getVideos({ first, after }, { revalidate: 60 });
        nodes = result.nodes ?? [];
        pageInfo = result.pageInfo ?? null;
        break;
      }
      case "photos": {
        const result = await getPhotoStories({ first, after }, { revalidate: 60 });
        nodes = result.nodes ?? [];
        pageInfo = result.pageInfo ?? null;
        break;
      }
      case "shorts": {
        const result = await getShorts({ first, after }, { revalidate: 60 });
        nodes = result.nodes ?? [];
        pageInfo = result.pageInfo ?? null;
        break;
      }
      case "stories": {
        const result = await getStories({ first, after }, { revalidate: 60 });
        nodes = result.nodes ?? [];
        pageInfo = result.pageInfo ?? null;
        break;
      }
    }

    return NextResponse.json(
      {
        kind: kindRaw,
        items: nodes,
        pageInfo: {
          hasNextPage: Boolean(pageInfo?.hasNextPage),
          endCursor: pageInfo?.endCursor ?? null,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to load archive page" },
      { status: 500 },
    );
  }
}
