"use client";

import { useEffect, useState } from "react";
import type { Poll } from "@/types";
import { PollEmbed } from "@/components/organisms/PollEmbed";
import { cn } from "@/lib/utils";

export interface PollSlotProps {
  /** Prefetched poll (preferred). */
  poll?: Poll | null;
  /** Database ID used when poll was not prefetched. */
  pollId: number;
  className?: string;
}

/**
 * Renders an interactive poll. Falls back to client fetch by ID when SSR
 * prefetched data is missing (so shortcodes never disappear silently).
 */
export function PollSlot({ poll: initial, pollId, className }: PollSlotProps) {
  const [poll, setPoll] = useState<Poll | null>(initial ?? null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!initial && pollId > 0);

  useEffect(() => {
    if (initial) {
      setPoll(initial);
      setLoading(false);
      return;
    }
    if (!pollId) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`/api/polls/${pollId}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as Poll | { message?: string } | null;
        if (!res.ok || !data || !("databaseId" in data) || !data.databaseId) {
          throw new Error(
            (data && "message" in data && data.message) || "Poll not found",
          );
        }
        if (!cancelled) setPoll(data as Poll);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load poll");
          setPoll(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initial, pollId]);

  if (poll) {
    return <PollEmbed poll={poll} className={className} />;
  }

  if (loading) {
    return (
      <div
        className={cn(
          "not-prose my-8 animate-pulse border border-[var(--np-border)] bg-[var(--np-surface)] p-4",
          className,
        )}
        aria-busy="true"
      >
        <div className="h-4 w-2/3 rounded bg-[var(--np-border)]" />
        <div className="mt-3 h-9 rounded bg-[var(--np-border)]" />
        <div className="mt-2 h-9 rounded bg-[var(--np-border)]" />
      </div>
    );
  }

  if (error) {
    return (
      <aside
        className={cn(
          "not-prose my-8 border border-[var(--np-border)] bg-[var(--np-surface)] p-4 text-sm text-[var(--np-muted)]",
          className,
        )}
        role="status"
      >
        Poll unavailable ({error}).
      </aside>
    );
  }

  return null;
}
