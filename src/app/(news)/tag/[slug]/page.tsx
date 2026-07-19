import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArchiveLoadMore } from "@/components/organisms/ArchiveLoadMore";
import { getTagBySlug } from "@/services/content.service";
import { buildPageMetadata } from "@/seo/metadata";
import { themeConfig } from "@/config/theme";
import { stripHtml } from "@/lib/utils";

export const revalidate = 120;

export async function generateStaticParams() {
  return [];
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const tag = await getTagBySlug(slug, { first: 1 }, { revalidate: 120 });
    if (!tag) return { title: `Tag | ${themeConfig.siteName}` };
    return buildPageMetadata({
      title: tag.seo?.title || tag.name,
      description:
        tag.seo?.metaDesc ||
        tag.description ||
        `Stories tagged ${tag.name}`,
      path: tag.uri || `/tag/${slug}`,
      keywords: [tag.name],
    });
  } catch {
    return { title: themeConfig.siteName };
  }
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;

  let tag;
  try {
    tag = await getTagBySlug(slug, { first: 12 }, { revalidate: 120 });
  } catch {
    notFound();
  }

  if (!tag) notFound();

  const posts = tag.posts?.nodes ?? [];
  const pageInfo = {
    hasNextPage: Boolean(tag.posts?.pageInfo?.hasNextPage),
    endCursor: tag.posts?.pageInfo?.endCursor ?? null,
  };

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--np-border)] pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--np-accent)]">
          Tag
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-[var(--np-primary)]">
          #{tag.name}
        </h1>
        {tag.description ? (
          <p className="mt-2 text-[var(--np-muted)]">{stripHtml(tag.description)}</p>
        ) : null}
        {typeof tag.count === "number" ? (
          <p className="mt-1 text-sm text-[var(--np-muted)]">{tag.count} stories</p>
        ) : null}
      </header>

      <ArchiveLoadMore
        kind="tag"
        slug={slug}
        initialItems={posts}
        initialPageInfo={pageInfo}
        emptyMessage="No stories with this tag."
      />
    </div>
  );
}
