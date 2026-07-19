import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
  /** Accessible label while loading. */
  label?: string;
}

export function Skeleton({ className, label = "Loading" }: SkeletonProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "block animate-pulse rounded-sm bg-[var(--np-border)]/60",
        className,
      )}
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3 w-full", i === lines - 1 && "w-2/3")}
        />
      ))}
    </div>
  );
}
