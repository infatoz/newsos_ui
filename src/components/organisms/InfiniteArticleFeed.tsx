"use client";

import { useCallback, useState } from "react";
import type { RelatedPost, Story } from "@/types";
import { ArticleCard } from "@/components/molecules/ArticleCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/atoms/Skeleton";
import { cn } from "@/lib/utils";

export interface InfiniteArticleFeedProps {
  initialItems: Array<RelatedPost | Story>;
  /** Fetch next page; return empty array when done. */
  loadMore: (page: number) => Promise<Array<RelatedPost | Story>>;
  className?: string;
  pageSizeHint?: number;
}

export function InfiniteArticleFeed({
  initialItems,
  loadMore,
  className,
}: InfiniteArticleFeedProps) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialItems.length === 0);
  const [error, setError] = useState("");

  const onLoadMore = useCallback(async () => {
    if (loading || done) return;
    setLoading(true);
    setError("");
    try {
      const nextPage = page + 1;
      const next = await loadMore(nextPage);
      if (!next.length) {
        setDone(true);
      } else {
        setItems((prev) => [...prev, ...next]);
        setPage(nextPage);
      }
    } catch {
      setError("Could not load more stories.");
    } finally {
      setLoading(false);
    }
  }, [done, loadMore, loading, page]);

  if (items.length === 0 && done) {
    return (
      <p className={cn("text-sm text-[var(--np-muted)]", className)}>
        No more stories to show.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <ul className="flex flex-col divide-y divide-[var(--np-border)]">
        {items.map((item) => (
          <li key={item.id}>
            <ArticleCard article={item} variant="horizontal" />
          </li>
        ))}
      </ul>

      {loading ? (
        <div className="flex flex-col gap-3" aria-busy>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-[var(--np-live)]">
          {error}
        </p>
      ) : null}

      {!done ? (
        <Button
          type="button"
          variant="outline"
          onClick={onLoadMore}
          disabled={loading}
          className="mx-auto border-[var(--np-border)]"
        >
          {loading ? "Loading…" : "Load more"}
        </Button>
      ) : items.length > 0 ? (
        <p className="text-center text-xs text-[var(--np-muted)]">
          You’re all caught up.
        </p>
      ) : null}
    </div>
  );
}
