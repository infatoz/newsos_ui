import Link from "next/link";
import type { Metadata } from "next";
import { ArchiveLoadMore } from "@/components/organisms/ArchiveLoadMore";
import { SearchForm } from "@/components/molecules/SearchForm";
import { TrendingArticlesSection } from "@/components/organisms/TrendingArticlesSection";
import {
  getSearchResults,
  getTrendingPosts,
} from "@/services/content.service";
import { buildPageMetadata } from "@/seo/metadata";
import { themeConfig } from "@/config/theme";

export const revalidate = 30;

export const metadata: Metadata = buildPageMetadata({
  title: "Search",
  description: `Search ${themeConfig.siteName}`,
  path: "/search",
  noIndex: true,
});

type PageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    type?: string;
  }>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "", category, type } = await searchParams;
  const query = q.trim();

  let posts: Awaited<ReturnType<typeof getSearchResults>>["nodes"] = [];
  let pageInfo = { hasNextPage: false, endCursor: null as string | null };
  let error: string | null = null;

  if (query) {
    try {
      const result = await getSearchResults(
        query,
        { first: 12 },
        { revalidate: 30 },
      );
      posts = result.nodes ?? [];
      pageInfo = {
        hasNextPage: Boolean(result.pageInfo?.hasNextPage),
        endCursor: result.pageInfo?.endCursor ?? null,
      };
    } catch {
      error = "Search is temporarily unavailable. Please try again.";
    }
  }

  const filtered = posts.filter((post) => {
    if (category) {
      const slugs = post.categories?.nodes?.map((c) => c.slug) ?? [];
      if (!slugs.includes(category)) return false;
    }
    if (type === "video" && !post.videoUrl) return false;
    return true;
  });

  const showTrending = !query || Boolean(error) || filtered.length === 0;
  const trending = showTrending
    ? await getTrendingPosts(10).catch(() => [])
    : [];

  // Soft filters (category/type) break cursor pagination — only enable Load more for unfiltered search.
  const canLoadMore = !category && !type;

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--np-border)] pb-4">
        <h1 className="font-heading text-3xl font-bold text-[var(--np-primary)]">
          Search
        </h1>
        <p className="mt-1 text-sm text-[var(--np-muted)]">
          Find stories, videos, and analysis across {themeConfig.siteName}.
        </p>
        <div className="mt-4">
          <SearchForm
            variant="page"
            defaultValue={query}
            className="w-full max-w-2xl"
          />
        </div>
        {query ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <FilterChip
              href={`/search?q=${encodeURIComponent(query)}`}
              active={!category && !type}
            >
              All
            </FilterChip>
            <FilterChip
              href={`/search?q=${encodeURIComponent(query)}&type=video`}
              active={type === "video"}
            >
              Videos
            </FilterChip>
            <FilterChip
              href={`/search?q=${encodeURIComponent(query)}&category=india`}
              active={category === "india"}
            >
              India
            </FilterChip>
            <FilterChip
              href={`/search?q=${encodeURIComponent(query)}&category=world`}
              active={category === "world"}
            >
              World
            </FilterChip>
          </div>
        ) : null}
      </header>

      {!query ? (
        <p className="text-sm text-[var(--np-muted)]">
          Enter a keyword above, or explore the top trending stories below.
        </p>
      ) : error ? (
        <p role="alert" className="text-sm text-[var(--np-accent)]">
          {error}
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--np-muted)]">
          No results for “{query}”. Try another keyword or browse trending
          stories below.
        </p>
      ) : (
        <>
          <p className="text-sm text-[var(--np-muted)]">
            Showing results for “{query}”
          </p>
          <ArchiveLoadMore
            kind="search"
            q={query}
            initialItems={filtered}
            initialPageInfo={
              canLoadMore
                ? pageInfo
                : { hasNextPage: false, endCursor: null }
            }
            showExcerpt
            emptyMessage={`No results for “${query}”.`}
          />
        </>
      )}

      {showTrending && trending.length > 0 ? (
        <TrendingArticlesSection
          posts={trending}
          title="Top 10 trending stories"
          description={
            query
              ? "Readers are following these stories right now."
              : "Start here with what’s trending today."
          }
        />
      ) : null}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "bg-[var(--np-primary)] px-2 py-1 font-semibold text-white"
          : "border border-[var(--np-border)] px-2 py-1 hover:border-[var(--np-accent)]"
      }
    >
      {children}
    </Link>
  );
}
