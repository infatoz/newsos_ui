"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Post, RelatedPost, Story } from "@/types";
import { ArticleImage } from "@/components/atoms/ArticleImage";
import { Badge } from "@/components/atoms/Badge";
import { Timestamp } from "@/components/atoms/Timestamp";
import { cn } from "@/lib/utils";
import { stripHtml } from "@/lib/utils";

export type HeroSlide = Story | RelatedPost | Post;

export interface HeroSliderProps {
  slides: HeroSlide[];
  className?: string;
  autoPlayMs?: number;
}

function slideHref(slide: HeroSlide): string {
  if ("href" in slide && slide.href) return slide.href;
  if ("uri" in slide && slide.uri) return slide.uri;
  return `/${slide.slug}`;
}

function slideImage(slide: HeroSlide): string | null {
  if ("image" in slide && slide.image?.sourceUrl) return slide.image.sourceUrl;
  if ("featuredImage" in slide) return slide.featuredImage?.node?.sourceUrl ?? null;
  return null;
}

function slideCategory(slide: HeroSlide): string | null {
  if ("category" in slide && slide.category?.name) return slide.category.name;
  if ("categories" in slide) return slide.categories?.nodes?.[0]?.name ?? null;
  return null;
}

function slideDate(slide: HeroSlide): string | null | undefined {
  if ("publishedAt" in slide) return slide.publishedAt;
  if ("date" in slide) return slide.date;
  return undefined;
}

function slideExcerpt(slide: HeroSlide): string | null {
  return slide.excerpt ? stripHtml(slide.excerpt) : null;
}

export function HeroSlider({
  slides,
  className,
  autoPlayMs = 7000,
}: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (count === 0) return;
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count <= 1 || autoPlayMs <= 0) return;
    const id = window.setInterval(() => go(1), autoPlayMs);
    return () => window.clearInterval(id);
  }, [count, autoPlayMs, go]);

  if (count === 0) {
    return (
      <div
        className={cn(
          "flex aspect-[21/9] items-center justify-center bg-[var(--np-border)] text-sm text-[var(--np-muted)]",
          className,
        )}
      >
        No featured stories
      </div>
    );
  }

  const slide = slides[index]!;
  const href = slideHref(slide);
  const image = slideImage(slide);
  const category = slideCategory(slide);
  const date = slideDate(slide);
  const excerpt = slideExcerpt(slide);

  return (
    <section
      className={cn("relative overflow-hidden bg-[var(--np-primary)]", className)}
      aria-roledescription="carousel"
      aria-label="Featured stories"
    >
      <div className="relative aspect-[16/10] md:aspect-[21/9]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0"
          >
            <ArticleImage
              src={image}
              alt={slide.title}
              aspectRatio="auto"
              className="!absolute inset-0 h-full w-full !aspect-auto"
              preset="hero"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-8">
              <div className="mx-auto max-w-7xl">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {category ? <Badge variant="category">{category}</Badge> : null}
                  {date ? (
                    <Timestamp date={date} className="text-white/80" relative />
                  ) : null}
                </div>
                <h2 className="max-w-3xl font-heading text-2xl font-bold leading-tight text-white md:text-4xl">
                  <Link href={href} className="hover:underline">
                    {slide.title}
                  </Link>
                </h2>
                {excerpt ? (
                  <p className="mt-2 max-w-2xl line-clamp-2 text-sm text-white/85 md:text-base">
                    {excerpt}
                  </p>
                ) : null}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute top-1/2 left-2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute top-1/2 right-2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            aria-label="Next slide"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/50",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
