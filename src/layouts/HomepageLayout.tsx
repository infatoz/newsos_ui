import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface HomepageLayoutProps {
  children: ReactNode;
  /** Optional right column (trending, ads). */
  sidebar?: ReactNode;
  /** Full-bleed slot above the grid (hero, breaking ticker). */
  top?: ReactNode;
  className?: string;
}

export function HomepageLayout({
  children,
  sidebar,
  top,
  className,
}: HomepageLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {top ? <div className="-mx-4 md:mx-0">{top}</div> : null}
      <div
        className={cn(
          "grid gap-8",
          sidebar && "lg:grid-cols-[minmax(0,1fr)_300px]",
        )}
      >
        <div className="min-w-0 space-y-2">{children}</div>
        {sidebar ? (
          <aside className="min-w-0 space-y-6 lg:sticky lg:top-20 lg:self-start">
            {sidebar}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
