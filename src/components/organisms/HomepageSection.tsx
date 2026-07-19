import Link from "next/link";
import type { Post, RelatedPost, Story } from "@/types";
import { ArticleCard, type ArticleCardVariant } from "@/components/molecules/ArticleCard";
import { cn } from "@/lib/utils";

export interface HomepageSectionProps {
  title: string;
  subtitle?: string | null;
  stories: Array<Story | RelatedPost | Post>;
  viewAllHref?: string | null;
  layout?: "grid" | "list" | "magazine";
  cardVariant?: ArticleCardVariant;
  className?: string;
  /** First card featured in magazine layout. */
  featuredFirst?: boolean;
}

export function HomepageSection({
  title,
  subtitle,
  stories,
  viewAllHref,
  layout = "grid",
  cardVariant,
  className,
  featuredFirst = true,
}: HomepageSectionProps) {
  return (
    <section
      className={cn("py-6", className)}
      aria-labelledby={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <header className="mb-4 flex items-end justify-between gap-3 border-b-2 border-[var(--np-primary)] pb-2">
        <div>
          <h2
            id={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}
            className="font-heading text-xl font-bold text-[var(--np-primary)] md:text-2xl"
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-[var(--np-muted)]">{subtitle}</p>
          ) : null}
        </div>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--np-accent)] hover:underline"
          >
            View all
          </Link>
        ) : null}
      </header>

      {stories.length === 0 ? (
        <p className="text-sm text-[var(--np-muted)]">No stories in this section.</p>
      ) : layout === "list" ? (
        <ul className="divide-y divide-[var(--np-border)]">
          {stories.map((story) => (
            <li key={story.id}>
              <ArticleCard
                article={story}
                variant={cardVariant ?? "horizontal"}
              />
            </li>
          ))}
        </ul>
      ) : layout === "magazine" && featuredFirst && stories.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <ArticleCard
            article={stories[0]!}
            variant="featured"
            showExcerpt
            priority
          />
          <ul className="flex flex-col divide-y divide-[var(--np-border)]">
            {stories.slice(1).map((story) => (
              <li key={story.id}>
                <ArticleCard article={story} variant="horizontal" />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story, i) => (
            <li key={story.id}>
              <ArticleCard
                article={story}
                variant={cardVariant ?? "compact"}
                priority={i === 0}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
