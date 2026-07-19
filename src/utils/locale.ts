import { themeConfig } from "@/config/theme";

/**
 * Site locale formats for Google News / Discover / Top Stories / OG / schema.
 *
 * - bcp47: `kn-IN` — html lang, JSON-LD inLanguage, RSS, dates, manifest
 * - ogLocale: `kn_IN` — Open Graph og:locale
 * - newsLanguage: `kn` — Google News sitemap `<news:language>` (ISO 639-1)
 * - htmlLang: same as bcp47
 */
export interface SiteLocale {
  /** Raw value from settings (normalized). */
  raw: string;
  /** BCP-47, e.g. kn-IN */
  bcp47: string;
  /** Open Graph locale, e.g. kn_IN */
  ogLocale: string;
  /** ISO 639-1 for Google News sitemaps, e.g. kn */
  newsLanguage: string;
  /** html[lang] */
  htmlLang: string;
}

const FALLBACK = "en-IN";

/**
 * Normalize WP / env language into consistent formats.
 * Accepts: kn, kn-IN, kn_IN, en, en-US, etc.
 * Bare codes (kn) expand with theme country when available (kn-IN).
 */
export function resolveLocale(input?: string | null): SiteLocale {
  const fallback = themeConfig.defaultLanguage?.trim() || FALLBACK;
  let raw = (input?.trim() || fallback).replace(/_/g, "-");

  const match = /^([A-Za-z]{2,3})(?:-([A-Za-z]{2,8}))?$/.exec(raw);
  if (!match) {
    raw = fallback.replace(/_/g, "-");
  }

  const parts = raw.split("-");
  const lang = (parts[0] || "en").toLowerCase();
  let region = parts[1] ? parts[1].toUpperCase() : "";
  if (!region && themeConfig.country?.trim()) {
    region = themeConfig.country.trim().toUpperCase().slice(0, 2);
  }
  const bcp47 = region ? `${lang}-${region}` : lang;

  return {
    raw: bcp47,
    bcp47,
    ogLocale: bcp47.replace(/-/g, "_"),
    newsLanguage: lang,
    htmlLang: bcp47,
  };
}

/** Sync fallback from theme when SEO language is empty. */
export function defaultSiteLocale(): SiteLocale {
  return resolveLocale(themeConfig.defaultLanguage);
}
