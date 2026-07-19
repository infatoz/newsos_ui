import { themeConfig } from "@/config/theme";
import { getSeoSettings } from "@/services/seo-settings.service";

export const revalidate = 3600;

/**
 * ads.txt for authorized digital sellers.
 * Prefers WP seoSettings.adsTxt, then ADS_TXT env.
 */
export async function GET() {
  const seo = await getSeoSettings();
  const fromWp = seo.adsTxt?.trim();
  const fromEnv = process.env.ADS_TXT?.trim();
  const body =
    fromWp ||
    fromEnv ||
    [
      `# ads.txt for ${themeConfig.siteName}`,
      `# ${themeConfig.siteUrl}`,
      "google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0",
      "",
    ].join("\n");

  return new Response(body.endsWith("\n") ? body : `${body}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
