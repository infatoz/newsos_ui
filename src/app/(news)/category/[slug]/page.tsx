import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArchiveLoadMore } from "@/components/organisms/ArchiveLoadMore";
import { getCategoryBySlug } from "@/services/content.service";
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
    const category = await getCategoryBySlug(slug, { first: 1 }, { revalidate: 120 });
    if (!category) return { title: `Category | ${themeConfig.siteName}` };
    return buildPageMetadata({
      title: category.seo?.title || category.name,
      description:
        category.seo?.metaDesc ||
        category.description ||
        `Latest ${category.name} news from ${themeConfig.siteName}`,
      path: category.uri || `/category/${slug}`,
      canonical: category.seo?.canonical,
      noIndex: category.seo?.metaRobotsNoindex === "yes",
    });
  } catch {
    return { title: themeConfig.siteName };
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  let category;
  try {
    category = await getCategoryBySlug(
      slug,
      { first: 12 },
      { revalidate: 120 },
    );
  } catch {
    notFound();
  }

  if (!category) notFound();

  const posts = category.posts?.nodes ?? [];
  const children = category.children?.nodes ?? [];
  const pageInfo = {
    hasNextPage: Boolean(category.posts?.pageInfo?.hasNextPage),
    endCursor: category.posts?.pageInfo?.endCursor ?? null,
  };

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--np-border)] pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--np-accent)]">
          Category
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-[var(--np-primary)]">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mt-2 max-w-2xl text-[var(--np-muted)]">
            {stripHtml(category.description)}
          </p>
        ) : null}
      </header>

      {children.length > 0 ? (
        <nav aria-label="Subcategories" className="flex flex-wrap gap-2">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/category/${slug}/${child.slug}`}
              className="border border-[var(--np-border)] px-3 py-1 text-sm hover:border-[var(--np-accent)]"
            >
              {child.name}
            </Link>
          ))}
        </nav>
      ) : null}

      <ArchiveLoadMore
        kind="category"
        slug={slug}
        initialItems={posts}
        initialPageInfo={pageInfo}
        featureFirst
        emptyMessage="No articles in this category yet."
      />
    </div>
  );
}
