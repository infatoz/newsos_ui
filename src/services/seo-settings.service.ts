import { GET_SEO_SETTINGS } from "@/graphql";
import type { GraphQLFetchOptions } from "@/lib/graphql-fetch";
import { themeConfig } from "@/config/theme";
import {
  defaultSiteLocale,
  resolveLocale,
  type SiteLocale,
} from "@/utils/locale";
import { fetchQuery } from "./graphql.helpers";

/** Public SEO / discovery settings from WP `seoSettings` (EnmSeoSettings). */
export interface SeoSettings {
  adsTxt: string;
  appAdsTxt: string;
  robotsTxt: string;
  assetlinksJson: string;
  appleAppSiteAssociation: string;
  enableAmp: boolean;
  ampArticleEnabled: boolean;
  ampStoriesEnabled: boolean;
  newsPublicationName: string;
  /** BCP-47 or ISO language from ENM SEO settings (source of truth). */
  newsPublicationLanguage: string;
  googleNewsLabels: string;
  sitemapNewsHours: number;
  enableNewsSitemap: boolean;
  enableImageSitemap: boolean;
  enableVideoSitemap: boolean;
  enableStoriesSitemap: boolean;
  enableDiscoverSitemap: boolean;
  enableDailyNewsSitemap: boolean;
  llmsTxt: string;
  shareWhatsapp: boolean;
  shareX: boolean;
  shareFacebook: boolean;
  shareCopy: boolean;
  googlePreferredSourceEnabled: boolean;
  googlePreferredSourceDomain: string;
  googlePreferredSourceLabel: string;
  googlePreferredSourceOnArticles: boolean;
  googlePreferredSourceUrl: string;
  articleFontEnabled: boolean;
  articleFontDefaultPx: number;
  articleFontMinPx: number;
  articleFontMaxPx: number;
  articleFontStepPx: number;
  articleFontLineHeight: number;
  articleFontScaleLineHeight: boolean;
  articleFontShowReset: boolean;
  articleFontShowSizeLabel: boolean;
  articleFontStorageKey: string;
  articleFontDecreaseLabel: string;
  articleFontIncreaseLabel: string;
  articleFontResetLabel: string;
  articleFontToolbarLabel: string;
  selectionToolbarEnabled: boolean;
  selectionSearchEnabled: boolean;
  selectionShareEnabled: boolean;
  selectionCopyEnabled: boolean;
  selectionSearchEngine: string;
  selectionMinChars: number;
  selectionSearchLabel: string;
  selectionShareLabel: string;
  selectionCopyLabel: string;
}

export function defaultSeoSettings(): SeoSettings {
  const locale = defaultSiteLocale();
  return {
    adsTxt: "",
    appAdsTxt: "",
    robotsTxt: "",
    assetlinksJson: "",
    appleAppSiteAssociation: "",
    enableAmp: true,
    ampArticleEnabled: true,
    ampStoriesEnabled: true,
    newsPublicationName: themeConfig.siteName,
    newsPublicationLanguage: locale.bcp47,
    googleNewsLabels: "",
    sitemapNewsHours: 48,
    enableNewsSitemap: true,
    enableImageSitemap: true,
    enableVideoSitemap: true,
    enableStoriesSitemap: true,
    enableDiscoverSitemap: true,
    enableDailyNewsSitemap: true,
    llmsTxt: "",
    shareWhatsapp: true,
    shareX: true,
    shareFacebook: true,
    shareCopy: true,
    googlePreferredSourceEnabled: true,
    googlePreferredSourceDomain: "",
    googlePreferredSourceLabel: "Set as preferred source on Google",
    googlePreferredSourceOnArticles: true,
    googlePreferredSourceUrl: "https://www.google.com/preferences/source",
    articleFontEnabled: true,
    articleFontDefaultPx: 17,
    articleFontMinPx: 14,
    articleFontMaxPx: 26,
    articleFontStepPx: 2,
    articleFontLineHeight: 1.75,
    articleFontScaleLineHeight: true,
    articleFontShowReset: true,
    articleFontShowSizeLabel: true,
    articleFontStorageKey: "np-article-font-size",
    articleFontDecreaseLabel: "A−",
    articleFontIncreaseLabel: "A+",
    articleFontResetLabel: "Reset",
    articleFontToolbarLabel: "Text size",
    selectionToolbarEnabled: true,
    selectionSearchEnabled: true,
    selectionShareEnabled: true,
    selectionCopyEnabled: true,
    selectionSearchEngine: "google",
    selectionMinChars: 3,
    selectionSearchLabel: "Search",
    selectionShareLabel: "Share",
    selectionCopyLabel: "Copy",
  };
}

