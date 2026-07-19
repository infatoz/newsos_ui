import Image from "next/image";
import Link from "next/link";
import type { Media } from "@/types";
import { cn } from "@/lib/utils";
import { getImageSizes } from "@/utils/images";

export interface WebStoryItem {
  id: string;
  title: string;
  href: string;
  cover?: Media | null;
  coverUrl?: string | null;
  category?: string | null;
}

export interface StoryCardProps {
  story: WebStoryItem;
  className?: string;
  priority?: boolean;
}

export function StoryCard({ story, className, priority = false }: StoryCardProps) {
  const src = story.cover?.sourceUrl ?? story.coverUrl ?? null;
  const sizes = getImageSizes(src, "card", { width: 360, height: 640 });

  return (
    <article
      className={cn(
        "group relative w-[140px] shrink-0 snap-start sm:w-[160px]",
        className,
      )}
    >
      <Link
        href={story.href}
        className="relative block aspect-[9/16] overflow-hidden rounded-xl bg-[var(--np-primary)] ring-2 ring-transparent transition ring-offset-2 group-hover:ring-[var(--np-accent)]"
      >
        {src ? (
          <Image
            src={sizes.src}
            alt={story.cover?.altText || story.title}
            fill
            sizes="160px"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--np-primary)] to-[var(--np-primary)]/70" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
          {story.category ? (
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/80">
              {story.category}
            </span>
          ) : null}
          <h3 className="line-clamp-3 text-sm font-semibold leading-snug text-white">
            {story.title}
          </h3>
        </div>
      </Link>
    </article>
  );
}
