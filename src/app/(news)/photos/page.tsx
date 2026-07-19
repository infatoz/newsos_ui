import type { Metadata } from "next";
import { ArchiveLoadMore } from "@/components/organisms/ArchiveLoadMore";
import { getPhotoStories } from "@/services/media.service";
import { buildPageMetadata } from "@/seo/metadata";
import { themeConfig } from "@/config/theme";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Photos",
  description: `Photo galleries from ${themeConfig.siteName}`,
  path: "/photos",
});

export default async function PhotosIndexPage() {
  let nodes: Awaited<ReturnType<typeof getPhotoStories>>["nodes"] = [];
  let pageInfo = { hasNextPage: false, endCursor: null as string | null };
  let error = false;

  try {
    const result = await getPhotoStories({ first: 24 }, { revalidate: 60 });
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
          Photos
        </h1>
        <p className="mt-2 text-[var(--np-muted)]">
          Photo stories and galleries from the field.
        </p>
      </header>

      {error ? (
        <p role="alert" className="text-sm text-[var(--np-accent)]">
          Photo stories are temporarily unavailable.
        </p>
      ) : (
        <ArchiveLoadMore
          kind="photos"
          initialItems={nodes}
          initialPageInfo={pageInfo}
          first={24}
          emptyMessage="No photo stories published yet."
        />
      )}
    </div>
  );
}
