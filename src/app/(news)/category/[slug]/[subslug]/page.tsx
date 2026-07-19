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
  params: Promise<{ slug: string; subslug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, subslug } = await params;
  try {
    const category = await getCategoryBySlug(subslug, { first: 1 }, { revalidate: 120 });
    if (!category) return { title: `Category | ${themeConfig.siteName}` };
    return buildPageMetadata({
      title: category.seo?.title || `${category.name} | ${slug}`,
      description:
        category.seo?.metaDesc ||
        category.description ||
        `Latest ${category.name} news`,
      path: category.uri || `/category/${slug}/${subslug}`,
      canonical: category.seo?.canonical,
    });
  } catch {
    return { title: themeConfig.siteName };
  }
}

export default async function SubcategoryPage({ params }: PageProps) {
  const { slug, subslug } = await params;

  let category;
  try {
    category = await getCategoryBySlug(
      subslug,
      { first: 12 },
      { revalidate: 120 },
    );
  } catch {
    notFound();
  }

  if (!category) notFound();

  const posts = category.posts?.nodes ?? [];
  const pageInfo = {
    hasNextPage: Boolean(category.posts?.pageInfo?.hasNextPage),
    endCursor: category.posts?.pageInfo?.endCursor ?? null,
  };

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm text-[var(--np-muted)]">
        <Link href="/" className="hover:text-[var(--np-accent)]">
          Home
        </Link>
        <span className="mx-1">/</span>
        <Link href={`/category/${slug}`} className="hover:text-[var(--np-accent)] capitalize">
          {slug.replace(/-/g, " ")}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--np-text)]">{category.name}</span>
      </nav>

      <header className="border-b border-[var(--np-border)] pb-4">
        <h1 className="font-heading text-3xl font-bold text-[var(--np-primary)]">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mt-2 max-w-2xl text-[var(--np-muted)]">
            {stripHtml(category.description)}
          </p>
        ) : null}
      </header>

      <ArchiveLoadMore
        kind="category"
        slug={subslug}
        initialItems={posts}
        initialPageInfo={pageInfo}
        featureFirst
        emptyMessage="No articles in this subcategory yet."
      />
    </div>
  );
}
