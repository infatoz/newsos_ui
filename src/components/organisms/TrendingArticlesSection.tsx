import { ArticleCard } from "@/components/molecules/ArticleCard";
import type { Post } from "@/types";
import { cn } from "@/lib/utils";

export interface TrendingArticlesSectionProps {
  posts: Post[];
  title?: string;
  description?: string;
  className?: string;
  /** Max posts to show (default 10). */
  limit?: number;
}

/**
 * Ranked grid of trending / latest stories for empty search & 404 states.
 */
export function TrendingArticlesSection({
  posts,
  title = "Trending now",
  description,
  className,
  limit = 10,
}: TrendingArticlesSectionProps) {
  const items = posts.slice(0, limit);
  if (items.length === 0) return null;

  return (
    <section className={cn("space-y-4", className)} aria-labelledby="trending-heading">
      <div className="border-b border-[var(--np-border)] pb-3">
        <h2
          id="trending-heading"
          className="font-heading text-xl font-bold text-[var(--np-primary)] sm:text-2xl"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--np-muted)]">{description}</p>
        ) : null}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((post, i) => (
          <li key={post.id} className={i === 0 ? "sm:col-span-2 lg:col-span-1" : undefined}>
            <ArticleCard
              article={post}
              variant={i === 0 ? "featured" : "compact"}
              showExcerpt={i < 3}
              priority={i === 0}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
