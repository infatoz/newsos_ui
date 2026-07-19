/**
 * Theme & site configuration driven by NEXT_PUBLIC_* environment variables.
 * Defaults target a professional Indian newsroom aesthetic (deep navy / crimson).
 *
 * IMPORTANT: Each `process.env.NEXT_PUBLIC_*` must be referenced as a static
 * property (not `process.env[key]`). Next.js only inlines static accesses into
 * the client bundle — dynamic keys silently fall back on the client and cause
 * SSR/client mismatches (e.g. date locale hydration errors).
 */

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeConfig {
  siteName: string;
  siteUrl: string;
  siteDescription: string;
  metaKeywords: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  font: string;
  facebook: string;
  x: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  contactEmail: string;
  phone: string;
  copyright: string;
  googleAnalytics: string;
  gtm: string;
  onesignal: string;
  graphqlEndpoint: string;
  cdnUrl: string;
  defaultAuthor: string;
  defaultLanguage: string;
  country: string;
  timezone: string;
  theme: ThemeMode;
  /** Default image when posts have no featured / content image. */
  imagePlaceholder: string;
}

function env(value: string | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

function readThemeMode(value: string): ThemeMode {
  if (value === "dark" || value === "system") return value;
  return "light";
}

/** Typed theme / brand config with local-dev defaults when env is missing. */
export const themeConfig: ThemeConfig = {
  siteName: env(process.env.NEXT_PUBLIC_SITE_NAME, "NewsPortal"),
  siteUrl: env(process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000"),
  siteDescription: env(
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
    "Breaking news, in-depth analysis, and live coverage from across India and the world.",
  ),
  metaKeywords: env(
    process.env.NEXT_PUBLIC_META_KEYWORDS,
    "news, india, breaking news, politics, business, sports, entertainment",
  ),
  logo: env(process.env.NEXT_PUBLIC_LOGO, "/logo.svg"),
  favicon: env(process.env.NEXT_PUBLIC_FAVICON, "/favicon.ico"),
  primaryColor: env(process.env.NEXT_PUBLIC_PRIMARY_COLOR, "#0B1F3A"),
  secondaryColor: env(process.env.NEXT_PUBLIC_SECONDARY_COLOR, "#C8102E"),
  backgroundColor: env(process.env.NEXT_PUBLIC_BACKGROUND_COLOR, "#F7F8FA"),
  textColor: env(process.env.NEXT_PUBLIC_TEXT_COLOR, "#1A1A1A"),
  accentColor: env(process.env.NEXT_PUBLIC_ACCENT_COLOR, "#C8102E"),
  font: env(process.env.NEXT_PUBLIC_FONT, "Source Serif 4, Georgia, serif"),
  facebook: env(process.env.NEXT_PUBLIC_FACEBOOK, "https://facebook.com/newsportal"),
  x: env(process.env.NEXT_PUBLIC_X, "https://x.com/newsportal"),
  instagram: env(
    process.env.NEXT_PUBLIC_INSTAGRAM,
    "https://instagram.com/newsportal",
  ),
  youtube: env(process.env.NEXT_PUBLIC_YOUTUBE, "https://youtube.com/@newsportal"),
  linkedin: env(
    process.env.NEXT_PUBLIC_LINKEDIN,
    "https://linkedin.com/company/newsportal",
  ),
  contactEmail: env(
    process.env.NEXT_PUBLIC_CONTACT_EMAIL,
    "editor@newsportal.local",
  ),
  phone: env(process.env.NEXT_PUBLIC_PHONE, "+91-11-4000-0000"),
  copyright: env(
    process.env.NEXT_PUBLIC_COPYRIGHT,
    "© NewsPortal. All rights reserved.",
  ),
  googleAnalytics: env(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS, ""),
  gtm: env(process.env.NEXT_PUBLIC_GTM, ""),
  onesignal: env(process.env.NEXT_PUBLIC_ONESIGNAL, ""),
  graphqlEndpoint: env(
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
    "http://localhost/graphql",
  ),
  cdnUrl: env(process.env.NEXT_PUBLIC_CDN_URL, ""),
  defaultAuthor: env(process.env.NEXT_PUBLIC_DEFAULT_AUTHOR, "NewsPortal Staff"),
  defaultLanguage: env(process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE, "en-IN"),
  country: env(process.env.NEXT_PUBLIC_COUNTRY, "IN"),
  timezone: env(process.env.NEXT_PUBLIC_TIMEZONE, "Asia/Kolkata"),
  theme: readThemeMode(env(process.env.NEXT_PUBLIC_THEME, "light")),
  imagePlaceholder: env(
    process.env.NEXT_PUBLIC_IMAGE_PLACEHOLDER,
    "/image-placeholder.svg",
  ),
};

/**
 * Returns a CSS custom-properties string suitable for injection into `:root`.
 */
export function getCssVariables(): string {
  const {
    primaryColor,
    secondaryColor,
    backgroundColor,
    textColor,
    accentColor,
    font,
  } = themeConfig;

  return [
    `--np-primary: ${primaryColor}`,
    `--np-secondary: ${secondaryColor}`,
    `--np-background: ${backgroundColor}`,
    `--np-text: ${textColor}`,
    `--np-accent: ${accentColor}`,
    `--np-font: ${font}`,
    `--np-muted: color-mix(in srgb, ${textColor} 55%, ${backgroundColor})`,
    `--np-border: color-mix(in srgb, ${textColor} 12%, ${backgroundColor})`,
    `--np-surface: #ffffff`,
    `--np-surface-elevated: #ffffff`,
    `--np-breaking: ${secondaryColor}`,
    `--np-live: #B91C1C`,
    `--np-image-placeholder: url(${JSON.stringify(themeConfig.imagePlaceholder)})`,
    `--color-primary: ${primaryColor}`,
    `--color-secondary: ${secondaryColor}`,
    `--color-background: ${backgroundColor}`,
    `--color-foreground: ${textColor}`,
    `--color-accent: ${accentColor}`,
    `--primary: ${primaryColor}`,
    `--accent: ${accentColor}`,
    `--font-news: ${font}`,
  ].join("; ");
}

export default themeConfig;
