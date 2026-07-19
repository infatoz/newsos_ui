"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArticleCard } from "@/components/molecules/ArticleCard";
import { Timestamp } from "@/components/atoms/Timestamp";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/atoms/Skeleton";
import type { PhotoStory, Post, Short, Video } from "@/types";
import type { GraphQLStory } from "@/services/content.service";
import { cn, stripHtml } from "@/lib/utils";
import { resolveShortMediaType, shortPosterUrl } from "@/utils/shorts-media";

export type ArchiveKind =
  | "category"
  | "tag"
  | "author"
  | "search"
  | "videos"
  | "photos"
  | "shorts"
  | "stories";

type PageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

export interface ArchiveLoadMoreProps {
  kind: ArchiveKind;
  /** Required for category / tag / author. */
  slug?: string;
  /** Required for search. */
  q?: string;
  initialItems: unknown[];
  initialPageInfo: PageInfo;
  first?: number;
  className?: string;
  /** Grid classes for the item list. */
  gridClassName?: string;
  /** First item featured styling (posts only). */
  featureFirst?: boolean;
  showExcerpt?: boolean;
  emptyMessage?: string;
}

type ArchiveResponse = {
  items?: unknown[];
  pageInfo?: PageInfo;
  message?: string;
};

function isPostLike(item: unknown): item is Post {
  return (
    !!item &&
    typeof item === "object" &&
    "id" in item &&
    "title" in item &&
    "slug" in item
  );
}

/**
 * Client “Load more” for archive grids — appends the next cursor page via /api/archive.
 */
export function ArchiveLoadMore({
  kind,
  slug,
  q,
  initialItems,
  initialPageInfo,
  first = 12,
  className,
  gridClassName,
  featureFirst = false,
  showExcerpt = false,
  emptyMessage = "Nothing to show yet.",
}: ArchiveLoadMoreProps) {
  const [items, setItems] = useState(initialItems);
  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const defaultGrid =
    kind === "shorts" || kind === "stories"
      ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      : kind === "videos" || kind === "photos"
        ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

  const onLoadMore = useCallback(async () => {
    if (loading || !pageInfo.hasNextPage || !pageInfo.endCursor) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        kind,
        first: String(first),
        after: pageInfo.endCursor,
      });
      if (slug) params.set("slug", slug);
      if (q) params.set("q", q);

      const res = await fetch(`/api/archive?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const data = (await res.json().catch(() => null)) as ArchiveResponse | null;
      if (!res.ok || !data) {
        throw new Error(data?.message || "Failed to load more");
      }

      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems((prev) => {
        const seen = new Set(
          prev
            .map((item) =>
              item && typeof item === "object" && "id" in item
                ? String((item as { id: string }).id)
                : "",
            )
            .filter(Boolean),
        );
        const merged = [...prev];
        for (const item of nextItems) {
          if (
            item &&
            typeof item === "object" &&
            "id" in item &&
            !seen.has(String((item as { id: string }).id))
          ) {
            merged.push(item);
            seen.add(String((item as { id: string }).id));
          }
        }
        return merged;
      });
      setPageInfo({
        hasNextPage: Boolean(data.pageInfo?.hasNextPage),
        endCursor: data.pageInfo?.endCursor ?? null,
      });
    } catch {
      setError("Could not load more. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [first, kind, loading, pageInfo.endCursor, pageInfo.hasNextPage, q, slug]);

  if (items.length === 0) {
    return (
      <p className={cn("text-sm text-[var(--np-muted)]", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <ul className={cn(gridClassName || defaultGrid)}>
        {items.map((item, index) => (
          <li key={itemId(item, index)}>{renderItem(kind, item, index, { featureFirst, showExcerpt })}</li>
        ))}
      </ul>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-center text-sm text-[var(--np-live)]">
          {error}
        </p>
      ) : null}

      {pageInfo.hasNextPage && pageInfo.endCursor ? (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void onLoadMore()}
            disabled={loading}
            className="min-w-[10rem] border-[var(--np-border)]"
          >
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : items.length > 0 ? (
        <p className="text-center text-xs text-[var(--np-muted)]">
          You’re all caught up.
        </p>
      ) : null}
    </div>
  );
}

function itemId(item: unknown, index: number): string {
  if (item && typeof item === "object" && "id" in item) {
    return String((item as { id: string }).id);
  }
  return `item-${index}`;
}

function renderItem(
  kind: ArchiveKind,
  item: unknown,
  index: number,
  opts: { featureFirst: boolean; showExcerpt: boolean },
) {
  if (kind === "videos") return <VideoCard video={item as Video} />;
  if (kind === "photos") return <PhotoCard photo={item as PhotoStory} />;
  if (kind === "shorts") return <ShortCard short={item as Short} />;
  if (kind === "stories") return <WebStoryCard story={item as GraphQLStory} />;

  if (!isPostLike(item)) return null;
  return (
    <ArticleCard
      article={item}
      variant={opts.featureFirst && index === 0 ? "featured" : "compact"}
      showExcerpt={opts.showExcerpt || (opts.featureFirst && index === 0)}
      priority={opts.featureFirst && index === 0}
    />
  );
}

function VideoCard({ video }: { video: Video }) {
  const image = video.featuredImage?.node;
  return (
    <Link href={video.uri || `/videos/${video.slug}`} className="group block">
      <div className="relative aspect-video overflow-hidden bg-[var(--np-border)]">
        {image?.sourceUrl ? (
          <Image
            src={image.sourceUrl}
            alt={image.altText || video.title}
            fill
            sizes="(max-width:768px) 100vw, 33vw"
            className="object-cover transition group-hover:opacity-90"
          />
        ) : null}
        {video.videoIsLive ? (
          <span className="absolute left-2 top-2 bg-[var(--np-accent)] px-2 py-0.5 text-xs font-bold text-white">
            LIVE
          </span>
        ) : null}
      </div>
      <h2 className="mt-2 font-heading text-lg font-semibold group-hover:text-[var(--np-accent)]">
        {video.title}
      </h2>
      {video.excerpt ? (
        <p className="mt-1 line-clamp-2 text-sm text-[var(--np-muted)]">
          {stripHtml(video.excerpt)}
        </p>
      ) : null}
      {video.date ? (
        <div className="mt-1 text-xs text-[var(--np-muted)]">
          <Timestamp date={video.date} />
        </div>
      ) : null}
    </Link>
  );
}

function PhotoCard({ photo }: { photo: PhotoStory }) {
  const cover = photo.photoCoverUrl || photo.featuredImage?.node?.sourceUrl;
  return (
    <Link href={photo.uri || `/photos/${photo.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--np-border)]">
        {cover ? (
          <Image
            src={cover}
            alt={photo.title}
            fill
            sizes="(max-width:768px) 100vw, 33vw"
            className="object-cover transition group-hover:opacity-90"
          />
        ) : null}
        {photo.photoCount ? (
          <span className="absolute bottom-2 right-2 rounded-sm bg-black/70 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">
            {photo.photoCount} photos
          </span>
        ) : null}
      </div>
      <h2 className="mt-2 font-heading text-lg font-semibold group-hover:text-[var(--np-accent)]">
        {photo.title}
      </h2>
      {photo.excerpt ? (
        <p className="mt-1 line-clamp-2 text-sm text-[var(--np-muted)]">
          {stripHtml(photo.excerpt)}
        </p>
      ) : null}
      {photo.date ? (
        <div className="mt-1 text-xs text-[var(--np-muted)]">
          <Timestamp date={photo.date} />
        </div>
      ) : null}
    </Link>
  );
}

