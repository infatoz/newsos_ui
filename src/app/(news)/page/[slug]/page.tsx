import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleBody } from "@/components/organisms/ArticleBody";
import {
  getPageBySlug,
  getPollById,
} from "@/services/content.service";
import { buildPageMetadata } from "@/seo/metadata";
import { extractPollIdsFromHtml } from "@/utils/poll";
import { stripHtml } from "@/lib/utils";
import { themeConfig } from "@/config/theme";
import type { Poll } from "@/types";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await getPageBySlug(slug, { revalidate: 300 });
    if (!page) return { title: themeConfig.siteName };
    return buildPageMetadata({
      title: page.seo?.title || page.title,
      description: page.seo?.metaDesc || stripHtml(page.excerpt || ""),
      path: page.uri || `/page/${slug}`,
      canonical: page.seo?.canonical,
      image: page.featuredImage?.node?.sourceUrl,
      noIndex: page.seo?.metaRobotsNoindex === "yes",
    });
  } catch {
    return { title: themeConfig.siteName };
  }
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;

  let page;
  try {
    page = await getPageBySlug(slug, { revalidate: 300 });
  } catch {
    notFound();
  }

  if (!page) notFound();

  const contentHtml = page.content ?? "";
  const pollIds = extractPollIdsFromHtml(contentHtml);
  const polls: Record<number, Poll> = {};
  await Promise.all(
    pollIds.map(async (id) => {
      try {
        const poll = await getPollById(id, { revalidate: 60 });
        if (poll) polls[id] = poll;
      } catch {
        /* PollSlot will client-fetch as fallback */
      }
    }),
  );

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="border-b border-[var(--np-border)] pb-4">
        <h1 className="font-heading text-3xl font-bold text-[var(--np-primary)]">
          {page.title}
        </h1>
      </header>
      {contentHtml ? (
        <ArticleBody html={contentHtml} polls={polls} />
      ) : (
        <p className="text-sm text-[var(--np-muted)]">This page has no content.</p>
      )}
    </article>
  );
}
