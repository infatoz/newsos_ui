"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { NewsArticleTemplate } from "@/components/templates/NewsArticleTemplate";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { Skeleton } from "@/components/atoms/Skeleton";
import type { ShareChannels, GooglePreferredSourceConfig } from "@/components/atoms/ShareBar";
import type { ArticleFontConfig } from "@/components/atoms/ArticleFontControls";
import type { SelectionToolbarConfig } from "@/components/atoms/SelectionToolbar";
import type { Ad, Poll, Post, RelatedPost } from "@/types";
import type { ArticleSidebarWidget } from "@/types/article-sidebar";
import type {
  ContinuousArticlePayload,
  ContinuousQueueItem,
} from "@/types/continuous-article";
import { encodeSlugForPath } from "@/utils/slug";
import { cn } from "@/lib/utils";

export type { ContinuousQueueItem } from "@/types/continuous-article";

export type ContinuousArticleChrome = {
  siteName?: string;
  publisherLogoUrl?: string | null;
  imagePlaceholder?: string | null;
  shareChannels?: ShareChannels;
  preferredSource?: GooglePreferredSourceConfig | null;
  fontConfig?: ArticleFontConfig | null;
  selectionConfig?: SelectionToolbarConfig | null;
};

export type ContinuousInitialArticle = {
  post: Post;
  url: string;
  path: string;
  related: Array<RelatedPost | Post>;
  minutes: number;
  ampUrl?: string | null;
  polls?: Record<number, Poll>;
  inArticleAds?: Ad[];
  sidebarAds?: Ad[];
  sidebarWidgets?: ArticleSidebarWidget[];
};

export interface ContinuousArticleReaderProps {
  initial: ContinuousInitialArticle;
  /** Prefetched next-story hints (usually related posts). */
  queue?: ContinuousQueueItem[];
  chrome?: ContinuousArticleChrome;
  className?: string;
  /** Max appended articles in one session (besides the first). */
  maxArticles?: number;
}

type StackItem = ContinuousInitialArticle & {
  key: string;
  stacked: boolean;
};

function toQueueItems(
  items: ContinuousArticlePayload["queue"] | ContinuousQueueItem[],
): ContinuousQueueItem[] {
  return items
    .filter((i) => i.slug && i.databaseId)
    .map((i) => ({
      id: i.id,
      databaseId: i.databaseId,
      slug: i.slug,
      uri: i.uri,
      title: i.title,
    }));
}

/**
 * Infinite continuous article reading: first story is SSR’d via `initial`,
 * then related full articles append as the reader scrolls near the bottom.
 * URL updates with history.replaceState when each story becomes primary.
 */
