import { getSeoSettings } from "@/services/seo-settings.service";

export const revalidate = 3600;

/**
 * Digital Asset Links for Android App Links.
 * @see https://developers.google.com/digital-asset-links
 */
export async function GET() {
  const seo = await getSeoSettings();
  const raw = seo.assetlinksJson?.trim();
  let body = "[]";

  if (raw) {
    try {
      JSON.parse(raw);
      body = raw;
    } catch {
      body = "[]";
    }
  }

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
