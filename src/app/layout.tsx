import type { Metadata } from "next";
import {
  Source_Serif_4,
  Source_Sans_3,
  Geist,
  Geist_Mono,
} from "next/font/google";
import { ThemeProvider, ThemeStyleTag } from "@/providers/theme-provider";
import { AppApolloProvider as ApolloProvider } from "@/providers/apollo-provider";
import { themeConfig, getCssVariables } from "@/config/theme";
import { buildPageMetadata } from "@/seo/metadata";
import {
  organizationJsonLd,
  websiteJsonLd,
  serializeJsonLd,
} from "@/seo/json-ld";
import { getSiteBranding } from "@/services/branding.service";
import { getSiteLocale } from "@/services/seo-settings.service";
import { absoluteUrl } from "@/utils/urls";
import { pwaIconPath } from "@/utils/pwa-icons";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "optional",
  adjustFontFallback: true,
});

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "optional",
  adjustFontFallback: true,
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "optional",
  adjustFontFallback: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "optional",
  adjustFontFallback: true,
});

export async function generateMetadata(): Promise<Metadata> {
  const [branding, locale] = await Promise.all([
    getSiteBranding({ revalidate: 300 }),
    getSiteLocale({ revalidate: 3600 }),
  ]);

  return buildPageMetadata({
    title: branding.siteName,
    description: branding.siteTagline || themeConfig.siteDescription,
    path: "/",
    image: branding.defaultOgImage || branding.logoUrl,
    siteName: branding.siteName,
    locale: locale.bcp47,
  });
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [branding, locale] = await Promise.all([
    getSiteBranding({ revalidate: 300 }),
    getSiteLocale({ revalidate: 3600 }),
  ]);
  const logoAbs = /^https?:\/\//i.test(branding.logoUrl)
    ? branding.logoUrl
    : absoluteUrl(branding.logoUrl);
  const icon192 = pwaIconPath(192);
  const icon512 = pwaIconPath(512);

  const orgLd = organizationJsonLd({
    name: branding.siteName,
    knowsLanguage: locale.bcp47,
    logo: {
      "@type": "ImageObject",
      url: logoAbs,
    },
  });
  const siteLd = websiteJsonLd({
    name: branding.siteName,
    inLanguage: locale.bcp47,
    publisher: {
      "@type": "NewsMediaOrganization",
      name: branding.siteName,
      logo: {
        "@type": "ImageObject",
        url: logoAbs,
      },
    },
  });

  return (
    <html
      lang={locale.htmlLang}
      className={`${sourceSerif.variable} ${sourceSans.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeStyleTag />
        <style
          id="np-root-font"
          dangerouslySetInnerHTML={{
            __html: `:root { ${getCssVariables()}; --np-image-placeholder: url(${JSON.stringify(branding.imagePlaceholder || themeConfig.imagePlaceholder)}); --font-heading: var(--font-serif), Georgia, serif; --font-body: var(--font-sans), system-ui, sans-serif; } body { font-family: var(--font-body); } .font-heading, h1, h2, h3 { font-family: var(--font-heading); }`,
          }}
        />
        <link rel="icon" href={icon192} type="image/png" sizes="192x192" />
        <link rel="icon" href={icon512} type="image/png" sizes="512x512" />
        <link rel="shortcut icon" href={icon192} type="image/png" />
        <link rel="apple-touch-icon" href={icon192} sizes="192x192" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(orgLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--np-background)] text-[var(--np-text)]">
        <ThemeProvider>
          <ApolloProvider>{children}</ApolloProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
