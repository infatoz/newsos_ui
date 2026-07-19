import { z } from "zod";

/**
 * Zod schema for required / typed NEXT_PUBLIC_* environment variables.
 * Defaults keep local development workable when `.env.local` is incomplete.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SITE_NAME: z.string().min(1).default("NewsPortal"),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),
  NEXT_PUBLIC_SITE_DESCRIPTION: z
    .string()
    .min(1)
    .default(
      "Breaking news, in-depth analysis, and live coverage from across India and the world.",
    ),
  NEXT_PUBLIC_META_KEYWORDS: z
    .string()
    .default(
      "news, india, breaking news, politics, business, sports, entertainment",
    ),
  NEXT_PUBLIC_LOGO: z.string().default("/logo.svg"),
  NEXT_PUBLIC_FAVICON: z.string().default("/favicon.ico"),
  NEXT_PUBLIC_PRIMARY_COLOR: z.string().default("#0B1F3A"),
  NEXT_PUBLIC_SECONDARY_COLOR: z.string().default("#C8102E"),
  NEXT_PUBLIC_BACKGROUND_COLOR: z.string().default("#F7F8FA"),
  NEXT_PUBLIC_TEXT_COLOR: z.string().default("#1A1A1A"),
  NEXT_PUBLIC_ACCENT_COLOR: z.string().default("#C8102E"),
  NEXT_PUBLIC_FONT: z.string().default("Source Serif 4, Georgia, serif"),
  NEXT_PUBLIC_FACEBOOK: z.string().default("https://facebook.com/newsportal"),
  NEXT_PUBLIC_X: z.string().default("https://x.com/newsportal"),
  NEXT_PUBLIC_INSTAGRAM: z
    .string()
    .default("https://instagram.com/newsportal"),
  NEXT_PUBLIC_YOUTUBE: z.string().default("https://youtube.com/@newsportal"),
  NEXT_PUBLIC_LINKEDIN: z
    .string()
    .default("https://linkedin.com/company/newsportal"),
  NEXT_PUBLIC_CONTACT_EMAIL: z
    .string()
    .min(1)
    .default("editor@newsportal.local"),
  NEXT_PUBLIC_PHONE: z.string().default("+91-11-4000-0000"),
  NEXT_PUBLIC_COPYRIGHT: z
    .string()
    .default("© NewsPortal. All rights reserved."),
  NEXT_PUBLIC_GOOGLE_ANALYTICS: z.string().optional().default(""),
  NEXT_PUBLIC_GTM: z.string().optional().default(""),
  NEXT_PUBLIC_ONESIGNAL: z.string().optional().default(""),
  NEXT_PUBLIC_GRAPHQL_ENDPOINT: z
    .string()
    .url()
    .default("http://localhost/graphql"),
  NEXT_PUBLIC_CDN_URL: z.string().optional().default(""),
  NEXT_PUBLIC_DEFAULT_AUTHOR: z.string().default("NewsPortal Staff"),
  NEXT_PUBLIC_DEFAULT_LANGUAGE: z.string().default("en-IN"),
  NEXT_PUBLIC_COUNTRY: z.string().default("IN"),
  NEXT_PUBLIC_TIMEZONE: z.string().default("Asia/Kolkata"),
  NEXT_PUBLIC_THEME: z.enum(["light", "dark", "system"]).default("light"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

function buildEnvInput(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SITE_DESCRIPTION: process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
    NEXT_PUBLIC_META_KEYWORDS: process.env.NEXT_PUBLIC_META_KEYWORDS,
    NEXT_PUBLIC_LOGO: process.env.NEXT_PUBLIC_LOGO,
    NEXT_PUBLIC_FAVICON: process.env.NEXT_PUBLIC_FAVICON,
    NEXT_PUBLIC_PRIMARY_COLOR: process.env.NEXT_PUBLIC_PRIMARY_COLOR,
    NEXT_PUBLIC_SECONDARY_COLOR: process.env.NEXT_PUBLIC_SECONDARY_COLOR,
    NEXT_PUBLIC_BACKGROUND_COLOR: process.env.NEXT_PUBLIC_BACKGROUND_COLOR,
    NEXT_PUBLIC_TEXT_COLOR: process.env.NEXT_PUBLIC_TEXT_COLOR,
    NEXT_PUBLIC_ACCENT_COLOR: process.env.NEXT_PUBLIC_ACCENT_COLOR,
    NEXT_PUBLIC_FONT: process.env.NEXT_PUBLIC_FONT,
    NEXT_PUBLIC_FACEBOOK: process.env.NEXT_PUBLIC_FACEBOOK,
    NEXT_PUBLIC_X: process.env.NEXT_PUBLIC_X,
    NEXT_PUBLIC_INSTAGRAM: process.env.NEXT_PUBLIC_INSTAGRAM,
    NEXT_PUBLIC_YOUTUBE: process.env.NEXT_PUBLIC_YOUTUBE,
    NEXT_PUBLIC_LINKEDIN: process.env.NEXT_PUBLIC_LINKEDIN,
    NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
    NEXT_PUBLIC_PHONE: process.env.NEXT_PUBLIC_PHONE,
    NEXT_PUBLIC_COPYRIGHT: process.env.NEXT_PUBLIC_COPYRIGHT,
    NEXT_PUBLIC_GOOGLE_ANALYTICS: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS,
    NEXT_PUBLIC_GTM: process.env.NEXT_PUBLIC_GTM,
    NEXT_PUBLIC_ONESIGNAL: process.env.NEXT_PUBLIC_ONESIGNAL,
    NEXT_PUBLIC_GRAPHQL_ENDPOINT: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
    NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
    NEXT_PUBLIC_DEFAULT_AUTHOR: process.env.NEXT_PUBLIC_DEFAULT_AUTHOR,
    NEXT_PUBLIC_DEFAULT_LANGUAGE: process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE,
    NEXT_PUBLIC_COUNTRY: process.env.NEXT_PUBLIC_COUNTRY,
    NEXT_PUBLIC_TIMEZONE: process.env.NEXT_PUBLIC_TIMEZONE,
    NEXT_PUBLIC_THEME: process.env.NEXT_PUBLIC_THEME,
    NODE_ENV: process.env.NODE_ENV,
  };
}

const parsed = envSchema.safeParse(buildEnvInput());

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment configuration. Check NEXT_PUBLIC_* vars.");
}

/** Validated environment object. */
export const env: Env = parsed.data;

export { envSchema };
