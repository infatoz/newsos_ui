import { Clock } from "lucide-react";
import { readingTime } from "@/utils/reading-time";
import { cn } from "@/lib/utils";

export interface ReadingTimeProps {
  /** Precomputed minutes from CMS. */
  minutes?: number | null;
  /** HTML/plain content used when minutes is omitted. */
  content?: string | null;
  className?: string;
  showIcon?: boolean;
}

export function ReadingTime({
  minutes,
  content,
  className,
  showIcon = true,
}: ReadingTimeProps) {
  const resolved =
    typeof minutes === "number" && minutes > 0
      ? { minutes, text: `${minutes} min read` }
      : content
        ? readingTime(content)
        : null;

  if (!resolved || resolved.minutes === 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-[var(--np-muted)]",
        className,
      )}
    >
      {showIcon ? <Clock className="size-3.5 shrink-0" aria-hidden /> : null}
      <span>{resolved.text}</span>
    </span>
  );
}
