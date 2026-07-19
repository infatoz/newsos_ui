import type { Metadata } from "next";
import { ArchiveLoadMore } from "@/components/organisms/ArchiveLoadMore";
import { getStories } from "@/services/content.service";
import { buildPageMetadata } from "@/seo/metadata";
import { themeConfig } from "@/config/theme";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Web Stories",
  description: `Visual stories from ${themeConfig.siteName}`,
  path: "/stories",
});

export default async function StoriesIndexPage() {
  let nodes: Awaited<ReturnType<typeof getStories>>["nodes"] = [];
  let pageInfo = { hasNextPage: false, endCursor: null as string | null };
  let error = false;

  try {
    const result = await getStories({ first: 24 }, { revalidate: 60 });
    nodes = result.nodes ?? [];
    pageInfo = {
      hasNextPage: Boolean(result.pageInfo?.hasNextPage),
      endCursor: result.pageInfo?.endCursor ?? null,
    };
  } catch {
    error = true;
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-[var(--np-border)] pb-4">
        <h1 className="font-heading text-3xl font-bold text-[var(--np-primary)]">
          Web Stories
        </h1>
        <p className="mt-2 text-[var(--np-muted)]">
          Immersive, vertical stories from the newsroom.
        </p>
      </header>

      {error ? (
        <p role="alert" className="text-sm text-[var(--np-accent)]">
          Stories are temporarily unavailable.
        </p>
      ) : (
        <ArchiveLoadMore
          kind="stories"
          initialItems={nodes}
          initialPageInfo={pageInfo}
          first={24}
          emptyMessage="No web stories published yet."
        />
      )}
    </div>
  );
}