export function ContinuousArticleReader({
  initial,
  queue: initialQueue = [],
  chrome = {},
  className,
  maxArticles = 12,
}: ContinuousArticleReaderProps) {
  const [stack, setStack] = useState<StackItem[]>([
    {
      ...initial,
      key: `article-${initial.post.databaseId}`,
      stacked: false,
    },
  ]);
  const [queue, setQueue] = useState<ContinuousQueueItem[]>(() =>
    toQueueItems(initialQueue).filter(
      (q) => q.databaseId !== initial.post.databaseId,
    ),
  );
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();
  const seenIds = useRef(new Set<number>([initial.post.databaseId]));
  const articleRefs = useRef(new Map<string, HTMLElement>());

  const hasMore = !done && stack.length - 1 < maxArticles && queue.length > 0;

  const enqueueUnique = useCallback((items: ContinuousQueueItem[]) => {
    setQueue((prev) => {
      const next = [...prev];
      const existing = new Set([
        ...Array.from(seenIds.current),
        ...next.map((q) => q.databaseId),
      ]);
      for (const item of items) {
        if (!item.slug || existing.has(item.databaseId)) continue;
        existing.add(item.databaseId);
        next.push(item);
      }
      return next;
    });
  }, []);

  const loadNext = useCallback(async () => {
    if (loadingMore || done) return;
    if (stack.length - 1 >= maxArticles) {
      setDone(true);
      return;
    }

    const nextHint = queue.find((q) => !seenIds.current.has(q.databaseId));
    if (!nextHint) {
      setDone(true);
      return;
    }

    setLoadingMore(true);
    setError("");

    const exclude = Array.from(seenIds.current).join(",");
    try {
      const res = await fetch(
        `/api/articles/${encodeSlugForPath(nextHint.slug)}?exclude=${exclude}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) {
        setQueue((prev) =>
          prev.filter((q) => q.databaseId !== nextHint.databaseId),
        );
        if (res.status === 404) {
          seenIds.current.add(nextHint.databaseId);
        }
        throw new Error("Could not load the next article");
      }

      const data = (await res.json()) as ContinuousArticlePayload;
      if (!data?.post?.databaseId) {
        throw new Error("Invalid article payload");
      }

      seenIds.current.add(data.post.databaseId);
      seenIds.current.add(nextHint.databaseId);

      startTransition(() => {
        setStack((prev) => [
          ...prev,
          {
            post: data.post,
            url: data.url,
            path: data.path,
            related: data.related ?? [],
            minutes: data.minutes || 1,
            ampUrl: data.ampUrl,
            polls: data.polls ?? {},
            inArticleAds: data.inArticleAds ?? [],
            key: `article-${data.post.databaseId}`,
            stacked: true,
          },
        ]);
        setQueue((prev) =>
          prev.filter(
            (q) =>
              q.databaseId !== nextHint.databaseId &&
              q.databaseId !== data.post.databaseId,
          ),
        );
        enqueueUnique(toQueueItems(data.queue ?? []));
      });
    } catch {
      setError("Could not load the next article. Scroll to retry.");
    } finally {
      setLoadingMore(false);
    }
  }, [done, enqueueUnique, loadingMore, maxArticles, queue, stack.length]);

  const { sentinelRef, isFetching } = useInfiniteScroll({
    hasMore,
    loading: loadingMore || isPending,
    rootMargin: "480px",
    onLoadMore: loadNext,
  });

  // Keep document URL / title in sync with the article most in view.
  useEffect(() => {
    if (typeof window === "undefined" || stack.length === 0) return;

    const nodes = stack
      .map((item) => articleRefs.current.get(item.key))
      .filter(Boolean) as HTMLElement[];

    if (!nodes.length) return;

    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const key = (entry.target as HTMLElement).dataset.articleKey;
          if (!key) continue;
          ratios.set(key, entry.intersectionRatio);
        }

        let bestKey = stack[0]?.key;
        let bestRatio = -1;
        for (const [key, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestKey = key;
          }
        }

        const active = stack.find((s) => s.key === bestKey);
        if (!active || bestRatio < 0.2) return;

        const nextPath = active.path.startsWith("/")
          ? active.path
          : `/${active.path}`;
        if (
          window.location.pathname.replace(/\/+$/, "") !==
          nextPath.replace(/\/+$/, "")
        ) {
          window.history.replaceState(
            { ...window.history.state, continuousArticle: active.post.slug },
            "",
            nextPath,
          );
        }
        if (document.title !== active.post.title) {
          document.title = active.post.title;
        }
      },
      { threshold: [0.2, 0.35, 0.5, 0.65] },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [stack]);

  const loading = loadingMore || isFetching || isPending;

  const chromeProps = useMemo(
    () => ({
      siteName: chrome.siteName,
      publisherLogoUrl: chrome.publisherLogoUrl,
      imagePlaceholder: chrome.imagePlaceholder,
      shareChannels: chrome.shareChannels,
      preferredSource: chrome.preferredSource,
      fontConfig: chrome.fontConfig,
      selectionConfig: chrome.selectionConfig,
    }),
    [chrome],
  );

  return (
    <div className={cn("continuous-article-reader", className)}>
      {stack.map((item) => (
        <section
          key={item.key}
          data-article-key={item.key}
          ref={(el) => {
            if (el) articleRefs.current.set(item.key, el);
            else articleRefs.current.delete(item.key);
          }}
          className={cn(item.stacked && "mt-6 scroll-mt-20")}
          aria-label={item.post.title}
        >
          <NewsArticleTemplate
            post={item.post}
            url={item.url}
            related={item.related}
            minutes={item.minutes}
            ampUrl={item.ampUrl}
            polls={item.polls}
            inArticleAds={item.inArticleAds}
            sidebarAds={item.stacked ? [] : item.sidebarAds}
            sidebarWidgets={item.stacked ? [] : item.sidebarWidgets}
            stacked={item.stacked}
            showRelatedFooter={!item.stacked}
            {...chromeProps}
          />
        </section>
      ))}

      <div ref={sentinelRef} className="h-8 w-full" aria-hidden />

      {loading ? (
        <div className="mx-auto max-w-3xl space-y-4 py-10" aria-busy="true">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-[var(--np-muted)]">
            Loading next article…
          </p>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="py-6 text-center text-sm text-[var(--np-live)]">
          {error}
        </p>
      ) : null}

      {done && stack.length > 1 ? (
        <p className="py-10 text-center text-sm text-[var(--np-muted)]">
          You’re all caught up — browse more stories from related links above.
        </p>
      ) : null}
    </div>
  );
}
