import Link from "next/link";
import type { Category, DesktopNavItem } from "@/types";
import { cn } from "@/lib/utils";

export interface CategoryNavProps {
  items: Array<
    | Pick<Category, "id" | "name" | "slug" | "uri">
    | Pick<DesktopNavItem, "id" | "label" | "href">
  >;
  activeSlug?: string;
  className?: string;
}

function getLabel(
  item: CategoryNavProps["items"][number],
): string {
  return "label" in item ? item.label : item.name;
}

function getHref(item: CategoryNavProps["items"][number]): string {
  if ("href" in item) return item.href;
  return item.uri ?? `/${item.slug}`;
}

function getSlug(item: CategoryNavProps["items"][number]): string {
  if ("slug" in item && item.slug) return item.slug;
  if ("href" in item) {
    return item.href.replace(/^\//, "").split("/")[0] ?? "";
  }
  return "";
}

export function CategoryNav({
  items,
  activeSlug,
  className,
}: CategoryNavProps) {
  if (!items.length) {
    return (
      <p className="text-sm text-[var(--np-muted)]">No categories available.</p>
    );
  }

  return (
    <nav aria-label="Categories" className={cn("overflow-x-auto", className)}>
      <ul className="flex items-center gap-1 border-b border-[var(--np-border)]">
        {items.map((item) => {
          const slug = getSlug(item);
          const isActive = Boolean(activeSlug && slug === activeSlug);
          return (
            <li key={item.id} className="shrink-0">
              <Link
                href={getHref(item)}
                className={cn(
                  "block border-b-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide whitespace-nowrap transition-colors",
                  isActive
                    ? "border-[var(--np-accent)] text-[var(--np-accent)]"
                    : "border-transparent text-[var(--np-primary)] hover:text-[var(--np-accent)]",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {getLabel(item)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
