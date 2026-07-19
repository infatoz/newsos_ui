import type { ReactNode } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { getSiteBranding } from "@/services/branding.service";
import { getHomepageChrome } from "@/services/homepage.service";

export default async function NewsLayout({ children }: { children: ReactNode }) {
  const [branding, chrome] = await Promise.all([
    getSiteBranding({ revalidate: 300 }),
    getHomepageChrome({ revalidate: 300 }).catch(() => null),
  ]);

  return (
    <MainLayout
      logoUrl={branding.logoUrl}
      siteName={branding.siteName}
      siteDescription={branding.siteTagline}
      navItems={chrome?.navigation?.primary}
      utilityItems={chrome?.navigation?.utility}
      trendingItems={chrome?.navigation?.trending}
      mobileScrollItems={chrome?.navigation?.mobileScroll}
      footerGroups={chrome?.navigation?.footer}
      footerSettings={chrome?.navigation?.footerSettings}
      mobileNav={chrome?.navigation?.mobile}
      mobileNavStyle={chrome?.navigation?.mobileStyle}
    >
      {children}
    </MainLayout>
  );
}
