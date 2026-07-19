import type { Short } from "@/types";

export type ShortMediaType = "youtube" | "video" | "image";

export function isYouTubeUrl(url?: string | null): boolean {
  if (!url?.trim()) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("youtube.com") || host.includes("youtu.be");
  } catch {
    return /youtube\.com|youtu\.be/i.test(url);
  }
}

export function isDirectVideoUrl(url?: string | null): boolean {
  if (!url?.trim()) return false;
  return /\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(url.trim());
}

/** Extract YouTube video id from watch / shorts / embed / youtu.be. */
export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.split("/").filter(Boolean)[0] || null;
    }
    if (parsed.searchParams.get("v")) {
      return parsed.searchParams.get("v");
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
      return parts[1] || null;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * YouTube embed URL tuned for vertical shorts (autoplay when active).
 */
export function youtubeShortsEmbedUrl(
  url: string,
  options: { autoplay?: boolean; mute?: boolean } = {},
): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  const autoplay = options.autoplay ? 1 : 0;
  const mute = options.mute === false ? 0 : 1;
  const params = new URLSearchParams({
    autoplay: String(autoplay),
    mute: String(mute),
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    loop: "1",
    playlist: id,
    controls: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

export function resolveShortMediaType(input: {
  mediaType?: string | null;
  source?: string | null;
  videoUrl?: string | null;
  posterUrl?: string | null;
}): ShortMediaType {
  const explicit = (input.mediaType || "").trim().toLowerCase();
  if (explicit === "youtube" || explicit === "video" || explicit === "image") {
    return explicit;
  }
  if ((input.source || "").toLowerCase() === "youtube" || isYouTubeUrl(input.videoUrl)) {
    return "youtube";
  }
  if (input.videoUrl?.trim()) {
    return "video";
  }
  if (input.posterUrl?.trim()) {
    return "image";
  }
  return "video";
}

export function shortPosterUrl(short: Pick<Short, "shortPosterUrl" | "featuredImage">): string | null {
  return (
    short.shortPosterUrl?.trim() ||
    short.featuredImage?.node?.sourceUrl?.trim() ||
    null
  );
}

/** Whether a short has enough media to open in the feed. */
export function shortHasPlayableMedia(short: Short): boolean {
  const poster = shortPosterUrl(short);
  const type = resolveShortMediaType({
    mediaType: short.shortMediaType,
    source: short.shortSource,
    videoUrl: short.shortVideoUrl,
    posterUrl: poster,
  });
  if (type === "image") return Boolean(poster);
  return Boolean(short.shortVideoUrl?.trim());
}
