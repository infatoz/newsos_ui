import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/atoms/Badge";
import { Timestamp } from "@/components/atoms/Timestamp";
import { LiveBlogTimeline } from "@/components/organisms/LiveBlogTimeline";
import { getLiveBlogBySlug } from "@/services/content.service";
import { getSiteBranding } from "@/services/branding.service";
import { getSiteLocale } from "@/services/seo-settings.service";
import { buildArticleMetadata } from "@/seo/metadata";
import {
  liveBlogPostingJsonLd,
  breadcrumbJsonLd,
} from "@/seo/json-ld";
import { JsonLdScript } from "@/seo/JsonLdScript";
import { absoluteUrl } from "@/utils/urls";
import { stripHtml } from "@/lib/utils";
import { themeConfig } from "@/config/theme";

export const revalidate = 30;

export async function generateStaticParams() {
  return [];
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [blog, branding, locale] = await Promise.all([
      getLiveBlogBySlug(slug, { revalidate: 30 }),
      getSiteBranding({ revalidate: 300 }),
      getSiteLocale({ revalidate: 3600 }),
    ]);
    if (!blog) return { title: `Live blog | ${branding.siteName}` };
    const path = blog.uri || `/live-blog/${slug}`;
    return buildArticleMetadata({
      headline: blog.seo?.title || blog.title,
      description:
        blog.seo?.metaDesc || blog.summary || stripHtml(blog.content || ""),
      path,
      canonical: absoluteUrl(path),
      image: blog.featuredImage?.node?.sourceUrl || branding.defaultOgImage,
      imageWidth: blog.featuredImage?.node?.mediaDetails?.width,
      imageHeight: blog.featuredImage?.node?.mediaDetails?.height,
      publishedTime: blog.startedAt,
      modifiedTime:
        blog.updates?.[0]?.publishedAt || blog.endedAt || blog.startedAt,
      authors: blog.author?.node?.name ? [blog.author.node.name] : undefined,
      section: "Live",
      tags: ["live blog", "live coverage"],
      siteName: branding.siteName,
      favicon: branding.logoUrl || branding.faviconUrl,
      locale: locale.bcp47,
    });
  } catch {
    return { title: themeConfig.siteName };
  }
}

