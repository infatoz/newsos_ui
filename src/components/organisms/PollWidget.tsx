"use client";

import { useMemo, useState } from "react";
import type { Poll } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PollWidgetProps {
  poll: Poll;
  className?: string;
  /** Called with selected option id(s). Parent handles API. */
  onVote?: (optionIds: string[]) => Promise<void> | void;
}

export function PollWidget({ poll, className, onVote }: PollWidgetProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const closed = Boolean(poll.isClosed);
  const showResults = submitted || closed;

  const totals = useMemo(() => {
    const total = poll.totalVotes || poll.options.reduce((s, o) => s + o.votes, 0);
    return { total };
  }, [poll]);

  function toggle(id: string) {
    if (closed || submitted) return;
    if (poll.allowMultiple) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    } else {
      setSelected([id]);
    }
  }

  async function handleVote() {
    if (!selected.length || closed) return;
    setLoading(true);
    setError("");
    try {
      await onVote?.(selected);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Could not record your vote. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside
      className={cn(
        "border border-[var(--np-border)] bg-[var(--np-surface)] p-4",
        className,
      )}
      aria-labelledby={`poll-${poll.id}`}
    >
      <h3
        id={`poll-${poll.id}`}
        className="font-heading text-base font-bold text-[var(--np-primary)]"
      >
        {poll.question}
      </h3>

      <ul className="mt-4 flex flex-col gap-2">
        {poll.options.map((opt) => {
          const pct =
            opt.percentage ??
            (totals.total > 0
              ? Math.round((opt.votes / totals.total) * 100)
              : 0);
          const isSelected = selected.includes(opt.id);

          return (
            <li key={opt.id}>
              {showResults ? (
                <div className="relative overflow-hidden rounded-sm border border-[var(--np-border)] px-3 py-2">
                  <div
                    className="absolute inset-y-0 left-0 bg-[var(--np-primary)]/10"
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                  <div className="relative flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{opt.label}</span>
                    <span className="tabular-nums text-[var(--np-muted)]">
                      {pct}%
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => toggle(opt.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm border px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "border-[var(--np-accent)] bg-[var(--np-accent)]/5"
                      : "border-[var(--np-border)] hover:border-[var(--np-primary)]/40",
                  )}
                  aria-pressed={isSelected}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center border",
                      poll.allowMultiple ? "rounded-sm" : "rounded-full",
                      isSelected
                        ? "border-[var(--np-accent)] bg-[var(--np-accent)]"
                        : "border-[var(--np-border)]",
                    )}
                    aria-hidden
                  />
                  {opt.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {!showResults ? (
        <Button
          type="button"
          className="mt-4 w-full bg-[var(--np-primary)] text-white hover:bg-[var(--np-primary)]/90"
          disabled={!selected.length || loading}
          onClick={handleVote}
        >
          {loading ? "Submitting…" : "Vote"}
        </Button>
      ) : (
        <p className="mt-3 text-xs text-[var(--np-muted)]">
          {totals.total.toLocaleString()} vote{totals.total === 1 ? "" : "s"}
          {poll.endsAt ? ` · Ends ${new Date(poll.endsAt).toLocaleString()}` : null}
        </p>
      )}

      {error ? (
        <p role="alert" className="mt-2 text-xs text-[var(--np-live)]">
          {error}
        </p>
      ) : null}
    </aside>
  );
}
