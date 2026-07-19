import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShareButton } from "@/components/atoms/ShareButton";
import { Timestamp } from "@/components/atoms/Timestamp";
import { PhotoGallery } from "@/components/organisms/PhotoGallery";
import {
  getPhotoStoryBySlug,
  parsePhotoGallery,
} from "@/services/media.service";
import { getSiteBranding } from "@/services/branding.service";
import { getSiteLocale } from "@/services/seo-settings.service";
import { buildArticleMetadata } from "@/seo/metadata";
import {
  imageGalleryJsonLd,
  newsArticleJsonLd,
  breadcrumbJsonLd,
} from "@/seo/json-ld";
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
    const [photo, branding, locale] = await Promise.all([
      getPhotoStoryBySlug(slug, { revalidate: 300 }),
      getSiteBranding({ revalidate: 300 }),
      getSiteLocale({ revalidate: 3600 }),
    ]);
    if (!photo) return { title: `Photos | ${branding.siteName}` };
    const path = photo.uri || `/photos/${slug}`;
    return buildArticleMetadata({
      headline: photo.title,
      description: stripHtml(photo.excerpt || ""),
      path,
      canonical: absoluteUrl(path),
      image:
        photo.photoCoverUrl ||
        photo.featuredImage?.node?.sourceUrl ||
        branding.defaultOgImage,
      imageWidth: photo.featuredImage?.node?.mediaDetails?.width,
      imageHeight: photo.featuredImage?.node?.mediaDetails?.height,
      publishedTime: photo.date,
      modifiedTime: photo.modified || photo.date,
      authors: photo.author?.node?.name ? [photo.author.node.name] : undefined,
      section: "Photos",
      tags: ["photo story", "gallery"],
      siteName: branding.siteName,
      favicon: branding.logoUrl || branding.faviconUrl,
      locale: locale.bcp47,
    });
  } catch {
    return { title: themeConfig.siteName };
  }
}

export default async function PhotoStoryDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const [photo, branding, locale] = await Promise.all([
    getPhotoStoryBySlug(slug, { revalidate: 300 }),
    getSiteBranding({ revalidate: 300 }),
    getSiteLocale({ revalidate: 3600 }),
  ]);
  if (!photo) notFound();

  const gallery = parsePhotoGallery(photo.photoGallery);
  const cover =
    photo.photoCoverUrl || photo.featuredImage?.node?.sourceUrl || null;
  const items =
    gallery.length > 0
      ? gallery
      : cover
        ? [{ url: cover, caption: photo.title, alt: photo.title }]
        : [];

  const url = absoluteUrl(photo.uri || `/photos/${slug}`);
  const author = photo.author?.node;
  const description = stripHtml(photo.excerpt || "");
  const datePublished = photo.date || new Date().toISOString();

  const galleryLd = imageGalleryJsonLd({
    name: photo.title,
    description,
    url,
    datePublished,
    dateModified: photo.modified || datePublished,
    authorName: author?.name,
    authorUrl: author?.uri ? absoluteUrl(author.uri) : undefined,
    publisherName: branding.siteName,
    publisherLogoUrl: branding.logoUrl,
    inLanguage: locale.bcp47,
    images: items.map((item) => ({
      url: item.url,
      width: item.width,
      height: item.height,
      caption: item.caption || item.heading || item.alt,
    })),
  });

  // NewsArticle helps Discover / Google News eligibility for photo essays.
  const articleLd = newsArticleJsonLd({
    headline: photo.title,
    description,
    url,
    image: items[0]
      ? {
          url: items[0].url,
          width: items[0].width ?? 1200,
          height: items[0].height ?? 675,
          caption: items[0].caption,
        }
      : branding.logoUrl,
    datePublished,
    dateModified: photo.modified || datePublished,
    authorName: author?.name,
    authorUrl: author?.uri ? absoluteUrl(author.uri) : undefined,
    section: "Photos",
    keywords: ["photo story", "gallery"],
    publisherName: branding.siteName,
    publisherLogoUrl: branding.logoUrl,
    inLanguage: locale.bcp47,
  });

  const crumbs = [
    { name: "Home", url: absoluteUrl("/") },
    { name: "Photos", url: absoluteUrl("/photos") },
    { name: photo.title, url },
  ];

  return (
    <article className="mx-auto max-w-5xl space-y-6">
      <JsonLdScript data={articleLd} />
      <JsonLdScript data={galleryLd} />
      <JsonLdScript data={breadcrumbJsonLd(crumbs)} />

      <nav aria-label="Breadcrumb" className="text-sm text-[var(--np-muted)]">
        <Link href="/" className="hover:text-[var(--np-accent)]">
          Home
        </Link>
        <span className="mx-1">/</span>
        <Link href="/photos" className="hover:text-[var(--np-accent)]">
          Photos
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--np-text)]">{photo.title}</span>
      </nav>

      <header>
        <h1
          className="font-heading text-3xl font-bold text-[var(--np-primary)]"
          itemProp="headline"
          data-speakable
        >
          {photo.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          {photo.date ? <Timestamp date={photo.date} /> : null}
          {author?.name ? <span>{author.name}</span> : null}
          <ShareButton url={url} title={photo.title} variant="labeled" />
        </div>
        {photo.excerpt ? (
          <p
            className="mt-3 text-lg text-[var(--np-muted)]"
            itemProp="description"
            data-speakable
          >
            {stripHtml(photo.excerpt)}
          </p>
        ) : null}
      </header>

      <PhotoGallery items={items} />

      {photo.content ? (
        <div
          className="prose prose-neutral max-w-none"
          dangerouslySetInnerHTML={{ __html: photo.content }}
        />
      ) : null}
    </article>
  );
}
