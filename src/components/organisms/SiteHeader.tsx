"use client";

import Link from "next/link";
import { useState } from "react";
import type { DesktopNavItem } from "@/types";
import { Logo } from "@/components/atoms/Logo";
import { SearchForm } from "@/components/molecules/SearchForm";
import { CategoryNav } from "@/components/molecules/CategoryNav";
import { cn } from "@/lib/utils";

export interface SiteHeaderProps {
  navItems?: DesktopNavItem[];
  utilityItems?: DesktopNavItem[];
  trendingItems?: DesktopNavItem[];
  mobileScrollItems?: DesktopNavItem[];
  className?: string;
  showSearch?: boolean;
  logoUrl?: string | null;
  siteName?: string | null;
}

function itemHref(item: DesktopNavItem): string {
  return item.href || "/";
}

function DesktopDropdown({ item }: { item: DesktopNavItem }) {
  const children = item.children ?? [];
  if (children.length === 0) {
    return (
      <Link
        href={itemHref(item)}
        target={item.target}
        className="block px-2.5 py-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--np-primary)] transition-colors hover:text-[var(--np-accent)]"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <Link
        href={itemHref(item)}
        target={item.target}
        className="flex items-center gap-1 px-2.5 py-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--np-primary)] transition-colors hover:text-[var(--np-accent)]"
        aria-haspopup="true"
      >
        {item.label}
        <span className="text-[10px] opacity-60" aria-hidden>
          ▾
        </span>
      </Link>
      <ul
        className="invisible absolute left-0 top-full z-50 min-w-[200px] border border-[var(--np-border)] bg-[var(--np-surface)] py-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
        role="menu"
      >
        {children.map((child) => (
          <li key={child.id} role="none">
            <Link
              href={itemHref(child)}
              target={child.target}
              role="menuitem"
              className="block px-4 py-2 text-sm text-[var(--np-text)] hover:bg-[var(--np-background)] hover:text-[var(--np-accent)]"
            >
              {child.label}
            </Link>
            {child.children && child.children.length > 0 ? (
              <ul className="border-t border-[var(--np-border)] bg-[var(--np-background)]/50 py-1">
                {child.children.map((grand) => (
                  <li key={grand.id}>
                    <Link
                      href={itemHref(grand)}
                      target={grand.target}
                      className="block px-6 py-1.5 text-xs text-[var(--np-muted)] hover:text-[var(--np-accent)]"
                    >
                      {grand.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteHeader({
  navItems = [],
  utilityItems = [],
  trendingItems = [],
  mobileScrollItems = [],
  className,
  showSearch = true,
  logoUrl,
  siteName,
}: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollItems =
    mobileScrollItems.length > 0 ? mobileScrollItems : navItems;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-[var(--np-border)] bg-[var(--np-surface)]/95 backdrop-blur-sm",
        className,
      )}
    >
      {/* Top utility bar — News18 / TOI style */}
      {utilityItems.length > 0 ? (
        <div className="hidden border-b border-[var(--np-border)] bg-[var(--np-background)] md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--np-muted)]">
            <span className="truncate text-[var(--np-muted)]/80">
              {siteName || "News"}
            </span>
            <nav aria-label="Top links" className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
              {utilityItems.map((item) => (
                <Link
                  key={item.id}
                  href={itemHref(item)}
                  target={item.target}
                  className="hover:text-[var(--np-accent)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}

      {/* Logo + desktop nav + search */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 lg:gap-4 lg:py-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center border border-[var(--np-border)] text-[var(--np-primary)] lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span aria-hidden className="text-lg leading-none">
            {mobileOpen ? "✕" : "☰"}
          </span>
        </button>

        <Logo
          priority
          className="shrink-0"
          src={logoUrl}
          siteName={siteName}
        />

        <nav
          aria-label="Primary"
          className="hidden min-w-0 flex-1 lg:block"
        >
          {navItems.length > 0 ? (
            <ul className="flex items-center gap-0.5">
              {navItems.map((item) => (
                <li key={item.id} className="shrink-0">
                  <DesktopDropdown item={item} />
                </li>
              ))}
            </ul>
          ) : null}
        </nav>

        {showSearch ? (
          <div className="ml-auto shrink-0">
            <SearchForm variant="header" />
          </div>
        ) : null}
      </div>

      {/* Mobile drawer — full desktop menu on small screens */}
      {mobileOpen && navItems.length > 0 ? (
        <nav
          id="mobile-nav-drawer"
          aria-label="Mobile menu"
          className="max-h-[70vh] overflow-y-auto border-t border-[var(--np-border)] bg-[var(--np-surface)] lg:hidden"
        >
          <ul className="divide-y divide-[var(--np-border)] px-2 py-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={itemHref(item)}
                  target={item.target}
                  className="block px-3 py-3 text-sm font-semibold uppercase tracking-wide text-[var(--np-primary)]"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
                {item.children && item.children.length > 0 ? (
                  <ul className="pb-2 pl-4">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={itemHref(child)}
                          target={child.target}
                          className="block px-3 py-1.5 text-sm text-[var(--np-muted)] hover:text-[var(--np-accent)]"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {/* Mobile / tablet horizontal scroll categories */}
      {scrollItems.length > 0 ? (
        <div className="border-t border-[var(--np-border)] bg-[var(--np-surface)] lg:hidden">
          <div className="mx-auto max-w-7xl px-2">
            <CategoryNav
              items={scrollItems}
              className="scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            />
          </div>
        </div>
      ) : null}

      {/* Trending strip — Google News / NDTV style */}
      {trendingItems.length > 0 ? (
        <div className="border-t border-[var(--np-border)] bg-[var(--np-background)]">
          <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 bg-[var(--np-accent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Trending
            </span>
            <nav aria-label="Trending" className="flex min-w-0 items-center gap-1">
              {trendingItems.map((item, index) => (
                <span key={item.id} className="flex shrink-0 items-center gap-1">
                  {index > 0 ? (
                    <span className="text-[var(--np-border)]" aria-hidden>
                      ·
                    </span>
                  ) : null}
                  <Link
                    href={itemHref(item)}
                    target={item.target}
                    className="whitespace-nowrap px-1.5 text-xs font-medium text-[var(--np-text)] hover:text-[var(--np-accent)]"
                  >
                    {item.label}
                  </Link>
                </span>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
