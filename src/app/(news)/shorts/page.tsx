import type { Metadata } from "next";
import { ArchiveLoadMore } from "@/components/organisms/ArchiveLoadMore";
import { getShorts } from "@/services/media.service";
import { buildPageMetadata } from "@/seo/metadata";
import { themeConfig } from "@/config/theme";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Shorts",
  description: `Vertical short videos from ${themeConfig.siteName}`,
  path: "/shorts",
});

export default async function ShortsIndexPage() {
  let nodes: Awaited<ReturnType<typeof getShorts>>["nodes"] = [];
  let pageInfo = { hasNextPage: false, endCursor: null as string | null };
  let error = false;

  try {
    const result = await getShorts({ first: 24 }, { revalidate: 60 });
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
          Shorts
        </h1>
        <p className="mt-2 text-[var(--np-muted)]">
          Vertical clips — YouTube, video links, or image slides. Tap to open
          the full-screen feed.
        </p>
      </header>

      {error ? (
        <p role="alert" className="text-sm text-[var(--np-accent)]">
          Shorts are temporarily unavailable.
        </p>
      ) : (
        <ArchiveLoadMore
          kind="shorts"
          initialItems={nodes}
          initialPageInfo={pageInfo}
          first={24}
          emptyMessage="No shorts published yet."
        />
      )}
    </div>
  );
}
