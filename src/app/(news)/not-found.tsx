import Link from "next/link";
import { SearchForm } from "@/components/molecules/SearchForm";
import { TrendingArticlesSection } from "@/components/organisms/TrendingArticlesSection";
import { getTrendingPosts } from "@/services/content.service";

/**
 * Shown when notFound() is called under (news) — already wrapped by MainLayout.
 */
export default async function NewsNotFound() {
  const trending = await getTrendingPosts(10).catch(() => []);

  return (
    <div className="space-y-10">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--np-accent)]">
          404
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-[var(--np-primary)] sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-3 text-[var(--np-muted)]">
          The page you requested may have moved or is no longer available. Try
          a search or browse today&apos;s top stories below.
        </p>
        <div className="mt-6 w-full">
          <SearchForm variant="page" className="mx-auto max-w-md" />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="bg-[var(--np-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Go home
          </Link>
          <Link
            href="/search"
            className="border border-[var(--np-border)] px-4 py-2 text-sm font-semibold hover:border-[var(--np-accent)]"
          >
            Browse search
          </Link>
        </div>
      </div>

      <TrendingArticlesSection
        posts={trending}
        title="Top 10 trending stories"
        description="Popular coverage you may want to read instead."
      />
    </div>
  );
}
