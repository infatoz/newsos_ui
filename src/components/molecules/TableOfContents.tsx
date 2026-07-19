"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface TableOfContentsProps {
  /** Pre-extracted headings; if omitted, scans `[data-article-body]`. */
  headings?: TocHeading[];
  className?: string;
  title?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function TableOfContents({
  headings: headingsProp,
  className,
  title = "In this article",
}: TableOfContentsProps) {
  const [scanned, setScanned] = useState<TocHeading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headingsProp?.length) return;

    const root = document.querySelector("[data-article-body]");
    if (!root) return;

    const nodes = root.querySelectorAll("h2, h3");
    const next: TocHeading[] = [];

    nodes.forEach((node) => {
      const el = node as HTMLElement;
      const text = el.textContent?.trim() ?? "";
      if (!text) return;
      if (!el.id) {
        el.id = slugify(text);
      }
      next.push({
        id: el.id,
        text,
        level: el.tagName === "H3" ? 3 : 2,
      });
    });

    setScanned(next);
  }, [headingsProp]);

  const headings = useMemo(
    () => (headingsProp?.length ? headingsProp : scanned),
    [headingsProp, scanned],
  );

  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 1] },
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) {
    return null;
  }

  return (
    <nav
      aria-label="Table of contents"
      className={cn(
        "sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto border border-[var(--np-border)] bg-[var(--np-surface)] p-4",
        className,
      )}
    >
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--np-primary)]">
        {title}
      </p>
      <ol className="flex flex-col gap-1.5">
        {headings.map((h) => (
          <li key={h.id} className={cn(h.level === 3 && "pl-3")}>
            <a
              href={`#${h.id}`}
              className={cn(
                "block text-sm leading-snug transition-colors",
                activeId === h.id
                  ? "font-semibold text-[var(--np-accent)]"
                  : "text-[var(--np-muted)] hover:text-[var(--np-primary)]",
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
