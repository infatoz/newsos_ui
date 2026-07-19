import Link from "next/link";
import type { Tag } from "@/types";
import { cn } from "@/lib/utils";

export interface PopularTagsWidgetProps {
  tags: Tag[];
  title?: string;
  className?: string;
}

export function PopularTagsWidget({
  tags,
  title = "Popular topics",
  className,
}: PopularTagsWidgetProps) {
  if (!tags.length) return null;

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
      <ul className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag.id}>
            <Link
              href={tag.uri || `/tag/${tag.slug}`}
              className="inline-block border border-[var(--np-border)] px-2 py-1 text-xs font-medium text-[var(--np-text)] hover:border-[var(--np-accent)] hover:text-[var(--np-accent)]"
            >
              {tag.name}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
