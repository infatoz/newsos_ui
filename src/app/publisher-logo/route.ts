import { getSiteBranding } from "@/services/branding.service";
import { absoluteUrl } from "@/utils/urls";

export const revalidate = 3600;

/**
 * 96×96 raster publisher logo for AMP Web Stories (Google requires 1:1 ≥96px, no SVG).
 * Prefer WP icon/logo when raster; otherwise fall back to /publisher-logo.png.
 */
export async function GET() {
  const branding = await getSiteBranding({ revalidate: 3600 });
  const candidates = [branding.logoUrl, branding.faviconUrl, branding.defaultOgImage];

  for (const url of candidates) {
    if (!url) continue;
    const lower = url.toLowerCase();
    if (
      lower.includes(".png") ||
      lower.includes(".jpg") ||
      lower.includes(".jpeg") ||
      lower.includes(".webp") ||
      lower.includes(".gif")
    ) {
      return Response.redirect(url.startsWith("http") ? url : absoluteUrl(url), 302);
    }
  }

  return Response.redirect(absoluteUrl("/publisher-logo.png"), 302);
}