interface SeoSettingsQuery {
  seoSettings?: Partial<SeoSettings> | null;
}

/**
 * Fetch SEO discovery settings with 1h revalidation.
 * Falls back to defaults when GraphQL is unavailable.
 */
export async function getSeoSettings(
  options?: GraphQLFetchOptions,
): Promise<SeoSettings> {
  const defaults = defaultSeoSettings();
  try {
    const data = await fetchQuery<SeoSettingsQuery>(
      GET_SEO_SETTINGS,
      {},
      {
        revalidate: 3600,
        tags: ["settings", "seo"],
        ...options,
      },
    );
    const s = data.seoSettings;
    if (!s) return defaults;

    const language = resolveLocale(
      s.newsPublicationLanguage?.trim() || defaults.newsPublicationLanguage,
    ).bcp47;

    return {
      adsTxt: s.adsTxt ?? defaults.adsTxt,
      appAdsTxt: s.appAdsTxt ?? defaults.appAdsTxt,
      robotsTxt: s.robotsTxt ?? defaults.robotsTxt,
      assetlinksJson: s.assetlinksJson ?? defaults.assetlinksJson,
      appleAppSiteAssociation:
        s.appleAppSiteAssociation ?? defaults.appleAppSiteAssociation,
      enableAmp: s.enableAmp ?? defaults.enableAmp,
      ampArticleEnabled: s.ampArticleEnabled ?? defaults.ampArticleEnabled,
      ampStoriesEnabled: s.ampStoriesEnabled ?? defaults.ampStoriesEnabled,
      newsPublicationName:
        s.newsPublicationName?.trim() || defaults.newsPublicationName,
      newsPublicationLanguage: language,
      googleNewsLabels: s.googleNewsLabels ?? defaults.googleNewsLabels,
      sitemapNewsHours:
        typeof s.sitemapNewsHours === "number" && s.sitemapNewsHours > 0
          ? s.sitemapNewsHours
          : defaults.sitemapNewsHours,
      enableNewsSitemap: s.enableNewsSitemap ?? defaults.enableNewsSitemap,
      enableImageSitemap: s.enableImageSitemap ?? defaults.enableImageSitemap,
      enableVideoSitemap: s.enableVideoSitemap ?? defaults.enableVideoSitemap,
      enableStoriesSitemap:
        s.enableStoriesSitemap ?? defaults.enableStoriesSitemap,
      enableDiscoverSitemap:
        s.enableDiscoverSitemap ?? defaults.enableDiscoverSitemap,
      enableDailyNewsSitemap:
        s.enableDailyNewsSitemap ?? defaults.enableDailyNewsSitemap,
      llmsTxt: s.llmsTxt ?? defaults.llmsTxt,
      shareWhatsapp: s.shareWhatsapp ?? defaults.shareWhatsapp,
      shareX: s.shareX ?? defaults.shareX,
      shareFacebook: s.shareFacebook ?? defaults.shareFacebook,
      shareCopy: s.shareCopy ?? defaults.shareCopy,
      googlePreferredSourceEnabled:
        s.googlePreferredSourceEnabled ??
        defaults.googlePreferredSourceEnabled,
      googlePreferredSourceDomain:
        s.googlePreferredSourceDomain?.trim() ||
        defaults.googlePreferredSourceDomain,
      googlePreferredSourceLabel:
        s.googlePreferredSourceLabel?.trim() ||
        defaults.googlePreferredSourceLabel,
      googlePreferredSourceOnArticles:
        s.googlePreferredSourceOnArticles ??
        defaults.googlePreferredSourceOnArticles,
      googlePreferredSourceUrl: resolvePreferredSourceUrl(
        s.googlePreferredSourceDomain,
        s.googlePreferredSourceUrl,
      ),
      articleFontEnabled: s.articleFontEnabled ?? defaults.articleFontEnabled,
      articleFontDefaultPx:
        typeof s.articleFontDefaultPx === "number"
          ? s.articleFontDefaultPx
          : defaults.articleFontDefaultPx,
      articleFontMinPx:
        typeof s.articleFontMinPx === "number"
          ? s.articleFontMinPx
          : defaults.articleFontMinPx,
      articleFontMaxPx:
        typeof s.articleFontMaxPx === "number"
          ? s.articleFontMaxPx
          : defaults.articleFontMaxPx,
      articleFontStepPx:
        typeof s.articleFontStepPx === "number"
          ? s.articleFontStepPx
          : defaults.articleFontStepPx,
      articleFontLineHeight:
        typeof s.articleFontLineHeight === "number"
          ? s.articleFontLineHeight
          : defaults.articleFontLineHeight,
      articleFontScaleLineHeight:
        s.articleFontScaleLineHeight ?? defaults.articleFontScaleLineHeight,
      articleFontShowReset:
        s.articleFontShowReset ?? defaults.articleFontShowReset,
      articleFontShowSizeLabel:
        s.articleFontShowSizeLabel ?? defaults.articleFontShowSizeLabel,
      articleFontStorageKey:
        s.articleFontStorageKey?.trim() || defaults.articleFontStorageKey,
      articleFontDecreaseLabel:
        s.articleFontDecreaseLabel?.trim() ||
        defaults.articleFontDecreaseLabel,
      articleFontIncreaseLabel:
        s.articleFontIncreaseLabel?.trim() ||
        defaults.articleFontIncreaseLabel,
      articleFontResetLabel:
        s.articleFontResetLabel?.trim() || defaults.articleFontResetLabel,
      articleFontToolbarLabel:
        s.articleFontToolbarLabel?.trim() || defaults.articleFontToolbarLabel,
      selectionToolbarEnabled:
        s.selectionToolbarEnabled ?? defaults.selectionToolbarEnabled,
      selectionSearchEnabled:
        s.selectionSearchEnabled ?? defaults.selectionSearchEnabled,
      selectionShareEnabled:
        s.selectionShareEnabled ?? defaults.selectionShareEnabled,
      selectionCopyEnabled:
        s.selectionCopyEnabled ?? defaults.selectionCopyEnabled,
      selectionSearchEngine:
        s.selectionSearchEngine?.trim() || defaults.selectionSearchEngine,
      selectionMinChars:
        typeof s.selectionMinChars === "number"
          ? s.selectionMinChars
          : defaults.selectionMinChars,
      selectionSearchLabel:
        s.selectionSearchLabel?.trim() || defaults.selectionSearchLabel,
      selectionShareLabel:
        s.selectionShareLabel?.trim() || defaults.selectionShareLabel,
      selectionCopyLabel:
        s.selectionCopyLabel?.trim() || defaults.selectionCopyLabel,
    };
  } catch {
    return defaults;
  }
}

function resolvePreferredSourceUrl(
  domain?: string | null,
  url?: string | null,
): string {
  const cleaned = domain?.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
  if (cleaned) {
    return `https://www.google.com/preferences/source?q=${encodeURIComponent(cleaned)}`;
  }
  if (url?.includes("?q=")) return url;
  try {
    const host = new URL(themeConfig.siteUrl).hostname.replace(/^www\./i, "");
    if (host) {
      return `https://www.google.com/preferences/source?q=${encodeURIComponent(host)}`;
    }
  } catch {
    /* ignore */
  }
  return "https://www.google.com/preferences/source";
}

/**
 * Site locale from ENM SEO → theme fallback.
 * Use for html lang, OG, JSON-LD, News/Discover/Top Stories sitemaps.
 */
export async function getSiteLocale(
  options?: GraphQLFetchOptions,
): Promise<SiteLocale> {
  try {
    const seo = await getSeoSettings(options);
    return resolveLocale(seo.newsPublicationLanguage);
  } catch {
    return defaultSiteLocale();
  }
}
