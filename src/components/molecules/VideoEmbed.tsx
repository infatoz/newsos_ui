import { cn } from "@/lib/utils";

export interface VideoEmbedProps {
  src: string;
  title?: string;
  className?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "9/16";
  /** Allow full HTML embed from trusted CMS. */
  html?: string | null;
  provider?: "youtube" | "vimeo" | "custom" | string | null;
  /** Start muted autoplay (shorts / background). */
  autoplay?: boolean;
  mute?: boolean;
}

function toEmbedUrl(
  src: string,
  provider?: string | null,
  options?: { autoplay?: boolean; mute?: boolean },
): string {
  try {
    const url = new URL(src);
    if (
      provider === "youtube" ||
      url.hostname.includes("youtube.com") ||
      url.hostname.includes("youtu.be")
    ) {
      let id = "";
      if (url.hostname.includes("youtu.be")) {
        id = url.pathname.slice(1).split("/")[0] ?? "";
      } else if (url.searchParams.get("v")) {
        id = url.searchParams.get("v") ?? "";
      } else if (url.pathname.startsWith("/embed/")) {
        return src.includes("youtube-nocookie.com")
          ? src
          : src.replace("www.youtube.com", "www.youtube-nocookie.com");
      } else if (url.pathname.startsWith("/live/")) {
        id = url.pathname.split("/").filter(Boolean)[1] ?? "";
      } else if (url.pathname.startsWith("/shorts/")) {
        id = url.pathname.split("/").filter(Boolean)[1] ?? "";
      }
      if (id) {
        const autoplay = options?.autoplay ? 1 : 0;
        const mute = options?.mute || options?.autoplay ? 1 : 0;
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=${autoplay}&mute=${mute}&rel=0&playsinline=1`;
      }
    }
    if (provider === "vimeo" || url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      if (id && !url.pathname.includes("/video/")) {
        return `https://player.vimeo.com/video/${id}`;
      }
    }
  } catch {
    // pass through
  }
  return src;
}

export function VideoEmbed({
  src,
  title = "Video",
  className,
  aspectRatio = "16/9",
  html,
  provider,
  autoplay = false,
  mute = false,
}: VideoEmbedProps) {
  if (html) {
    return (
      <div
        className={cn(
          "overflow-hidden bg-black [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (!src) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center bg-[var(--np-border)] text-sm text-[var(--np-muted)]",
          className,
        )}
      >
        No video available
      </div>
    );
  }

  const embedSrc = toEmbedUrl(src, provider, { autoplay, mute });
  const aspectClass =
    aspectRatio === "4/3"
      ? "aspect-[4/3]"
      : aspectRatio === "1/1"
        ? "aspect-square"
        : aspectRatio === "9/16"
          ? "aspect-[9/16]"
          : "aspect-video";

  return (
    <div className={cn("overflow-hidden bg-black", aspectClass, className)}>
      <iframe
        src={embedSrc}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
