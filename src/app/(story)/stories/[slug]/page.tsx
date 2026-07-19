import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoryBySlug } from "@/services/content.service";
import { getSeoSettings, getSiteLocale } from "@/services/seo-settings.service";
import { getSiteBranding } from "@/services/branding.service";
import { buildArticleMetadata } from "@/seo/metadata";
import { absoluteUrl } from "@/utils/urls";
import { parseStoryPages } from "@/utils/story-pages";
import { stripHtml } from "@/lib/utils";
import { themeConfig } from "@/config/theme";
import { StoryPlayer } from "@/components/organisms/StoryPlayer";
import { webStoryJsonLd, breadcrumbJsonLd } from "@/seo/json-ld";
import { JsonLdScript } from "@/seo/JsonLdScript";

export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [story, branding, locale, seo] = await Promise.all([
      getStoryBySlug(slug, { revalidate: 60 }),
      getSiteBranding({ revalidate: 300 }),
      getSiteLocale({ revalidate: 3600 }),
      getSeoSettings().catch(() => null),
    ]);
    if (!story) return { title: `Story | ${branding.siteName}` };
    const path = story.canonicalUrl || story.uri || `/stories/${slug}`;
    const ampHtml =
      seo?.enableAmp !== false && seo?.ampStoriesEnabled !== false
        ? absoluteUrl(`/amp/stories/${slug}`)
        : null;

    return buildArticleMetadata({
      headline: story.seoTitle || story.title || "Web Story",
      description: story.seoDescription || stripHtml(story.excerpt || ""),
      path,
      canonical: absoluteUrl(path),
      image: story.coverImageUrl || branding.defaultOgImage,
      publishedTime: story.date,
      modifiedTime: story.modified || story.date,
      authors: story.author?.node?.name
        ? [story.author.node.name]
        : [branding.siteName],
      section: "Web Stories",
      tags: story.seoKeywords
        ? String(story.seoKeywords)
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : ["web story"],
      siteName: branding.siteName,
      favicon: branding.logoUrl || branding.faviconUrl,
      locale: locale.bcp47,
      ampHtml,
    });
  } catch {
    return { title: themeConfig.siteName };
  }
}

function storyHref(uri?: string | null, slug?: string | null): string {
  if (uri) return uri.startsWith("/") ? uri : `/${uri}`;
  if (slug) return `/stories/${slug}`;
  return "/stories";
}

export default async function StoryDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let story;
  try {
    story = await getStoryBySlug(slug, { revalidate: 60 });
  } catch {
    notFound();
  }

  if (!story) notFound();

  const pages = parseStoryPages(story.pages);
  const related = (story.relatedStories ?? []).filter(
    (s) => s.databaseId !== story.databaseId,
  );
  const htmlUrl = absoluteUrl(
    story.canonicalUrl || story.uri || `/stories/${slug}`,
  );
  const ampUrl = absoluteUrl(`/amp/stories/${slug}`);

  let ampEnabled = false;
  try {
    const seo = await getSeoSettings();
    ampEnabled = Boolean(seo.enableAmp && seo.ampStoriesEnabled);
  } catch {
    ampEnabled = false;
  }

  const [branding, locale] = await Promise.all([
    getSiteBranding({ revalidate: 300 }),
    getSiteLocale({ revalidate: 3600 }),
  ]);

  const jsonLd = webStoryJsonLd({
    headline: story.title || "Web Story",
    description: story.seoDescription || stripHtml(story.excerpt || ""),
    url: htmlUrl,
    image: story.coverImageUrl,
    datePublished: story.date,
    dateModified: story.modified || story.date,
    publisherName: branding.siteName,
    publisherLogoUrl: absoluteUrl("/publisher-logo"),
    authorName: story.author?.node?.name || branding.siteName,
    inLanguage: locale.bcp47,
    ampUrl: ampEnabled ? ampUrl : null,
  });

  const crumbs = [
    { name: "Home", url: absoluteUrl("/") },
    { name: "Web Stories", url: absoluteUrl("/stories") },
    { name: story.title || "Story", url: htmlUrl },
  ];

  return (
    <>
      {ampEnabled ? <link rel="amphtml" href={ampUrl} /> : null}
      <JsonLdScript data={jsonLd} />
      <JsonLdScript data={breadcrumbJsonLd(crumbs)} />
      <StoryPlayer
        title={story.title || "Web Story"}
        pages={pages}
        coverUrl={story.coverImageUrl}
        durationSec={story.durationSeconds ?? 5}
        siteName={branding.siteName}
        logoUrl={branding.logoUrl}
        closeHref="/stories"
        related={related.map((item) => ({
          id: item.id,
          title: item.title,
          href: storyHref(item.uri, item.slug),
          coverUrl: item.coverImageUrl,
        }))}
      />
    </>
  );
}
