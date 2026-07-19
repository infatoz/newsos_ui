import { getSeoSettings } from "@/services/seo-settings.service";

export const revalidate = 3600;

/**
 * Apple App Site Association for Universal Links.
 * Served as application/json (no file extension on this path).
 */
export async function GET() {
  const seo = await getSeoSettings();
  const raw = seo.appleAppSiteAssociation?.trim();
  let body = "{}";

  if (raw) {
    try {
      JSON.parse(raw);
      body = raw;
    } catch {
      body = "{}";
    }
  }

  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
