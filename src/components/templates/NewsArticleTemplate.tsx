"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ShareBar, type ShareChannels, type GooglePreferredSourceConfig } from "@/components/atoms/ShareBar";
import {
  ArticleFontProvider,
  ArticleFontToolbar,
  ArticleFontScope,
  type ArticleFontConfig,
} from "@/components/atoms/ArticleFontControls";
import {
  SelectionToolbar,
  type SelectionToolbarConfig,
} from "@/components/atoms/SelectionToolbar";
import { ArticleImage } from "@/components/atoms/ArticleImage";
import { ReadingTime } from "@/components/atoms/ReadingTime";
import { Timestamp } from "@/components/atoms/Timestamp";
import { ArticleBody, getMidRelatedIds } from "@/components/organisms/ArticleBody";
import { ArticleCard } from "@/components/molecules/ArticleCard";
import {
  SocialLinks,
  authorSocialToLinks,
} from "@/components/molecules/SocialLinks";
import { ArticleSidebar } from "@/components/organisms/ArticleSidebar";
import type { Ad, Poll, Post, RelatedPost } from "@/types";
import type { ArticleSidebarWidget } from "@/types/article-sidebar";
import { cn, stripHtml } from "@/lib/utils";
import { resolveMediaCaption, extractFirstContentImageCaption } from "@/utils/caption";
import { resolveArticleDisplayImage } from "@/utils/images";
import { ensureIsoDate } from "@/seo/json-ld";

export interface NewsArticleTemplateProps {
  post: Post;
  url: string;
  related?: RelatedPost[] | Post[];
  /** @deprecated Prefer `sidebarWidgets` from the Article Sidebar builder. */
  sidebarAds?: Ad[];
  /** Configurable sidebar widgets from ENM Article Sidebar Builder. */
  sidebarWidgets?: ArticleSidebarWidget[];
  /** In-article / infeed ads injected between paragraphs. */
  inArticleAds?: Ad[];
  /** Prefetched polls for mid-article `[enm_poll]` shortcodes. */
  polls?: Record<number, Poll>;
  minutes?: number;
  ampUrl?: string | null;
  publisherLogoUrl?: string | null;
  siteName?: string;
  /** SVG/image when post has no featured and no in-content image. */
  imagePlaceholder?: string | null;
  className?: string;
  afterBody?: ReactNode;
  /** Share channel toggles from SEO settings. */
  shareChannels?: ShareChannels;
  /** Google Preferred Sources CTA. */
  preferredSource?: GooglePreferredSourceConfig | null;
  /** Article body font size A+/A− controls. */
  fontConfig?: ArticleFontConfig | null;
  /** Text-selection Search / Share / Copy toolbar. */
  selectionConfig?: SelectionToolbarConfig | null;
  /**
   * Continuous-reader mode: hide sidebar, show “Continue reading” divider,
   * keep a single-column layout for stacked stories.
   */
  stacked?: boolean;
  /** Hide footer related grid (default true). */
  showRelatedFooter?: boolean;
}

/**
 * Clean, semantic article HTML template optimized for:
 * - Google News (byline, dates, NewsArticle semantics)
 * - Google Discover (large LCP image, no CLS, clear hierarchy)
 * - Google Top Stories (fresh dates, authorship, amphtml when provided)
 */
