import type { MetadataRoute } from "next";
import { themeConfig } from "@/config/theme";
import { getSiteBranding } from "@/services/branding.service";
import { getSiteLocale } from "@/services/seo-settings.service";
import { pwaIconPath } from "@/utils/pwa-icons";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [locale, branding] = await Promise.all([
    getSiteLocale({ revalidate: 3600 }),
    getSiteBranding({ revalidate: 300 }),
  ]);

  // Relative paths + exact PNG sizes — avoids Chrome
  // "Resource size is not correct" when a CMS logo URL is used.
  const icon192 = pwaIconPath(192);
  const icon512 = pwaIconPath(512);

  return {
    id: "/",
    name: branding.siteName || themeConfig.siteName,
    short_name: (branding.siteName || themeConfig.siteName).slice(0, 12),
    description: branding.siteTagline || themeConfig.siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: themeConfig.backgroundColor,
    theme_color: themeConfig.primaryColor,
    lang: locale.bcp47,
    icons: [
      {
        src: icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
