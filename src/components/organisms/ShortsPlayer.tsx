"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  resolveShortMediaType,
  youtubeShortsEmbedUrl,
  type ShortMediaType,
} from "@/utils/shorts-media";

export interface ShortClip {
  id: string;
  /** On-screen title (post title). */
  title: string;
  /** Optional overlay description. */
  description?: string | null;
  /** YouTube or direct video URL (empty for image-only). */
  videoUrl?: string | null;
  posterUrl?: string | null;
  audioUrl?: string | null;
  mediaType?: ShortMediaType | string | null;
  source?: string | null;
  /** Optional related article / deep link. */
  articleUrl?: string | null;
  articleLabel?: string | null;
  /** @deprecated Prefer articleUrl */
  ctaUrl?: string | null;
  /** @deprecated Prefer articleLabel */
  ctaLabel?: string | null;
}

export interface ShortsPlayerProps {
  clips: ShortClip[];
  initialIndex?: number;
  className?: string;
}

function clipType(clip: ShortClip): ShortMediaType {
  return resolveShortMediaType({
    mediaType: clip.mediaType,
    source: clip.source,
    videoUrl: clip.videoUrl,
    posterUrl: clip.posterUrl,
  });
}

function articleHref(clip: ShortClip): string | null {
  const href = (clip.articleUrl || clip.ctaUrl || "").trim();
  return href || null;
}

function articleLabel(clip: ShortClip): string {
  return (clip.articleLabel || clip.ctaLabel || "Read article").trim();
}

/**
 * Vertical snap-scroll shorts player — YouTube, custom video, or image
 * with title, optional description, and optional article link.
 */
export function ShortsPlayer({
  clips,
  initialIndex = 0,
  className,
}: ShortsPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(initialIndex);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const sections = root.querySelectorAll<HTMLElement>("section[data-short-slide]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) continue;
          const index = Number(
            (entry.target as HTMLElement).dataset.index ?? 0,
          );
          setActive(index);
        }
      },
      { root, threshold: [0.6] },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [clips]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const videos = root.querySelectorAll<HTMLVideoElement>("video[data-short]");
    videos.forEach((video) => {
      const index = Number(video.dataset.index ?? -1);
      if (index === active) {
        video.muted = false;
        void video.play().catch(() => undefined);
      } else {
        video.pause();
        video.muted = true;
      }
    });

    const audios = root.querySelectorAll<HTMLAudioElement>("audio[data-short-audio]");
    audios.forEach((audio) => {
      const index = Number(audio.dataset.index ?? -1);
      if (index === active) {
        void audio.play().catch(() => undefined);
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }, [active, clips]);

  if (!clips.length) {
    return (
      <p className="p-8 text-center text-sm text-[var(--np-muted)]">
        No shorts available.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-[100dvh] w-full snap-y snap-mandatory overflow-y-auto bg-black",
        className,
      )}
    >
      {clips.map((clip, index) => {
        const type = clipType(clip);
        const isActive = index === active;
        const preloadNearby = Math.abs(index - active) <= 1;
        const href = articleHref(clip);
        const description = clip.description?.trim() || null;

        return (
          <section
            key={clip.id}
            data-short-slide
            data-index={index}
            data-media-type={type}
            className="relative flex h-[100dvh] w-full snap-start items-center justify-center overflow-hidden"
          >
            {type === "youtube" && clip.videoUrl ? (
              <YouTubeSlide
                url={clip.videoUrl}
                title={clip.title}
                posterUrl={clip.posterUrl}
                active={isActive}
                warm={preloadNearby}
              />
            ) : null}

            {type === "video" && clip.videoUrl ? (
              <video
                data-short
                data-index={index}
                className="h-full w-full object-contain"
                src={clip.videoUrl}
                poster={clip.posterUrl || undefined}
                playsInline
                loop
                muted={!isActive}
                controls={false}
                preload={preloadNearby ? "auto" : "metadata"}
              />
            ) : null}

            {type === "image" && clip.posterUrl ? (
              <div className="relative h-full w-full">
                <Image
                  src={clip.posterUrl}
                  alt={clip.title}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={index === 0}
                />
              </div>
            ) : null}

            {type === "image" && !clip.posterUrl ? (
              <div className="flex h-full w-full items-center justify-center bg-neutral-900 px-6 text-center text-sm text-white/70">
                No image available
              </div>
            ) : null}

            {clip.audioUrl && type === "image" ? (
              <audio
                data-short-audio
                data-index={index}
                src={clip.audioUrl}
                loop
                preload={preloadNearby ? "auto" : "none"}
              />
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 pt-28 text-white">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
                {type === "youtube"
                  ? "YouTube"
                  : type === "image"
                    ? "Image"
                    : "Video"}
              </p>
              <h2 className="font-heading text-lg font-semibold leading-snug sm:text-xl">
                {clip.title}
              </h2>
              {description ? (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85 line-clamp-3">
                  {description}
                </p>
              ) : null}
              {href ? (
                <Link
                  href={href}
                  className="pointer-events-auto mt-4 inline-block border border-white/50 bg-white/10 px-3 py-1.5 text-sm font-medium backdrop-blur-sm hover:bg-white/20"
                >
                  {articleLabel(clip)}
                </Link>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function YouTubeSlide({
  url,
  title,
  posterUrl,
  active,
  warm,
}: {
  url: string;
  title: string;
  posterUrl?: string | null;
  active: boolean;
  warm: boolean;
}) {
  const embed = youtubeShortsEmbedUrl(url, { autoplay: active, mute: true });
  const showIframe = Boolean(embed && (active || warm));

  return (
    <div className="relative h-full w-full bg-black">
      {posterUrl && !active ? (
        <Image
          src={posterUrl}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-90"
        />
      ) : null}
      {showIframe && embed ? (
        <iframe
          key={active ? "on" : "off"}
          src={embed}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : null}
    </div>
  );
}