export function NewsArticleTemplate({
  post,
  url,
  related = [],
  sidebarAds = [],
  sidebarWidgets,
  inArticleAds = [],
  polls = {},
  minutes = 1,
  ampUrl,
  publisherLogoUrl,
  siteName,
  imagePlaceholder,
  className,
  afterBody,
  shareChannels,
  preferredSource,
  fontConfig,
  selectionConfig,
  stacked = false,
  showRelatedFooter = true,
}: NewsArticleTemplateProps) {
  const author = post.author?.node;
  const category = post.categories?.nodes?.[0];
  const tags = post.tags?.nodes ?? [];
  const image = post.featuredImage?.node;
  const publishedRaw = post.dateGmt || post.date;
  const modifiedRaw = post.modifiedGmt || post.modified;
  const published = publishedRaw ? ensureIsoDate(publishedRaw) : null;
  const modified = modifiedRaw ? ensureIsoDate(modifiedRaw) : null;
  const summary = stripHtml(post.excerpt || post.seo?.metaDesc || "");
  const displayImage = resolveArticleDisplayImage({
    featuredUrl: image?.sourceUrl,
    featuredAlt: image?.altText,
    featuredWidth: image?.mediaDetails?.width,
    featuredHeight: image?.mediaDetails?.height,
    featuredCaption: resolveMediaCaption(image),
    contentHtml: post.content,
    title: post.title,
    placeholderUrl: imagePlaceholder,
  });
  const imgW = displayImage.width || 1200;
  const imgH = displayImage.height || 675;
  const heroCaption = !displayImage.isPlaceholder
    ? displayImage.caption ||
      extractFirstContentImageCaption(post.content) ||
      null
    : null;

  const midRelated = related.slice(0, 4);
  const midIds = getMidRelatedIds(midRelated);
  const footerRelated = related.filter((item) => !midIds.has(item.id));

  const crumbs = [
    { name: "Home", href: "/" },
    ...(category
      ? [
          {
            name: category.name,
            href: category.uri || `/category/${category.slug}`,
          },
        ]
      : []),
    { name: post.title, href: url },
  ];

  const font: ArticleFontConfig = fontConfig ?? {
    enabled: false,
    defaultPx: 17,
    minPx: 14,
    maxPx: 26,
    stepPx: 2,
    lineHeight: 1.75,
  };

  const showSidebar = !stacked;

  return (
    <ArticleFontProvider config={font}>
    <div className={cn("news-article-layout", stacked && "news-article-layout--stacked", className)}>
      {ampUrl ? <link rel="amphtml" href={ampUrl} /> : null}

      {stacked ? (
        <div className="mb-8 border-t-4 border-[var(--np-primary)] pt-8" aria-hidden={false}>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--np-muted)]">
            Continue reading
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-10",
          showSidebar && "lg:grid-cols-[minmax(0,1fr)_17.5rem]",
        )}
      >
        <article className="news-article min-w-0">
          {/* Publisher mark — reinforces brand for Discover / News */}
          {(publisherLogoUrl || siteName) && (
            <div className="mb-5 flex items-center gap-3">
              {publisherLogoUrl ? (
                <Image
                  src={publisherLogoUrl}
                  alt={siteName || "Publisher"}
                  width={160}
                  height={40}
                  className="h-8 object-contain"
                  style={{ width: "auto" }}
                  priority={!stacked}
                />
              ) : null}
              {siteName ? (
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--np-muted)]">
                  {siteName}
                </span>
              ) : null}
            </div>
          )}

          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[var(--np-muted)]">
            <ol className="flex flex-wrap items-center gap-1.5" itemScope itemType="https://schema.org/BreadcrumbList">
              {crumbs.map((crumb, i) => (
                <li
                  key={`${crumb.href}-${i}`}
                  className="flex items-center gap-1.5"
                  itemProp="itemListElement"
                  itemScope
                  itemType="https://schema.org/ListItem"
                >
                  {i > 0 ? <span aria-hidden className="text-[var(--np-border)]">/</span> : null}
                  {i === crumbs.length - 1 ? (
                    <span itemProp="name" className="line-clamp-1 text-[var(--np-text)]">
                      {crumb.name}
                    </span>
                  ) : (
                    <Link href={crumb.href} itemProp="item" className="hover:text-[var(--np-accent)]">
                      <span itemProp="name">{crumb.name}</span>
                    </Link>
                  )}
                  <meta itemProp="position" content={String(i + 1)} />
                </li>
              ))}
            </ol>
          </nav>

          {category ? (
            <p className="mb-3">
              <Link
                href={category.uri || `/category/${category.slug}`}
                className="text-xs font-bold uppercase tracking-wider text-[var(--np-accent)]"
              >
                {category.name}
              </Link>
            </p>
          ) : null}

          <h1
            itemProp="headline"
            className="font-heading text-[1.75rem] font-bold leading-[1.2] tracking-tight text-[var(--np-primary)] sm:text-3xl md:text-4xl md:leading-[1.15]"
          >
            {post.title}
          </h1>

          {summary ? (
            <p
              itemProp="description"
              className="mt-4 text-lg leading-relaxed text-[var(--np-muted)] md:text-xl"
            >
              {summary}
            </p>
          ) : null}

          {/* Byline — critical for Google News E-E-A-T */}
          <header className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-[var(--np-border)] py-3.5 text-sm">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-2">
                {author?.avatar?.url ? (
                  <Image
                    src={author.avatar.url}
                    alt=""
                    width={36}
                    height={36}
                    className="size-9 rounded-full object-cover"
                  />
                ) : null}
                <div>
                  <Link
                    href={author?.uri || `/author/${author?.slug || ""}`}
                    className="font-semibold text-[var(--np-text)] hover:text-[var(--np-accent)]"
                  >
                    <span>{post.byline || author?.name || "Staff"}</span>
                  </Link>
                  <p className="text-xs text-[var(--np-muted)]">Author</p>
                </div>
              </div>
              <SocialLinks
                size="sm"
                links={authorSocialToLinks(author?.social)}
                fallbackToTheme={false}
                hideEmpty
              />
            </div>

            {published ? (
              <Timestamp
                date={published}
                className="text-[var(--np-muted)]"
              />
            ) : null}

            {modified && modified !== published ? (
              <span className="text-xs text-[var(--np-muted)]">
                Updated <Timestamp date={modified} />
              </span>
            ) : null}

            <ReadingTime minutes={minutes} />
            <div className="ml-auto flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
              <ArticleFontToolbar />
              <ShareBar
                url={url}
                title={post.title}
                text={summary}
                channels={shareChannels}
                preferredSource={preferredSource}
              />
            </div>
          </header>

          {/* Hero — featured → first content image → SVG placeholder (reserved aspect = no CLS) */}
          <figure className="news-article__hero mt-6 bg-[var(--np-surface)]">
            <div className="overflow-hidden">
              <ArticleImage
                src={displayImage.src}
                alt={displayImage.alt}
                aspectRatio={`${imgW} / ${imgH}`}
                preset="hero"
                priority
                sizes="(max-width: 768px) 100vw, min(720px, 100vw)"
                placeholderUrl={imagePlaceholder}
                isPlaceholder={displayImage.isPlaceholder}
              />
            </div>
            {heroCaption ? (
              <figcaption className="news-article__hero-caption np-image-caption mt-2 px-0.5 text-sm leading-snug text-[var(--np-muted)] italic">
                {heroCaption}
              </figcaption>
            ) : null}
          </figure>

          <ArticleFontScope>
          <div
            className="news-article__body mt-8"
            data-speakable="true"
          >
            <ArticleBody
              html={post.content || ""}
              inArticleAds={inArticleAds}
              midRelated={midRelated}
              polls={polls}
            />
          </div>
          </ArticleFontScope>

          {tags.length > 0 ? (
            <footer className="mt-10 border-t border-[var(--np-border)] pt-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--np-muted)]">
                Topics
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li key={tag.id}>
                    <Link
                      href={tag.uri || `/tag/${tag.slug}`}
                      className="inline-block border border-[var(--np-border)] px-2.5 py-1 text-xs font-medium text-[var(--np-text)] hover:border-[var(--np-accent)] hover:text-[var(--np-accent)]"
                      rel="tag"
                    >
                      {tag.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </footer>
          ) : null}

          {author?.name ? (
            <aside
              className="mt-10 flex flex-col gap-4 border border-[var(--np-border)] bg-[var(--np-surface)] p-5 sm:flex-row sm:items-start"
              aria-label="About the author"
            >
              {author.avatar?.url ? (
                <Image
                  src={author.avatar.url}
                  alt=""
                  width={72}
                  height={72}
                  className="size-[72px] shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-[72px] shrink-0 items-center justify-center rounded-full bg-[var(--np-border)] text-xl font-bold text-[var(--np-muted)]">
                  {author.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--np-muted)]">
                  About the author
                </p>
                <Link
                  href={author.uri || `/author/${author.slug || ""}`}
                  className="font-heading text-lg font-bold text-[var(--np-primary)] hover:text-[var(--np-accent)]"
                >
                  {author.name}
                </Link>
                {author.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--np-muted)]">
                    {stripHtml(author.description)}
                  </p>
                ) : null}
                <SocialLinks
                  className="mt-3"
                  size="sm"
                  links={authorSocialToLinks(author.social)}
                  fallbackToTheme={false}
                  hideEmpty
                />
              </div>
            </aside>
          ) : null}

          {afterBody}
        </article>

        {showSidebar ? (
        <ArticleSidebar
          widgets={
            sidebarWidgets?.length
              ? sidebarWidgets
              : sidebarAds.length
                ? [
                    {
                      id: "legacy-ads",
                      type: "ad" as const,
                      title: "Advertisement",
                      config: {},
                      postLimit: 2,
                      categoryId: 0,
                      ads: sidebarAds.slice(0, 2),
                    },
                  ]
                : []
          }
        />
        ) : null}
      </div>

      {showRelatedFooter && footerRelated.length > 0 ? (
        <section className="mt-14 border-t border-[var(--np-border)] pt-10" aria-labelledby="related-heading">
          <h2
            id="related-heading"
            className="font-heading text-xl font-bold text-[var(--np-primary)]"
          >
            Related stories
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {footerRelated.map((item) => (
              <li key={item.id}>
                <ArticleCard
                  article={item}
                  variant="compact"
                  imagePlaceholder={imagePlaceholder}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <SelectionToolbar
        articleUrl={url}
        articleTitle={post.title}
        config={selectionConfig}
      />
    </div>
    </ArticleFontProvider>
  );
}
