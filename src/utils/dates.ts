import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { themeConfig } from "@/config/theme";

export type DateInput = string | number | Date | null | undefined;

function toDate(input: DateInput): Date | null {
  if (input === null || input === undefined || input === "") return null;
  if (input instanceof Date) return isValid(input) ? input : null;
  if (typeof input === "number") {
    const d = new Date(input);
    return isValid(d) ? d : null;
  }
  const parsed = parseISO(input);
  if (isValid(parsed)) return parsed;
  const fallback = new Date(input);
  return isValid(fallback) ? fallback : null;
}

export interface FormatNewsDateOptions extends Intl.DateTimeFormatOptions {
  /** Override timezone (defaults to themeConfig.timezone). */
  timeZone?: string;
  /** Override locale (defaults to themeConfig.defaultLanguage). */
  locale?: string;
}

/**
 * Format a date/time in the site timezone (default Asia/Kolkata).
 * Uses formatToParts + fixed joining so Node and browsers agree more reliably
 * than `format()` when ICU data differs slightly.
 */
export function formatNewsDate(
  input: DateInput,
  options: FormatNewsDateOptions = {},
): string {
  const date = toDate(input);
  if (!date) return "";

  const {
    timeZone = themeConfig.timezone,
    locale = themeConfig.defaultLanguage,
    ...intlOptions
  } = options;

  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...intlOptions,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const day = get("day");
  const month = get("month");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");
  // Node vs browser can disagree on AM/PM casing — normalize for hydration.
  const dayPeriod = (get("dayPeriod") || "").toLowerCase();

  if (!day || !month || !year) {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      ...intlOptions,
    }).format(date);
  }

  const time =
    hour && minute
      ? `${hour}:${minute}${dayPeriod ? ` ${dayPeriod}` : ""}`
      : "";

  return time ? `${day} ${month} ${year}, ${time}` : `${day} ${month} ${year}`;
}

/** Date only (no time), timezone-aware. */
export function formatNewsDateOnly(input: DateInput): string {
  const date = toDate(input);
  if (!date) return "";

  return new Intl.DateTimeFormat(themeConfig.defaultLanguage, {
    timeZone: themeConfig.timezone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Relative time like "3 hours ago", falling back to absolute if invalid. */
export function formatRelativeNewsDate(input: DateInput): string {
  const date = toDate(input);
  if (!date) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

/** ISO-8601 string for JSON-LD / metadata. */
export function toIsoString(input: DateInput): string | undefined {
  const date = toDate(input);
  return date ? date.toISOString() : undefined;
}

/**
 * Format with date-fns pattern in local interpretation of the Date object.
 * Prefer `formatNewsDate` for timezone-correct news display.
 */
export function formatWithPattern(input: DateInput, pattern: string): string {
  const date = toDate(input);
  if (!date) return "";
  return format(date, pattern);
}
