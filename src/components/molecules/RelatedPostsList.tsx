import Link from "next/link";
import type { RelatedPost, Story } from "@/types";
import { ArticleCard } from "@/components/molecules/ArticleCard";
import { cn } from "@/lib/utils";

export interface RelatedPostsListProps {
  posts: Array<RelatedPost | Story>;
  title?: string;
  variant?: "list" | "grid";
  className?: string;
}

export function RelatedPostsList({
  posts,
  title = "Related stories",
  variant = "list",
  className,
}: RelatedPostsListProps) {
  if (!posts.length) {
    return (
      <section className={cn("py-4", className)}>
        <h2 className="font-heading text-lg font-bold text-[var(--np-primary)]">
          {title}
        </h2>
        <p className="mt-2 text-sm text-[var(--np-muted)]">
          No related stories right now.
        </p>
      </section>
    );
  }

  return (
    <section className={cn("py-4", className)} aria-labelledby="related-heading">
      <div className="mb-3 flex items-baseline justify-between gap-2 border-b border-[var(--np-border)] pb-2">
        <h2
          id="related-heading"
          className="font-heading text-lg font-bold text-[var(--np-primary)]"
        >
          {title}
        </h2>
      </div>
      {variant === "grid" ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <ArticleCard article={post} variant="compact" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-[var(--np-border)]">
          {posts.map((post) => (
            <li key={post.id}>
              <ArticleCard article={post} variant="horizontal" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Minimal text-only related links for dense sidebars. */
export function RelatedPostsLinks({
  posts,
  className,
}: {
  posts: Array<Pick<RelatedPost, "id" | "title" | "uri" | "slug">>;
  className?: string;
}) {
  if (!posts.length) return null;

  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={post.uri ?? `/${post.slug}`}
            className="text-sm font-medium text-[var(--np-text)] hover:text-[var(--np-accent)]"
          >
            {post.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
