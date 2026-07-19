import Link from "next/link";
import type { Post, RelatedPost, Story } from "@/types";
import { cn } from "@/lib/utils";
import { stripHtml } from "@/lib/utils";

export interface TrendingWidgetProps {
  stories: Array<Story | RelatedPost | Post>;
  title?: string;
  className?: string;
}

function hrefOf(s: Story | RelatedPost | Post): string {
  if ("href" in s && s.href) return s.href;
  if ("uri" in s && s.uri) return s.uri;
  return `/${s.slug}`;
}

export function TrendingWidget({
  stories,
  title = "Trending",
  className,
}: TrendingWidgetProps) {
  return (
    <aside
      className={cn(
        "border border-[var(--np-border)] bg-[var(--np-surface)] p-4",
        className,
      )}
    >
      <h2 className="mb-3 border-b border-[var(--np-border)] pb-2 font-heading text-sm font-bold uppercase tracking-wider text-[var(--np-primary)]">
        {title}
      </h2>
      {stories.length === 0 ? (
        <p className="text-sm text-[var(--np-muted)]">Nothing trending yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {stories.map((story, i) => (
            <li key={story.id} className="flex gap-3">
              <span className="w-6 shrink-0 font-heading text-xl font-bold text-[var(--np-accent)] tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0">
                <Link
                  href={hrefOf(story)}
                  className="text-sm font-semibold leading-snug text-[var(--np-text)] hover:text-[var(--np-accent)]"
                >
                  {story.title}
                </Link>
                {story.excerpt ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-[var(--np-muted)]">
                    {stripHtml(story.excerpt)}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
