import Link from "next/link";
import type { Post, RelatedPost } from "@/types";
import { cn } from "@/lib/utils";
import { contentPath } from "@/utils/urls";

export interface InArticleRelatedProps {
  posts: Array<RelatedPost | Post>;
  title?: string;
  className?: string;
}

/**
 * Mid-article “Also read” backlinks — title + link only (no thumbnails).
 */
export function InArticleRelated({
  posts,
  title = "Also read",
  className,
}: InArticleRelatedProps) {
  if (!posts.length) return null;

  return (
    <aside
      className={cn(
        "not-prose my-8 border-y border-[var(--np-border)] py-4",
        className,
      )}
      aria-label={title}
      data-in-article-related
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--np-muted)]">
        {title}
      </p>
      <ul className="mt-2 flex flex-col gap-2">
        {posts.map((post) => {
          const href = contentPath(post.uri, post.slug);

          return (
            <li key={post.id}>
              <Link
                href={href}
                className="font-heading text-sm font-semibold leading-snug text-[var(--np-primary)] underline-offset-2 hover:text-[var(--np-accent)] hover:underline"
              >
                {post.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
