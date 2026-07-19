import Link from "next/link";
import type { Post, RelatedPost, Story } from "@/types";
import { cn } from "@/lib/utils";

export interface MostReadWidgetProps {
  stories: Array<Story | RelatedPost | Post>;
  title?: string;
  period?: string | null;
  className?: string;
}

function hrefOf(s: Story | RelatedPost | Post): string {
  if ("href" in s && s.href) return s.href;
  if ("uri" in s && s.uri) return s.uri;
  return `/${s.slug}`;
}

export function MostReadWidget({
  stories,
  title = "Most read",
  period,
  className,
}: MostReadWidgetProps) {
  return (
    <aside
      className={cn(
        "border border-[var(--np-border)] bg-[var(--np-surface)] p-4",
        className,
      )}
    >
      <div className="mb-3 flex items-baseline justify-between gap-2 border-b border-[var(--np-border)] pb-2">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-[var(--np-primary)]">
          {title}
        </h2>
        {period ? (
          <span className="text-[10px] uppercase text-[var(--np-muted)]">
            {period}
          </span>
        ) : null}
      </div>
      {stories.length === 0 ? (
        <p className="text-sm text-[var(--np-muted)]">No data yet.</p>
      ) : (
        <ol className="flex flex-col gap-0">
          {stories.map((story, i) => (
            <li
              key={story.id}
              className="flex gap-3 border-b border-[var(--np-border)] py-2.5 last:border-0"
            >
              <span className="w-5 shrink-0 text-sm font-bold text-[var(--np-muted)] tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Link
                href={hrefOf(story)}
                className="text-sm font-medium leading-snug text-[var(--np-text)] hover:text-[var(--np-accent)]"
              >
                {story.title}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
