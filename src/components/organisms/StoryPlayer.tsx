"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StoryPageData } from "@/utils/story-pages";

export interface StoryPlayerProps {
  title: string;
  pages: StoryPageData[];
  coverUrl?: string | null;
  durationSec?: number;
  siteName?: string | null;
  logoUrl?: string | null;
  closeHref?: string;
  related?: Array<{
    id: string;
    title?: string | null;
    href: string;
    coverUrl?: string | null;
  }>;
}

/**
 * Full-viewport Web Story player (tap zones, progress, auto-advance).
 * Desktop: centered 9:16 frame on black; mobile: edge-to-edge.
 */
export function StoryPlayer({
  title,
  pages,
  coverUrl,
  durationSec = 5,
  siteName,
  logoUrl,
  closeHref = "/stories",
  related = [],
}: StoryPlayerProps) {
  const router = useRouter();
  const slides =
    pages.length > 0
      ? pages
      : [{ title, body: undefined, imageUrl: coverUrl ?? undefined }];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationMs = Math.max(2, durationSec) * 1000;

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, next));
      setIndex(clamped);
      setProgress(0);
      setFinished(false);
      setPaused(false);
    },
    [slides.length],
  );

  const next = useCallback(() => {
    if (index >= slides.length - 1) {
      setPaused(true);
      setProgress(100);
      setFinished(true);
      return;
    }
    go(index + 1);
  }, [go, index, slides.length]);

  const prev = useCallback(() => {
    if (finished) {
      setFinished(false);
      setPaused(false);
      setProgress(0);
      return;
    }
    go(index - 1);
  }, [finished, go, index]);

  useEffect(() => {
    if (paused || finished || slides.length === 0) return;
    const started = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - started;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);
      if (elapsed >= durationMs) {
        if (index < slides.length - 1) {
          go(index + 1);
        } else {
          setPaused(true);
          setProgress(100);
          setFinished(true);
        }
      }
    }, 50);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, paused, finished, durationMs, slides.length, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        router.push(closeHref);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, router, closeHref]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const slide = slides[index];
  const bg = slide?.imageUrl || coverUrl || "";

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black">
      <div
        className="relative h-full w-full max-w-none overflow-hidden bg-black text-white select-none md:aspect-[9/16] md:h-[100dvh] md:max-h-[100dvh] md:w-auto md:max-w-[min(100vw,calc(100dvh*9/16))] md:shadow-2xl"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        role="application"
        aria-label={title}
      >
        {/* Progress */}
        <div className="absolute inset-x-0 top-0 z-30 flex gap-1 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          {slides.map((_, i) => (
            <div
              key={`bar-${i}`}
              className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/35"
            >
              <div
                className="h-full bg-white transition-[width] duration-75"
                style={{
                  width:
                    i < index
                      ? "100%"
                      : i === index
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Top chrome */}
        <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-3 pb-2 pt-[max(1.75rem,calc(env(safe-area-inset-top)+1.25rem))]">
          <div className="flex min-w-0 items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover ring-1 ring-white/40"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {(siteName || "N").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold drop-shadow">
                {siteName || "News"}
              </p>
              <p className="truncate text-[10px] text-white/70">
                {index + 1} / {slides.length}
              </p>
            </div>
          </div>
          <Link
            href={closeHref}
            aria-label="Close story"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/35 text-xl leading-none text-white backdrop-blur-sm hover:bg-black/55"
            onClick={(e) => e.stopPropagation()}
          >
            ×
          </Link>
        </div>

        {bg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bg}
            alt={slide?.title || title}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-800 to-neutral-950" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/45" />

        {/* Tap zones */}
        <button
          type="button"
          aria-label="Previous page"
          className="absolute inset-y-0 left-0 z-20 w-[32%] cursor-pointer border-0 bg-transparent"
          onClick={prev}
        />
        <button
          type="button"
          aria-label="Next page"
          className="absolute inset-y-0 right-0 z-20 w-[68%] cursor-pointer border-0 bg-transparent"
          onClick={next}
        />

        {!finished ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 space-y-3 p-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <h1 className="font-heading text-2xl font-bold leading-tight drop-shadow-md sm:text-3xl">
              {slide?.title || title}
            </h1>
            {slide?.body ? (
              <p className="max-w-prose text-sm leading-relaxed text-white/95 drop-shadow sm:text-base">
                {slide.body}
              </p>
            ) : null}
            {slide?.link ? (
              <a
                href={slide.link}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto inline-flex bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-black"
                onClick={(e) => e.stopPropagation()}
              >
                {slide.linkLabel || "Read more"}
              </a>
            ) : null}
          </div>
        ) : (
          <div className="absolute inset-0 z-40 flex flex-col bg-black/80 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-24 backdrop-blur-sm">
            <h2 className="font-heading text-xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-white/70">You finished this story</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-black"
                onClick={() => go(0)}
              >
                Replay
              </button>
              <Link
                href={closeHref}
                className="border border-white/40 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white"
              >
                Close
              </Link>
            </div>
            {related.length > 0 ? (
              <section className="mt-8 min-h-0 flex-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
                  More stories
                </h3>
                <ul className="mt-3 flex gap-3 overflow-x-auto pb-2">
                  {related.map((item) => (
                    <li key={item.id} className="w-28 shrink-0">
                      <Link href={item.href} className="block">
                        {item.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.coverUrl}
                            alt=""
                            className="aspect-[9/16] w-full object-cover"
                          />
                        ) : (
                          <div className="aspect-[9/16] bg-white/10" />
                        )}
                        <span className="mt-1.5 line-clamp-2 block text-xs font-medium">
                          {item.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
