import {
  formatNewsDate,
  formatRelativeNewsDate,
  type DateInput,
  type FormatNewsDateOptions,
} from "@/utils/dates";
import { cn } from "@/lib/utils";

export interface TimestampProps {
  date: DateInput;
  className?: string;
  /** Prefer relative ("3 hours ago") when true. */
  relative?: boolean;
  formatOptions?: FormatNewsDateOptions;
  /** Machine-readable datetime for <time>. */
  dateTime?: string;
}

export function Timestamp({
  date,
  className,
  relative = false,
  formatOptions,
  dateTime,
}: TimestampProps) {
  const label = relative
    ? formatRelativeNewsDate(date)
    : formatNewsDate(date, formatOptions);

  if (!label) return null;

  const iso =
    dateTime ??
    (typeof date === "string"
      ? date
      : date instanceof Date
        ? date.toISOString()
        : undefined);

  return (
    <time
      dateTime={iso}
      suppressHydrationWarning={relative}
      className={cn(
        "text-xs text-[var(--np-muted)] tabular-nums",
        className,
      )}
    >
      {label}
    </time>
  );
}
