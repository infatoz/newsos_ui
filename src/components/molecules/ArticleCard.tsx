import Link from "next/link";
import type { Category, Media, Post, RelatedPost, Story } from "@/types";
import { ArticleImage } from "@/components/atoms/ArticleImage";
import { Badge } from "@/components/atoms/Badge";
import { Timestamp } from "@/components/atoms/Timestamp";
import { cn, stripHtml } from "@/lib/utils";
import { contentPath } from "@/utils/urls";

export type ArticleCardVariant = "featured" | "compact" | "horizontal";

export type ArticleCardSource = Story | RelatedPost | Post;

export interface ArticleCardProps {
  article: ArticleCardSource;
  variant?: ArticleCardVariant;
  showExcerpt?: boolean;
  className?: string;
  priority?: boolean;
  /** Override site SVG placeholder for empty featured images. */
  imagePlaceholder?: string | null;
}

/** Public article URL — keep WordPress GraphQL `uri` (meaningful path). */
function resolveHref(article: ArticleCardSource): string {
  if ("href" in article && typeof article.href === "string" && article.href) {
    const href = article.href;
    if (href.startsWith("http")) return href;
    return contentPath(href);
  }
  if ("uri" in article && article.uri) {
    return contentPath(article.uri, "slug" in article ? article.slug : null);
  }
  if ("slug" in article && article.slug) {
    return contentPath(null, article.slug);
  }
  return "#";
}

function resolveTitle(article: ArticleCardSource): string {
  return article.title ?? "";
}

function resolveImage(article: ArticleCardSource): Media | null {
  if ("image" in article && article.image) return article.image;
  if ("featuredImage" in article) return article.featuredImage?.node ?? null;
  return null;
}

function resolveCategory(
  article: ArticleCardSource,
): Pick<Category, "name" | "slug" | "uri"> | null {
  if ("category" in article && article.category) return article.category;
  if ("categories" in article) {
    const nodes = article.categories?.nodes;
    return nodes?.[0] ?? null;
  }
  return null;
}

function resolveDate(article: ArticleCardSource): string | null | undefined {
  if ("publishedAt" in article) return article.publishedAt;
  if ("date" in article) return article.date;
  return undefined;
}

function resolveExcerpt(article: ArticleCardSource): string | null {
  const raw = article.excerpt ?? null;
  if (!raw) return null;
  return stripHtml(raw);
}

export function ArticleCard({
  article,
  variant = "compact",
  showExcerpt = false,
  className,
  priority = false,
  imagePlaceholder,
}: ArticleCardProps) {
  const href = resolveHref(article);
  const title = resolveTitle(article);
  const image = resolveImage(article);
  const category = resolveCategory(article);
  const date = resolveDate(article);
  const excerpt = showExcerpt ? resolveExcerpt(article) : null;
  const isLive = "isLive" in article && Boolean(article.isLive);
  const isBreaking = "isBreaking" in article && Boolean(article.isBreaking);

  const imageSrc = image?.sourceUrl;
  const imageAlt = image?.altText || title;

  if (variant === "horizontal") {
    return (
      <article
        className={cn(
          "group grid grid-cols-[96px_1fr] gap-3 border-b border-[var(--np-border)] py-3 last:border-0 sm:grid-cols-[140px_1fr]",
          className,
        )}
      >
        <Link href={href} className="block overflow-hidden">
          <ArticleImage
            src={imageSrc}
            alt={imageAlt}
            aspectRatio="4/3"
            preset="thumbnail"
            sizes="140px"
            priority={priority}
            placeholderUrl={imagePlaceholder}
            imgClassName="transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {isLive ? <Badge variant="live">Live</Badge> : null}
            {isBreaking ? <Badge variant="breaking">Breaking</Badge> : null}
            {category ? (
              <Badge variant="category" href={category.uri ?? `/${category.slug}`}>
                {category.name}
              </Badge>
            ) : null}
          </div>
          <h3 className="font-heading text-sm font-semibold leading-snug text-[var(--np-text)] sm:text-base">
            <Link href={href} className="hover:text-[var(--np-accent)]">
              {title}
            </Link>
          </h3>
          {date ? <Timestamp date={date} relative /> : null}
        </div>
      </article>
    );
  }

  if (variant === "featured") {
    return (
      <article className={cn("group relative flex flex-col", className)}>
        <Link href={href} className="mb-3 block overflow-hidden">
          <ArticleImage
            src={imageSrc}
            alt={imageAlt}
            aspectRatio="16/9"
            preset="hero"
            priority={priority}
            placeholderUrl={imagePlaceholder}
            imgClassName="transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </Link>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {isLive ? <Badge variant="live">Live</Badge> : null}
            {isBreaking ? <Badge variant="breaking">Breaking</Badge> : null}
            {category ? (
              <Badge variant="category" href={category.uri ?? `/${category.slug}`}>
                {category.name}
              </Badge>
            ) : null}
            {date ? <Timestamp date={date} relative /> : null}
          </div>
          <h2 className="font-heading text-2xl font-bold leading-tight text-[var(--np-primary)] md:text-3xl line-clamp-3">
            <Link href={href} className="hover:text-[var(--np-accent)]">
              {title}
            </Link>
          </h2>
          {excerpt ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-[var(--np-muted)]">
              {excerpt}
            </p>
          ) : null}
        </div>
      </article>
    );
  }

  // compact
  return (
    <article className={cn("group flex flex-col gap-2", className)}>
      <Link href={href} className="block overflow-hidden">
        <ArticleImage
          src={imageSrc}
          alt={imageAlt}
          aspectRatio="16/10"
          preset="card"
          priority={priority}
          placeholderUrl={imagePlaceholder}
          imgClassName="transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="flex flex-wrap items-center gap-1.5">
        {isLive ? <Badge variant="live">Live</Badge> : null}
        {category ? (
          <Badge variant="category" href={category.uri ?? `/${category.slug}`}>
            {category.name}
          </Badge>
        ) : null}
        {date ? <Timestamp date={date} relative /> : null}
      </div>
      <h3 className="font-heading text-base font-semibold leading-snug text-[var(--np-text)]">
        <Link href={href} className="hover:text-[var(--np-accent)]">
          {title}
        </Link>
      </h3>
      {excerpt ? (
        <p className="line-clamp-2 text-sm text-[var(--np-muted)]">{excerpt}</p>
      ) : null}
    </article>
  );
}
