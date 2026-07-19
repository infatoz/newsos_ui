"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Home,
  Menu,
  Newspaper,
  Play,
  Radio,
  Search,
  Tv,
  User,
  type LucideIcon,
} from "lucide-react";
import type { MobileNavItem, MobileNavStyle } from "@/types";
import { cn } from "@/lib/utils";

export interface MobileBottomNavProps {
  items: MobileNavItem[];
  style?: MobileNavStyle | null;
  className?: string;
  /** Max tabs shown (default 6). */
  maxItems?: number;
}

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  newspaper: Newspaper,
  news: Newspaper,
  search: Search,
  live: Radio,
  tv: Tv,
  radio: Radio,
  user: User,
  account: User,
  profile: User,
  play: Play,
  video: Play,
  videos: Play,
  bookmark: Bookmark,
  saved: Bookmark,
  menu: Menu,
  more: Menu,
};

function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return Newspaper;
  const key = name.toLowerCase().replace(/^lucide-/, "");
  return ICON_MAP[key] ?? Newspaper;
}

function isTabActive(pathname: string, href: string): boolean {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({
  item,
  active,
}: {
  item: MobileNavItem;
  active: boolean;
}) {
  const svg = item.iconSvg?.trim();
  if (svg) {
    return (
      <span
        className="enm-mobile-nav-svg inline-flex size-5 items-center justify-center [&_svg]:size-5 [&_svg]:max-h-5 [&_svg]:max-w-5"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  const Icon = resolveIcon(item.icon);
  return <Icon className="size-5" aria-hidden strokeWidth={active ? 2.25 : 2} />;
}

export function MobileBottomNav({
  items,
  style,
  className,
  maxItems = 6,
}: MobileBottomNavProps) {
  const pathname = usePathname() || "/";
  const tabs = items.slice(0, maxItems);

  if (tabs.length === 0) {
    return null;
  }

  const cssVars = {
    ["--enm-nav-bg" as string]: style?.backgroundColor || "var(--np-surface)",
    ["--enm-nav-border" as string]: style?.borderColor || "var(--np-border)",
    ["--enm-nav-default" as string]: style?.textColor || "var(--np-muted)",
    ["--enm-nav-hover" as string]: style?.hoverColor || "var(--np-primary)",
    ["--enm-nav-active" as string]: style?.activeColor || "var(--np-accent)",
  };

  return (
    <nav
      aria-label="Mobile"
      style={cssVars}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-[var(--enm-nav-border)] bg-[var(--enm-nav-bg)] pb-[env(safe-area-inset-bottom)] lg:hidden",
        className,
      )}
    >
      <style>{`
        .enm-mobile-nav-svg svg { width: 1.25rem; height: 1.25rem; display: block; }
        .enm-mobile-nav-svg svg [fill]:not([fill="none"]) { fill: currentColor; }
        .enm-mobile-nav-svg svg [stroke]:not([stroke="none"]) { stroke: currentColor; }
      `}</style>
      <ul className="mx-auto grid max-w-lg grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
        {tabs.map((item) => {
          const active = item.isActive ?? isTabActive(pathname, item.href);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                target={item.target}
                className={cn(
                  "enm-mobile-nav-link flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "text-[var(--enm-nav-active)]"
                    : "text-[var(--enm-nav-default)] hover:text-[var(--enm-nav-hover)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="relative">
                  <NavIcon item={item} active={active} />
                  {item.badge ? (
                    <span className="absolute -top-1 -right-2 rounded-full bg-[var(--enm-nav-active)] px-1 text-[8px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
