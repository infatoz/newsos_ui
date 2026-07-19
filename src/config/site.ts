/**
 * Site metadata helpers re-exported from theme config.
 */

import { themeConfig, getCssVariables, type ThemeConfig } from "@/config/theme";

export { themeConfig, getCssVariables };
export type { ThemeConfig };

export const siteName = themeConfig.siteName;
export const siteUrl = themeConfig.siteUrl;
export const siteDescription = themeConfig.siteDescription;
export const siteLogo = themeConfig.logo;
export const siteFavicon = themeConfig.favicon;
/** Build-time fallback; prefer getSiteLocale() at runtime. */
export const defaultLanguage = themeConfig.defaultLanguage;
export const defaultAuthor = themeConfig.defaultAuthor;
export const timezone = themeConfig.timezone;
export const country = themeConfig.country;

export const socialLinks = {
  facebook: themeConfig.facebook,
  x: themeConfig.x,
  instagram: themeConfig.instagram,
  youtube: themeConfig.youtube,
  linkedin: themeConfig.linkedin,
} as const;

export const contactInfo = {
  email: themeConfig.contactEmail,
  phone: themeConfig.phone,
} as const;

export function getSiteMetadata() {
  return {
    name: themeConfig.siteName,
    url: themeConfig.siteUrl,
    description: themeConfig.siteDescription,
    keywords: themeConfig.metaKeywords,
    logo: themeConfig.logo,
    favicon: themeConfig.favicon,
    /** Prefer getSiteLocale() from SEO settings for live pages. */
    language: themeConfig.defaultLanguage,
    author: themeConfig.defaultAuthor,
    copyright: themeConfig.copyright,
    social: socialLinks,
    contact: contactInfo,
  };
}

export function getAbsoluteSiteUrl(path = "/"): string {
  const base = themeConfig.siteUrl.replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
