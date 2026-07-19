import { themeConfig } from "@/config/theme";
import { getSeoSettings } from "@/services/seo-settings.service";

export const revalidate = 3600;

/**
 * app-ads.txt for authorized mobile ad sellers.
 * Prefers WP seoSettings.appAdsTxt, then APP_ADS_TXT env.
 */
export async function GET() {
  const seo = await getSeoSettings();
  const fromWp = seo.appAdsTxt?.trim();
  const fromEnv = process.env.APP_ADS_TXT?.trim();
  const body =
    fromWp ||
    fromEnv ||
    [
      `# app-ads.txt for ${themeConfig.siteName}`,
      `# ${themeConfig.siteUrl}`,
      "",
    ].join("\n");

  return new Response(body.endsWith("\n") ? body : `${body}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
