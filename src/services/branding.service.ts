import { GET_SITE_SETTINGS } from "@/graphql";
import type { GraphQLFetchOptions } from "@/lib/graphql-fetch";
import { themeConfig } from "@/config/theme";
import { fetchQuery } from "./graphql.helpers";

export interface SiteBranding {
  siteName: string;
  siteTagline: string;
  logoUrl: string;
  faviconUrl: string;
  defaultOgImage: string;
  /** SVG/image used when posts lack featured + in-content images. */
  imagePlaceholder: string;
}

interface SiteSettingsQuery {
  siteSettings?: {
    siteName?: string | null;
    siteTagline?: string | null;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    defaultOgImage?: string | null;
    imagePlaceholder?: string | null;
  } | null;
  generalSettings?: {
    title?: string | null;
    description?: string | null;
  } | null;
}

/**
 * Resolve logo / favicon / name from WordPress (ENM + Site Icon / Customizer),
 * falling back to NEXT_PUBLIC_* theme env values.
 */
export async function getSiteBranding(
  options?: GraphQLFetchOptions,
): Promise<SiteBranding> {
  try {
    const data = await fetchQuery<SiteSettingsQuery>(
      GET_SITE_SETTINGS,
      {},
      {
        revalidate: 300,
        tags: ["settings", "branding"],
        ...options,
      },
    );

    const settings = data.siteSettings;
    const general = data.generalSettings;

    const logoUrl =
      settings?.logoUrl?.trim() || themeConfig.logo;
    // Favicon follows the configured logo when no dedicated favicon is set.
    const faviconUrl =
      settings?.faviconUrl?.trim() ||
      logoUrl ||
      themeConfig.favicon ||
      themeConfig.logo;

    return {
      siteName:
        settings?.siteName?.trim() ||
        general?.title?.trim() ||
        themeConfig.siteName,
      siteTagline:
        settings?.siteTagline?.trim() ||
        general?.description?.trim() ||
        themeConfig.siteDescription,
      logoUrl,
      faviconUrl,
      defaultOgImage:
        settings?.defaultOgImage?.trim() || logoUrl,
      imagePlaceholder:
        settings?.imagePlaceholder?.trim() ||
        themeConfig.imagePlaceholder ||
        "/image-placeholder.svg",
    };
  } catch {
    const logoUrl = themeConfig.logo;
    return {
      siteName: themeConfig.siteName,
      siteTagline: themeConfig.siteDescription,
      logoUrl,
      faviconUrl: themeConfig.favicon || logoUrl,
      defaultOgImage: logoUrl,
      imagePlaceholder:
        themeConfig.imagePlaceholder || "/image-placeholder.svg",
    };
  }
}
