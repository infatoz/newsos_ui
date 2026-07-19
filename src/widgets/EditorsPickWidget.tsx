import type { Post, RelatedPost, Story } from "@/types";
import { ArticleCard } from "@/components/molecules/ArticleCard";
import { cn } from "@/lib/utils";

export interface EditorsPickWidgetProps {
  stories: Array<Story | RelatedPost | Post>;
  title?: string;
  className?: string;
}

export function EditorsPickWidget({
  stories,
  title = "Editors’ picks",
  className,
}: EditorsPickWidgetProps) {
  return (
    <aside className={cn("", className)}>
      <h2 className="mb-3 border-b-2 border-[var(--np-accent)] pb-2 font-heading text-sm font-bold uppercase tracking-wider text-[var(--np-primary)]">
        {title}
      </h2>
      {stories.length === 0 ? (
        <p className="text-sm text-[var(--np-muted)]">No picks available.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--np-border)]">
          {stories.map((story) => (
            <li key={story.id}>
              <ArticleCard article={story} variant="horizontal" />
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
