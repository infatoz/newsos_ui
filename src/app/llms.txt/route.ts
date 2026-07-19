import { themeConfig } from "@/config/theme";
import { getPosts } from "@/services/content.service";
import { getSiteBranding } from "@/services/branding.service";
import { getSeoSettings, getSiteLocale } from "@/services/seo-settings.service";
import { buildLlmsTxt, llmsTxtResponse } from "@/seo/llms-txt";

export const revalidate = 900;

/**
 * /llms.txt — AI-ready curated index (llmstxt.org) with latest news articles.
 * @see https://llmstxt.org/
 */
export async function GET() {
  const [branding, locale, seo, posts] = await Promise.all([
    getSiteBranding({ revalidate: 300 }),
    getSiteLocale({ revalidate: 3600 }),
    getSeoSettings({ revalidate: 300 }).catch(() => null),
    getPosts({ first: 30 }, { revalidate: 900 }).catch(() => ({
      nodes: [],
      pageInfo: undefined,
    })),
  ]);

  const wpOverride = seo?.llmsTxt?.trim() || "";
  // Full custom file from WP (starts with H1) replaces auto output.
  if (wpOverride.startsWith("#")) {
    return llmsTxtResponse(wpOverride);
  }

  const body = buildLlmsTxt({
    siteName: branding.siteName || themeConfig.siteName,
    siteDescription:
      branding.siteTagline || themeConfig.siteDescription,
    siteUrl: themeConfig.siteUrl,
    locale: locale.bcp47,
    country: themeConfig.country,
    timezone: themeConfig.timezone,
    contactEmail: themeConfig.contactEmail,
    phone: themeConfig.phone,
    posts: posts.nodes ?? [],
    publisherNotes: wpOverride || null,
  });

  return llmsTxtResponse(body);
}
