"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PhotoGalleryItem } from "@/types";

export interface PhotoGalleryProps {
  items: PhotoGalleryItem[];
  title?: string;
  className?: string;
}

function slideHeading(item: PhotoGalleryItem): string {
  return (item.heading || item.caption || "").trim();
}

function slideDescription(item: PhotoGalleryItem): string {
  return (item.description || "").trim();
}

function slideAlt(item: PhotoGalleryItem, index: number): string {
  return (
    item.alt ||
    slideHeading(item) ||
    item.caption ||
    `Photo ${index + 1}`
  );
}

/**
 * Photo story viewer: sequential photos with N/total, heading, optional description.
 */
export function PhotoGallery({ items, title, className }: PhotoGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const total = items.length;

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(() => {
    setOpenIndex((i) =>
      i === null ? null : (i - 1 + items.length) % items.length,
    );
  }, [items.length]);
  const next = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i + 1) % items.length));
  }, [items.length]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex, close, prev, next]);

  if (!items.length) {
    return (
      <p className="text-sm text-[var(--np-muted)]">No photos in this gallery.</p>
    );
  }

  const active = openIndex !== null ? items[openIndex] : null;
  const activeHeading = active ? slideHeading(active) : "";
  const activeDesc = active ? slideDescription(active) : "";

  return (
    <div className={cn("space-y-6", className)}>
      {title ? (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-xl font-bold text-[var(--np-primary)]">
            {title}
          </h2>
          <p className="text-sm text-[var(--np-muted)]">
            {total} photo{total === 1 ? "" : "s"}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--np-muted)]">
          {total} photo{total === 1 ? "" : "s"}
        </p>
      )}

      <ol className="space-y-10">
        {items.map((item, index) => {
          const heading = slideHeading(item);
          const description = slideDescription(item);
          const w = item.width || 1200;
          const h = item.height || 800;

          return (
            <li key={`${item.url}-${index}`} className="scroll-mt-24">
              <figure>
                <button
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  className="group relative block w-full overflow-hidden bg-[var(--np-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--np-accent)]"
                  aria-label={`View photo ${index + 1} of ${total}${heading ? `: ${heading}` : ""}`}
                >
                  <span className="absolute left-3 top-3 z-10 rounded-sm bg-black/70 px-2 py-1 text-xs font-semibold tabular-nums tracking-wide text-white">
                    {index + 1} / {total}
                  </span>
                  <Image
                    src={item.url}
                    alt={slideAlt(item, index)}
                    width={w}
                    height={h}
                    sizes="(max-width:768px) 100vw, 960px"
                    className="h-auto w-full object-cover transition group-hover:brightness-95"
                    priority={index === 0}
                  />
                </button>
                {(heading || description) && (
                  <figcaption className="mt-3 max-w-3xl">
                    {heading ? (
                      <h3 className="font-heading text-base font-semibold text-[var(--np-primary)] md:text-lg">
                        {heading}
                      </h3>
                    ) : null}
                    {description ? (
                      <p
                        className={cn(
                          "text-sm leading-relaxed text-[var(--np-muted)] md:text-[15px]",
                          heading ? "mt-1" : null,
                        )}
                      >
                        {description}
                      </p>
                    ) : null}
                  </figcaption>
                )}
              </figure>
            </li>
          );
        })}
      </ol>

      {active && openIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${openIndex + 1} of ${total}`}
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
            <p className="text-sm font-semibold tabular-nums tracking-wide">
              {openIndex + 1} / {total}
            </p>
            <button
              type="button"
              className="text-2xl leading-none text-white/90 hover:text-white"
              onClick={close}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-12 pb-4">
            <button
              type="button"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 px-3 py-2 text-3xl text-white/80 hover:text-white md:left-4"
              onClick={prev}
              aria-label="Previous photo"
            >
              ‹
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={slideAlt(active, openIndex)}
              className="max-h-[75vh] max-w-full object-contain"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 px-3 py-2 text-3xl text-white/80 hover:text-white md:right-4"
              onClick={next}
              aria-label="Next photo"
            >
              ›
            </button>
          </div>

          {(activeHeading || activeDesc) && (
            <div className="mx-auto max-w-2xl px-4 pb-8 text-center text-white">
              {activeHeading ? (
                <h3 className="font-heading text-lg font-semibold">
                  {activeHeading}
                </h3>
              ) : null}
              {activeDesc ? (
                <p className="mt-1 text-sm text-white/75">{activeDesc}</p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
