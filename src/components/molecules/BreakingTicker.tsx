"use client";

import Link from "next/link";
import type { BreakingNews } from "@/types";
import { cn } from "@/lib/utils";

export interface BreakingTickerProps {
  items: BreakingNews[];
  label?: string;
  className?: string;
}

export function BreakingTicker({
  items,
  label = "Breaking",
  className,
}: BreakingTickerProps) {
  const active = items.filter((i) => i.isActive);

  if (active.length === 0) {
    return null;
  }

  const doubled = [...active, ...active];

  return (
    <div
      className={cn(
        "flex min-h-10 items-stretch overflow-hidden border-y border-[var(--np-border)] bg-[var(--np-surface)]",
        className,
      )}
      role="region"
      aria-label="Breaking news"
    >
      <span className="flex shrink-0 items-center bg-[var(--np-breaking)] px-3 text-xs font-bold uppercase tracking-wider text-white">
        {label}
      </span>
      <div className="relative flex-1 overflow-hidden">
        <ul className="flex w-max animate-[np-marquee_40s_linear_infinite] items-center gap-8 py-2 pl-4 hover:[animation-play-state:paused]">
          {doubled.map((item, idx) => {
            const href =
              item.href ??
              item.post?.uri ??
              (item.post?.slug ? `/${item.post.slug}` : undefined);
            const key = `${item.id}-${idx}`;

            return (
              <li key={key} className="shrink-0 text-sm text-[var(--np-text)]">
                {href ? (
                  <Link
                    href={href}
                    className="font-medium hover:text-[var(--np-accent)]"
                  >
                    {item.headline}
                  </Link>
                ) : (
                  <span className="font-medium">{item.headline}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
