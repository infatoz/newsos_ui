import { NextResponse, type NextRequest } from "next/server";
import {
  getPostBySlug,
  getRelatedPosts,
  getPollById,
} from "@/services/content.service";
import { getSeoSettings } from "@/services/seo-settings.service";
import { getActiveAds } from "@/services/ads.service";
import { extractPollIdsFromHtml } from "@/utils/poll";
import { readingTime } from "@/utils/reading-time";
import {
  absoluteUrl,
  ampArticlePath,
  contentPath,
} from "@/utils/urls";
import { safeDecodeSlug } from "@/utils/slug";
import type { Poll, Post, RelatedPost } from "@/types";
import type { ContinuousArticlePayload } from "@/types/continuous-article";

export const revalidate = 60;

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * Full article JSON for continuous / infinite article reading.
 * GET /api/articles/[slug]?exclude=12,34
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = safeDecodeSlug(rawSlug);
  const excludeRaw = request.nextUrl.searchParams.get("exclude") || "";
  const excludeIds = new Set(
    excludeRaw
      .split(",")
      .map((v) => Number.parseInt(v.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0),
  );

  try {
    const post = await getPostBySlug(slug, { revalidate: 60 });
    if (!post) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    excludeIds.add(post.databaseId);

    let related: Array<RelatedPost | Post> = [];
    try {
      related = await getRelatedPosts(post.databaseId, 10, { revalidate: 60 });
    } catch {
      related = [];
    }

    const queue = related
      .filter((r) => r.slug && !excludeIds.has(r.databaseId))
      .slice(0, 8)
      .map((r) => ({
        id: r.id,
        databaseId: r.databaseId,
        slug: r.slug,
        uri: r.uri,
        title: r.title,
      }));

    const path = contentPath(post.uri, post.slug || slug);
    const url = absoluteUrl(path);

    let ampUrl: string | null = null;
    try {
      const seo = await getSeoSettings();
      if (seo.enableAmp && seo.ampArticleEnabled) {
        ampUrl = absoluteUrl(ampArticlePath(path));
      }
    } catch {
      ampUrl = null;
    }

    const contentHtml = post.content ?? "";
    const minutes =
      post.readingTime ||
      post.seo?.readingTime ||
      readingTime(contentHtml).minutes;

    const polls: Record<number, Poll> = {};
    const pollIds = extractPollIdsFromHtml(contentHtml);
    await Promise.all(
      pollIds.map(async (id) => {
        try {
          const poll = await getPollById(id, { revalidate: 60 });
          if (poll) polls[id] = poll;
        } catch {
          /* skip */
        }
      }),
    );

    let inArticleAds: ContinuousArticlePayload["inArticleAds"] = [];
    try {
      const [article, infeed] = await Promise.all([
        getActiveAds({ placement: "article" }, { revalidate: 30 }),
        getActiveAds({ placement: "infeed" }, { revalidate: 30 }),
      ]);
      inArticleAds = [...article, ...infeed].slice(0, 3);
    } catch {
      inArticleAds = [];
    }

    const payload: ContinuousArticlePayload = {
      post,
      related,
      url,
      path,
      minutes: typeof minutes === "number" ? minutes : 1,
      ampUrl,
      polls,
      inArticleAds,
      queue,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to load article" },
      { status: 500 },
    );
  }
}
