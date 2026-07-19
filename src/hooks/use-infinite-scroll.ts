"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading?: boolean;
  rootMargin?: string;
  onLoadMore: () => void | Promise<void>;
}

export function useInfiniteScroll({
  hasMore,
  loading = false,
  rootMargin = "240px",
  onLoadMore,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const load = useCallback(async () => {
    if (!hasMore || loading || isFetching) return;
    setIsFetching(true);
    try {
      await onLoadMore();
    } finally {
      setIsFetching(false);
    }
  }, [hasMore, loading, isFetching, onLoadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void load();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [load, rootMargin]);

  return { sentinelRef, isFetching };
}