function ShortCard({ short }: { short: Short }) {
  const poster = shortPosterUrl(short);
  const mediaType = resolveShortMediaType({
    mediaType: short.shortMediaType,
    source: short.shortSource,
    videoUrl: short.shortVideoUrl,
    posterUrl: poster,
  });
  const badge =
    mediaType === "youtube"
      ? "YouTube"
      : mediaType === "image"
        ? "Image"
        : "Video";

  return (
    <Link href={short.uri || `/shorts/${short.slug}`} className="group block">
      <div className="relative aspect-[9/16] overflow-hidden bg-[var(--np-border)]">
        {poster ? (
          <Image
            src={poster}
            alt={short.title}
            fill
            sizes="(max-width:768px) 50vw, 16vw"
            className="object-cover transition group-hover:opacity-90"
          />
        ) : null}
        <span className="absolute left-2 top-2 bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {badge}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium group-hover:text-[var(--np-accent)]">
        {short.title}
      </p>
    </Link>
  );
}

function WebStoryCard({ story }: { story: GraphQLStory }) {
  return (
    <Link href={story.uri || `/stories/${story.slug}`} className="group block">
      {story.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={story.coverImageUrl}
          alt={story.title ?? ""}
          className="aspect-[9/16] w-full object-cover transition group-hover:opacity-90"
        />
      ) : (
        <div className="aspect-[9/16] bg-[var(--np-border)]" />
      )}
      <p className="mt-2 line-clamp-2 text-sm font-medium group-hover:text-[var(--np-accent)]">
        {story.title}
      </p>
    </Link>
  );
}
