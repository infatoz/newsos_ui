import { themeConfig } from "@/config/theme";
import { getPosts } from "@/services/content.service";
import { getSiteBranding } from "@/services/branding.service";
import { getSiteLocale } from "@/services/seo-settings.service";
import { buildLlmsFullTxt, llmsTxtResponse } from "@/seo/llms-txt";

export const revalidate = 900;

/**
 * /llms-full.txt — expanded AI-ready summaries of latest news articles.
 * Companion to /llms.txt (index).
 */
export async function GET() {
  const [branding, locale, posts] = await Promise.all([
    getSiteBranding({ revalidate: 300 }),
    getSiteLocale({ revalidate: 3600 }),
    getPosts({ first: 40 }, { revalidate: 900 }).catch(() => ({
      nodes: [],
      pageInfo: undefined,
    })),
  ]);

  const body = buildLlmsFullTxt({
    siteName: branding.siteName || themeConfig.siteName,
    siteDescription:
      branding.siteTagline || themeConfig.siteDescription,
    siteUrl: themeConfig.siteUrl,
    locale: locale.bcp47,
    posts: posts.nodes ?? [],
  });

  return llmsTxtResponse(body);
}
