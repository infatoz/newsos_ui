import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShortsPlayer, type ShortClip } from "@/components/organisms/ShortsPlayer";
import { getShortBySlug, getShorts } from "@/services/media.service";
import { getSiteBranding } from "@/services/branding.service";
import { getSiteLocale } from "@/services/seo-settings.service";
import { buildArticleMetadata } from "@/seo/metadata";
import { videoObjectJsonLd } from "@/seo/json-ld";
import { JsonLdScript } from "@/seo/JsonLdScript";
import { absoluteUrl } from "@/utils/urls";
import { stripHtml } from "@/lib/utils";
import { themeConfig } from "@/config/theme";
import {
  resolveShortMediaType,
  shortHasPlayableMedia,
  shortPosterUrl,
} from "@/utils/shorts-media";
import type { Short } from "@/types";

export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

function toClip(short: Short): ShortClip {
  const poster = shortPosterUrl(short);
  const articleUrl =
    short.shortArticleUrl?.trim() || short.shortCtaUrl?.trim() || null;
  const articleLabel =
    short.shortArticleLabel?.trim() || short.shortCtaLabel?.trim() || null;

  return {
    id: short.id,
    title: short.title,
    description: short.shortDescription?.trim() || null,
    videoUrl: short.shortVideoUrl,
    posterUrl: poster,
    audioUrl: short.shortAudioUrl,
    mediaType: resolveShortMediaType({
      mediaType: short.shortMediaType,
      source: short.shortSource,
      videoUrl: short.shortVideoUrl,
      posterUrl: poster,
    }),
    source: short.shortSource,
    articleUrl,
    articleLabel,
    ctaUrl: articleUrl,
    ctaLabel: articleLabel,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [short, branding, locale] = await Promise.all([
      getShortBySlug(slug, { revalidate: 60 }),
      getSiteBranding({ revalidate: 300 }),
      getSiteLocale({ revalidate: 3600 }),
    ]);
    if (!short) return { title: `Shorts | ${branding.siteName}` };
    const path = short.uri || `/shorts/${slug}`;
    return buildArticleMetadata({
      headline: short.title,
      description: stripHtml(short.excerpt || ""),
      path,
      canonical: absoluteUrl(path),
      image:
        short.shortPosterUrl ||
        short.featuredImage?.node?.sourceUrl ||
        branding.defaultOgImage,
      publishedTime: short.date,
      modifiedTime: short.modified || short.date,
      section: "Shorts",
      tags: ["short", "video"],
      siteName: branding.siteName,
      favicon: branding.logoUrl || branding.faviconUrl,
      locale: locale.bcp47,
    });
  } catch {
    return { title: themeConfig.siteName };
  }
}

export default async function ShortDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const [short, branding, locale] = await Promise.all([
    getShortBySlug(slug, { revalidate: 60 }),
    getSiteBranding({ revalidate: 300 }),
    getSiteLocale({ revalidate: 3600 }),
  ]);
  if (!short || !shortHasPlayableMedia(short)) notFound();

  const feed = await getShorts({ first: 20 }, { revalidate: 60 });
  const others = (feed.nodes ?? []).filter(
    (s) => s.id !== short.id && shortHasPlayableMedia(s),
  );

  const clips = [toClip(short), ...others.map(toClip)];
  const mediaType = resolveShortMediaType({
    mediaType: short.shortMediaType,
    source: short.shortSource,
    videoUrl: short.shortVideoUrl,
    posterUrl: shortPosterUrl(short),
  });

  const pageUrl = absoluteUrl(short.uri || `/shorts/${slug}`);
  const thumb =
    shortPosterUrl(short) ||
    branding.defaultOgImage ||
    absoluteUrl(themeConfig.logo);

  const ld =
    mediaType === "image"
      ? null
      : videoObjectJsonLd({
          name: short.title,
          description: stripHtml(short.excerpt || short.title),
          thumbnailUrl: thumb,
          uploadDate: short.date || new Date().toISOString(),
          contentUrl: short.shortVideoUrl || undefined,
          embedUrl:
            mediaType === "youtube" && short.shortVideoUrl
              ? short.shortVideoUrl
              : undefined,
          duration:
            typeof short.shortDuration === "number" && short.shortDuration > 0
              ? `PT${Math.max(1, Math.round(short.shortDuration))}S`
              : undefined,
          url: pageUrl,
          publisherName: branding.siteName,
          publisherLogoUrl: branding.logoUrl,
          inLanguage: locale.bcp47,
        });

  return (
    <div className="fixed inset-0 z-40 bg-black">
      {ld ? <JsonLdScript data={ld} /> : null}
      <ShortsPlayer clips={clips} initialIndex={0} />
    </div>
  );
}
