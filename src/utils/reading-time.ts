import { stripHtml } from "@/lib/utils";

const WORDS_PER_MINUTE = 230;

export interface ReadingTimeResult {
  /** Estimated minutes (minimum 1 when content is non-empty). */
  minutes: number;
  /** Word count after HTML strip. */
  words: number;
  /** Human-readable label, e.g. "4 min read". */
  text: string;
}

/**
 * Estimate reading time from HTML or plain text content.
 */
export function readingTime(
  html: string,
  wordsPerMinute: number = WORDS_PER_MINUTE,
): ReadingTimeResult {
  const text = stripHtml(html ?? "");
  const words = text
    ? text.split(/\s+/).filter((w) => w.length > 0).length
    : 0;
  const minutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / wordsPerMinute));

  return {
    minutes,
    words,
    text: minutes === 0 ? "Quick read" : `${minutes} min read`,
  };
}

/** Convenience: return only minutes. */
export function readingTimeMinutes(html: string): number {
  return readingTime(html).minutes;
}
