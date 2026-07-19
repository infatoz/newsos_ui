import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ArticleLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  className?: string;
  /** Sticky sidebar on desktop. */
  stickySidebar?: boolean;
}

export function ArticleLayout({
  children,
  sidebar,
  className,
  stickySidebar = true,
}: ArticleLayoutProps) {
  return (
    <div
      className={cn(
        "grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]",
        className,
      )}
    >
      <article className="min-w-0">{children}</article>
      {sidebar ? (
        <aside
          className={cn(
            "min-w-0 space-y-6",
            stickySidebar && "lg:sticky lg:top-20 lg:self-start",
          )}
        >
          {sidebar}
        </aside>
      ) : null}
    </div>
  );
}
