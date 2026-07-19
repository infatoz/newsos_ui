import type { ReactNode } from "react";
import type {
  DesktopNavItem,
  FooterNavGroup,
  FooterSettings,
  MobileNavItem,
  MobileNavStyle,
} from "@/types";
import { SiteHeader } from "@/components/organisms/SiteHeader";
import { SiteFooter } from "@/components/organisms/SiteFooter";
import { MobileBottomNav } from "@/components/organisms/MobileBottomNav";
import { cn } from "@/lib/utils";

export interface MainLayoutProps {
  children: ReactNode;
  /** Slot below header (e.g. breaking ticker). */
  topSlot?: ReactNode;
  navItems?: DesktopNavItem[];
  utilityItems?: DesktopNavItem[];
  trendingItems?: DesktopNavItem[];
  mobileScrollItems?: DesktopNavItem[];
  footerGroups?: FooterNavGroup[];
  footerSettings?: FooterSettings | null;
  mobileNav?: MobileNavItem[];
  mobileNavStyle?: MobileNavStyle | null;
  className?: string;
  showSearch?: boolean;
  logoUrl?: string | null;
  siteName?: string | null;
  siteDescription?: string | null;
}

export function MainLayout({
  children,
  topSlot,
  navItems,
  utilityItems,
  trendingItems,
  mobileScrollItems,
  footerGroups,
  footerSettings,
  mobileNav = [],
  mobileNavStyle = null,
  className,
  showSearch,
  logoUrl,
  siteName,
  siteDescription,
}: MainLayoutProps) {
  const hasMobileNav = mobileNav.length > 0;

  return (
    <div className={cn("flex min-h-dvh flex-col bg-[var(--np-background)]", className)}>
      <SiteHeader
        navItems={navItems}
        utilityItems={utilityItems}
        trendingItems={trendingItems}
        mobileScrollItems={mobileScrollItems}
        showSearch={showSearch}
        logoUrl={logoUrl}
        siteName={siteName}
      />
      {topSlot ? <div className="w-full">{topSlot}</div> : null}
      <main
        className={cn(
          "mx-auto w-full max-w-7xl flex-1 px-4 py-4",
          hasMobileNav && "pb-20 lg:pb-4",
        )}
      >
        {children}
      </main>
      <SiteFooter
        groups={footerGroups}
        settings={footerSettings}
        logoUrl={logoUrl}
        siteName={siteName}
        siteDescription={siteDescription}
      />
      {hasMobileNav ? (
        <MobileBottomNav items={mobileNav} style={mobileNavStyle} />
      ) : null}
    </div>
  );
}