export default async function LiveBlogPage({ params }: PageProps) {
  const { slug } = await params;

  const [blog, branding, locale] = await Promise.all([
    getLiveBlogBySlug(slug, { revalidate: 15 }).catch(() => null),
    getSiteBranding({ revalidate: 300 }),
    getSiteLocale({ revalidate: 3600 }),
  ]);

  if (!blog) notFound();

  const url = absoluteUrl(blog.uri || `/live-blog/${slug}`);
  const updates = blog.updates ?? [];
  const image = blog.featuredImage?.node;
  const author = blog.author?.node;
  const description =
    blog.seo?.metaDesc ||
    blog.summary ||
    stripHtml(blog.content || "") ||
    blog.title;

  const ld = liveBlogPostingJsonLd({
    headline: blog.seo?.title || blog.title,
    description,
    url,
    image: image?.sourceUrl
      ? {
          url: image.sourceUrl,
          width: image.mediaDetails?.width ?? 1200,
          height: image.mediaDetails?.height ?? 675,
          alt: image.altText,
        }
      : branding.defaultOgImage &&
          !branding.defaultOgImage.toLowerCase().includes(".svg")
        ? {
            url: branding.defaultOgImage,
            width: 1200,
            height: 675,
          }
        : branding.logoUrl && !branding.logoUrl.toLowerCase().includes(".svg")
          ? branding.logoUrl
          : absoluteUrl("/publisher-logo.png"),
    datePublished: blog.startedAt || new Date().toISOString(),
    dateModified:
      updates[0]?.publishedAt || blog.endedAt || blog.startedAt,
    coverageStartTime: blog.startedAt || new Date().toISOString(),
    coverageEndTime: blog.isLive
      ? null
      : blog.coverageEndTime || blog.endedAt || updates[0]?.publishedAt,
    isLive: blog.isLive,
    authorName: author?.name || branding.siteName,
    authorUrl: author?.uri
      ? absoluteUrl(author.uri)
      : absoluteUrl("/"),
    publisherName: branding.siteName,
    publisherLogoUrl:
      branding.logoUrl && !branding.logoUrl.toLowerCase().includes(".svg")
        ? branding.logoUrl
        : absoluteUrl("/publisher-logo.png"),
    inLanguage: locale.bcp47,
    articleSection: "Live",
    keywords: ["live blog", "live coverage", "breaking news", blog.title],
    about: blog.title,
    updates: updates.map((u, index) => ({
      headline: u.title || `Update ${index + 1}`,
      articleBody:
        stripHtml(u.content).trim() ||
        u.title ||
        blog.summary ||
        `Update ${index + 1}`,
      datePublished: u.publishedAt,
      dateModified: u.publishedAt,
      url: `${url}#update-${u.id}`,
      authorName: u.author?.name || author?.name || branding.siteName,
      authorUrl: author?.uri ? absoluteUrl(author.uri) : absoluteUrl("/"),
      image: u.embeds?.[0]?.url
        ? { url: u.embeds[0].url }
        : image?.sourceUrl
          ? {
              url: image.sourceUrl,
              width: image.mediaDetails?.width,
              height: image.mediaDetails?.height,
            }
          : null,
    })),
  });

  const crumbs = [
    { name: "Home", url: absoluteUrl("/") },
    { name: "Live", url: absoluteUrl("/") },
    { name: blog.title, url },
  ];

  return (
    <article
      className="mx-auto max-w-3xl space-y-8"
      itemScope
      itemType="https://schema.org/LiveBlogPosting"
    >
      <JsonLdScript data={ld} />
      <JsonLdScript data={breadcrumbJsonLd(crumbs)} />
      <link itemProp="url" href={url} />
      <meta itemProp="headline" content={blog.title} />
      <meta itemProp="description" content={description} />
      {blog.startedAt ? (
        <meta itemProp="coverageStartTime" content={blog.startedAt} />
      ) : null}
      {(blog.endedAt || blog.coverageEndTime) && !blog.isLive ? (
        <meta
          itemProp="coverageEndTime"
          content={blog.endedAt || blog.coverageEndTime || ""}
        />
      ) : null}

      <header>
        {blog.isLive ? <Badge variant="live">Live</Badge> : <Badge>Ended</Badge>}
        <h1
          className="mt-3 font-heading text-3xl font-bold text-[var(--np-primary)] md:text-4xl"
          data-speakable
        >
          {blog.title}
        </h1>
        {blog.summary ? (
          <p
            className="mt-3 text-lg text-[var(--np-muted)]"
            data-speakable
          >
            {blog.summary}
          </p>
        ) : null}
        {blog.startedAt ? (
          <p className="mt-2 text-sm text-[var(--np-muted)]">
            Coverage started <Timestamp date={blog.startedAt} />
            {author?.name ? <> · {author.name}</> : null}
          </p>
        ) : null}
      </header>

      {image?.sourceUrl ? (
        <Image
          src={image.sourceUrl}
          alt={image.altText || blog.title}
          width={image.mediaDetails?.width || 1200}
          height={image.mediaDetails?.height || 675}
          priority
          className="h-auto w-full object-cover"
          itemProp="image"
        />
      ) : null}

      {blog.content ? (
        <div
          className="prose prose-neutral max-w-none"
          itemProp="articleBody"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      ) : null}

      <LiveBlogTimeline liveBlog={blog} hideHeader />

      <p className="text-sm">
        <Link href="/" className="text-[var(--np-accent)] hover:underline">
          ← Back to home
        </Link>
      </p>
    </article>
  );
}
