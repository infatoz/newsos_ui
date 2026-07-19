"use client";

import { cn } from "@/lib/utils";
import { VideoEmbed } from "@/components/molecules/VideoEmbed";

export interface VideoPlayerProps {
  src: string;
  title?: string;
  embedHtml?: string | null;
  provider?: string | null;
  poster?: string | null;
  className?: string;
  /** Prefer native <video> for self-hosted MP4/WebM. */
  native?: boolean;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

/**
 * Video player — iframe embed for YouTube/Vimeo, native video for self-hosted.
 */
export function VideoPlayer({
  src,
  title = "Video",
  embedHtml,
  provider,
  poster,
  className,
  native,
}: VideoPlayerProps) {
  const useNative =
    native || provider === "self" || (!embedHtml && isDirectVideo(src));

  if (useNative && src) {
    return (
      <div className={cn("overflow-hidden bg-black aspect-video", className)}>
        <video
          className="h-full w-full"
          controls
          playsInline
          poster={poster || undefined}
          preload="metadata"
          title={title}
        >
          <source src={src} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <VideoEmbed
      src={src}
      title={title}
      html={embedHtml}
      provider={provider}
      className={className}
    />
  );
}
