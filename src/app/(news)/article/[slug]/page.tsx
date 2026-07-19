import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getPostBySlug,
  getRelatedPosts,
  getPollById,
} from "@/services/content.service";
import { extractPollIdsFromHtml } from "@/utils/poll";
import { getActiveAds } from "@/services/ads.service";
import {
  getArticleSidebarBlocks,
  mapArticleSidebarWidgets,
} from "@/services/article-sidebar.service";
import { getSeoSettings, getSiteLocale } from "@/services/seo-settings.service";
import { getSiteBranding } from "@/services/branding.service";
import { buildArticleMetadata } from "@/seo/metadata";
import {
  newsArticleJsonLd,
  breadcrumbJsonLd,
  serializeJsonLd,
} from "@/seo/json-ld";
import { ContinuousArticleReader } from "@/components/organisms/ContinuousArticleReader";
import { absoluteUrl, contentPath, pathsEqual, ampArticlePath } from "@/utils/urls";
import { safeDecodeSlug } from "@/utils/slug";
import { readingTime } from "@/utils/reading-time";
import { stripHtml } from "@/lib/utils";
import { resolveArticleDisplayImage } from "@/utils/images";
import { resolveMediaCaption } from "@/utils/caption";
import { themeConfig } from "@/config/theme";
import { defaultSiteLocale } from "@/utils/locale";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  try {
    const [post, branding, locale] = await Promise.all([
      getPostBySlug(rawSlug, { revalidate: 300 }),
      getSiteBranding({ revalidate: 300 }),
      getSiteLocale({ revalidate: 3600 }),
    ]);
    if (!post) {
      return { title: `Not found | ${branding.siteName}` };
    }
    const slug = safeDecodeSlug(post.slug || rawSlug);
    const articlePath = contentPath(post.uri, slug);
    const authors = post.author?.node?.name
      ? [post.author.node.name]
      : undefined;
    const tags = post.tags?.nodes?.map((t) => t.name) ?? undefined;
    const section = post.categories?.nodes?.[0]?.name ?? undefined;
    const displayImage = resolveArticleDisplayImage({
      featuredUrl:
        post.seo?.opengraphImage?.sourceUrl ||
        post.featuredImage?.node?.sourceUrl,
      featuredAlt: post.featuredImage?.node?.altText,
      featuredWidth: post.featuredImage?.node?.mediaDetails?.width,
      featuredHeight: post.featuredImage?.node?.mediaDetails?.height,
      contentHtml: post.content,
      title: post.title,
      placeholderUrl: branding.imagePlaceholder,
    });
    const image = displayImage.isPlaceholder
      ? branding.defaultOgImage || branding.logoUrl
      : displayImage.src;

    const meta = buildArticleMetadata({
      headline: post.seo?.title || post.title,
      description: post.seo?.metaDesc || stripHtml(post.excerpt || ""),
      path: articlePath,
      canonical: absoluteUrl(articlePath),
      image,
      imageWidth: displayImage.isPlaceholder
        ? undefined
        : displayImage.width,
      imageHeight: displayImage.isPlaceholder
        ? undefined
        : displayImage.height,
      imageAlt: displayImage.alt || post.title,
      authors,
      section,
      tags,
      publishedTime: post.dateGmt || post.date,
      modifiedTime: post.modifiedGmt || post.modified,
      noIndex: post.seo?.metaRobotsNoindex === "yes",
      noFollow: post.seo?.metaRobotsNofollow === "yes",
      siteName: branding.siteName,
      favicon: branding.logoUrl || branding.faviconUrl,
      locale: locale.bcp47,
      keywords: tags,
      newsKeywords: tags,
    });

    const seo = await getSeoSettings().catch(() => null);
    if (seo?.enableAmp !== false && seo?.ampArticleEnabled !== false) {
      const ampUrl = absoluteUrl(
        ampArticlePath(contentPath(post.uri, slug)),
      );
      return {
        ...meta,
        other: {
          ...(typeof meta.other === "object" ? meta.other : {}),
          amphtml: ampUrl,
        },
      };
    }

    return meta;
  } catch {
    return { title: themeConfig.siteName };
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug: rawSlug } = await params;

  // Do not catch getPostBySlug — CMS outages must not become fake 404s.
  const post = await getPostBySlug(rawSlug, { revalidate: 300 });
  if (!post) notFound();

  const [branding, locale] = await Promise.all([
    getSiteBranding({ revalidate: 300 }).catch(() => ({
      siteName: themeConfig.siteName,
      siteTagline: themeConfig.siteDescription,
      logoUrl: themeConfig.logo,
      faviconUrl: themeConfig.favicon || themeConfig.logo,
      defaultOgImage: themeConfig.logo,
      imagePlaceholder: themeConfig.imagePlaceholder,
    })),
    getSiteLocale({ revalidate: 3600 }).catch(() => defaultSiteLocale()),
  ]);

  const slug = safeDecodeSlug(post.slug || rawSlug);
  const articlePath = contentPath(post.uri, slug);
  const url = absoluteUrl(articlePath);

  // Legacy /article/{slug} → WordPress permalink (e.g. /india/slug/)
  const headerStore = await headers();
  const incoming =
    headerStore.get("x-np-pathname") ||
    headerStore.get("next-url") ||
    "";
  if (
    incoming.startsWith("/article/") &&
    post.uri &&
    !pathsEqual(incoming, articlePath)
  ) {
    redirect(articlePath);
  }

  let related = post.relatedPosts ?? [];
  if (!related.length) {
    try {
      related = await getRelatedPosts(post.databaseId, 8, { revalidate: 300 });
    } catch {
      related = [];
    }
  }

  let sidebarAds: Awaited<ReturnType<typeof getActiveAds>> = [];
  let inArticleAds: Awaited<ReturnType<typeof getActiveAds>> = [];
  try {
    const [sidebar, article, infeed] = await Promise.all([
      getActiveAds({ placement: "sidebar" }, { revalidate: 30 }),
      getActiveAds({ placement: "article" }, { revalidate: 30 }),
      getActiveAds({ placement: "infeed" }, { revalidate: 30 }),
    ]);
    sidebarAds = sidebar;
    // Prefer dedicated article placement; fall back to infeed; then reuse sidebar MPU if needed.
    inArticleAds = [...article, ...infeed];
    if (!inArticleAds.length && sidebar.length) {
      inArticleAds = sidebar.slice(0, 1);
    }
  } catch {
    sidebarAds = [];
    inArticleAds = [];
  }

  const author = post.author?.node;
  const category = post.categories?.nodes?.[0];
  const tags = post.tags?.nodes ?? [];

  let sidebarWidgets: Awaited<
    ReturnType<typeof mapArticleSidebarWidgets>
  > = [];
  try {
    const sidebarBlocks = await getArticleSidebarBlocks({ revalidate: 120 });
    sidebarWidgets = await mapArticleSidebarWidgets(
      sidebarBlocks,
      {
        postId: post.databaseId,
        related,
        author: author
          ? {
              id: author.id,
              name: author.name,
              slug: author.slug,
              uri: author.uri,
              avatar: author.avatar,
              description:
                "description" in author
                  ? (author as { description?: string | null }).description
                  : null,
            }
          : null,
        articleTags: tags,
        categoryId: category?.databaseId,
        categorySlug: category?.slug,
        sidebarAds,
      },
      { revalidate: 120 },
    );
  } catch {
    sidebarWidgets = [];
  }

  const contentHtml = post.content ?? "";
  const rt = readingTime(contentHtml);
  const minutes = post.readingTime || post.seo?.readingTime || rt.minutes;
  const image = post.featuredImage?.node;
  const displayImage = resolveArticleDisplayImage({
    featuredUrl: image?.sourceUrl,
    featuredAlt: image?.altText,
    featuredWidth: image?.mediaDetails?.width,
    featuredHeight: image?.mediaDetails?.height,
    contentHtml,
    title: post.title,
    placeholderUrl: branding.imagePlaceholder,
  });

  const pollIds = extractPollIdsFromHtml(contentHtml);
  const polls: Record<number, NonNullable<Awaited<ReturnType<typeof getPollById>>>> =
    {};
  await Promise.all(
    pollIds.map(async (id) => {
      try {
        const poll = await getPollById(id, { revalidate: 60 });
        if (poll) polls[id] = poll;
      } catch {
        /* skip missing polls */
      }
    }),
  );

  let ampUrl: string | null = null;
  let seoSettings: Awaited<ReturnType<typeof getSeoSettings>> | null = null;
  try {
    seoSettings = await getSeoSettings();
    if (seoSettings.enableAmp && seoSettings.ampArticleEnabled) {
      ampUrl = absoluteUrl(ampArticlePath(articlePath));
    }
  } catch {
    ampUrl = null;
  }

  const shareChannels = {
    whatsapp: seoSettings?.shareWhatsapp !== false,
    x: seoSettings?.shareX !== false,
    facebook: seoSettings?.shareFacebook !== false,
    copy: seoSettings?.shareCopy !== false,
  };

  const preferredSource =
    seoSettings?.googlePreferredSourceEnabled &&
    seoSettings.googlePreferredSourceOnArticles
      ? {
          enabled: true,
          url: seoSettings.googlePreferredSourceUrl,
          label: seoSettings.googlePreferredSourceLabel,
        }
      : null;

  const fontConfig = seoSettings
    ? {
        enabled: seoSettings.articleFontEnabled !== false,
        defaultPx: seoSettings.articleFontDefaultPx,
        minPx: seoSettings.articleFontMinPx,
        maxPx: seoSettings.articleFontMaxPx,
        stepPx: seoSettings.articleFontStepPx,
        lineHeight: seoSettings.articleFontLineHeight,
        scaleLineHeight: seoSettings.articleFontScaleLineHeight,
        showReset: seoSettings.articleFontShowReset,
        showSizeLabel: seoSettings.articleFontShowSizeLabel,
        storageKey: seoSettings.articleFontStorageKey,
        decreaseLabel: seoSettings.articleFontDecreaseLabel,
        increaseLabel: seoSettings.articleFontIncreaseLabel,
        resetLabel: seoSettings.articleFontResetLabel,
        toolbarLabel: seoSettings.articleFontToolbarLabel,
      }
    : null;

  const selectionConfig = seoSettings
    ? {
        enabled: seoSettings.selectionToolbarEnabled !== false,
        searchEnabled: seoSettings.selectionSearchEnabled !== false,
        shareEnabled: seoSettings.selectionShareEnabled !== false,
        copyEnabled: seoSettings.selectionCopyEnabled !== false,
        searchEngine: seoSettings.selectionSearchEngine,
        minChars: seoSettings.selectionMinChars,
        searchLabel: seoSettings.selectionSearchLabel,
        shareLabel: seoSettings.selectionShareLabel,
        copyLabel: seoSettings.selectionCopyLabel,
      }
    : null;

  const articleLd = newsArticleJsonLd({
    headline: post.title,
    description: stripHtml(post.excerpt || post.seo?.metaDesc || ""),
    url,
    image: displayImage.isPlaceholder
      ? branding.defaultOgImage || branding.logoUrl
      : {
          url: displayImage.src,
          width: displayImage.width ?? 1200,
          height: displayImage.height ?? 675,
          alt: displayImage.alt || image?.altText,
          caption: resolveMediaCaption(image) || image?.altText,

        },
    datePublished: post.dateGmt || post.date || new Date().toISOString(),
    dateModified: post.modifiedGmt || post.modified,
    authorName: author?.name,
    authorUrl: author?.uri ? absoluteUrl(author.uri) : undefined,
    section: category?.name,
    keywords: tags.map((t) => t.name),
    wordCount: rt.words,
    articleBody: stripHtml(contentHtml).slice(0, 5000),
    publisherName: branding.siteName,
    publisherLogoUrl: branding.logoUrl,
    inLanguage: locale.bcp47,
  });

  const crumbs = [
    { name: "Home", url: absoluteUrl("/") },
    ...(category
      ? [
          {
            name: category.name,
            url: absoluteUrl(category.uri || `/category/${category.slug}`),
          },
        ]
      : []),
    { name: post.title, url },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(breadcrumbJsonLd(crumbs)),
        }}
      />
      <ContinuousArticleReader
        initial={{
          post,
          url,
          path: articlePath,
          related,
          minutes,
          ampUrl,
          polls,
          inArticleAds,
          sidebarAds,
          sidebarWidgets,
        }}
        queue={related
          .filter((r) => r.slug && r.databaseId !== post.databaseId)
          .map((r) => ({
            id: r.id,
            databaseId: r.databaseId,
            slug: r.slug,
            uri: r.uri,
            title: r.title,
          }))}
        chrome={{
          siteName: branding.siteName,
          publisherLogoUrl: branding.logoUrl,
          imagePlaceholder: branding.imagePlaceholder,
          shareChannels,
          preferredSource,
          fontConfig,
          selectionConfig,
        }}
      />
    </>
  );
}
