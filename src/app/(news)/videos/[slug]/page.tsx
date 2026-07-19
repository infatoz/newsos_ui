import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShareButton } from "@/components/atoms/ShareButton";
import { Timestamp } from "@/components/atoms/Timestamp";
import { VideoPlayer } from "@/components/organisms/VideoPlayer";
import { getVideoBySlug } from "@/services/media.service";
import { getSiteBranding } from "@/services/branding.service";
import { getSiteLocale } from "@/services/seo-settings.service";
import { buildArticleMetadata } from "@/seo/metadata";
import { videoObjectJsonLd, breadcrumbJsonLd } from "@/seo/json-ld";
import { JsonLdScript } from "@/seo/JsonLdScript";
import { absoluteUrl } from "@/utils/urls";
import { stripHtml } from "@/lib/utils";
import { themeConfig } from "@/config/theme";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [video, branding, locale] = await Promise.all([
      getVideoBySlug(slug, { revalidate: 300 }),
      getSiteBranding({ revalidate: 300 }),
      getSiteLocale({ revalidate: 3600 }),
    ]);
    if (!video) return { title: `Videos | ${branding.siteName}` };
    const path = video.uri || `/videos/${slug}`;
    return buildArticleMetadata({
      headline: video.title,
      description: stripHtml(video.excerpt || ""),
      path,
      canonical: absoluteUrl(path),
      image:
        video.featuredImage?.node?.sourceUrl || branding.defaultOgImage,
      imageWidth: video.featuredImage?.node?.mediaDetails?.width,
      imageHeight: video.featuredImage?.node?.mediaDetails?.height,
      publishedTime: video.date,
      modifiedTime: video.modified || video.date,
      authors: video.author?.node?.name ? [video.author.node.name] : undefined,
      section: "Videos",
      tags: ["video"],
      siteName: branding.siteName,
      favicon: branding.logoUrl || branding.faviconUrl,
      locale: locale.bcp47,
    });
  } catch {
    return { title: themeConfig.siteName };
  }
}

export default async function VideoDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const [video, branding, locale] = await Promise.all([
    getVideoBySlug(slug, { revalidate: 300 }),
    getSiteBranding({ revalidate: 300 }),
    getSiteLocale({ revalidate: 3600 }),
  ]);
  if (!video) notFound();

  const image = video.featuredImage?.node;
  const pageUrl = absoluteUrl(video.uri || `/videos/${slug}`);
  const src = video.videoUrl || video.videoEmbed || "";

  const ld = videoObjectJsonLd({
    name: video.title,
    description: stripHtml(video.excerpt || video.title),
    thumbnailUrl:
      image?.sourceUrl || branding.defaultOgImage || absoluteUrl(themeConfig.logo),
    uploadDate: video.date || new Date().toISOString(),
    contentUrl: video.videoUrl,
    embedUrl: video.videoEmbed,
    duration:
      typeof video.videoDuration === "number"
        ? `PT${Math.max(1, Math.round(video.videoDuration))}S`
        : undefined,
    url: pageUrl,
    publisherName: branding.siteName,
    publisherLogoUrl: branding.logoUrl,
    inLanguage: locale.bcp47,
  });

  const crumbs = [
    { name: "Home", url: absoluteUrl("/") },
    { name: "Videos", url: absoluteUrl("/videos") },
    { name: video.title, url: pageUrl },
  ];

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <JsonLdScript data={ld} />
      <JsonLdScript data={breadcrumbJsonLd(crumbs)} />

      <nav aria-label="Breadcrumb" className="text-sm text-[var(--np-muted)]">
        <Link href="/" className="hover:text-[var(--np-accent)]">
          Home
        </Link>
        <span className="mx-1">/</span>
        <Link href="/videos" className="hover:text-[var(--np-accent)]">
          Videos
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--np-text)]">{video.title}</span>
      </nav>

      <header>
        <h1 className="font-heading text-3xl font-bold text-[var(--np-primary)]">
          {video.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          {video.date ? <Timestamp date={video.date} /> : null}
          {video.videoIsLive ? (
            <span className="bg-[var(--np-accent)] px-2 py-0.5 text-xs font-bold text-white">
              LIVE
            </span>
          ) : null}
          <ShareButton url={pageUrl} title={video.title} variant="labeled" />
        </div>
      </header>

      {src ? (
        <VideoPlayer
          src={src}
          title={video.title}
          embedHtml={video.videoEmbed}
          provider={video.videoProvider}
          poster={image?.sourceUrl}
        />
      ) : null}

      {video.content ? (
        <div
          className="prose prose-neutral max-w-none"
          dangerouslySetInnerHTML={{ __html: video.content }}
        />
      ) : null}

      {video.videoTranscript ? (
        <details className="border border-[var(--np-border)] p-4">
          <summary className="cursor-pointer font-semibold">Transcript</summary>
          <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--np-muted)]">
            {video.videoTranscript}
          </p>
        </details>
      ) : null}
    </article>
  );
}
