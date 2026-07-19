import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArchiveLoadMore } from "@/components/organisms/ArchiveLoadMore";
import {
  SocialLinks,
  authorSocialToLinks,
} from "@/components/molecules/SocialLinks";
import { getAuthorBySlug } from "@/services/content.service";
import { buildPageMetadata } from "@/seo/metadata";
import { personJsonLd, serializeJsonLd } from "@/seo/json-ld";
import { absoluteUrl } from "@/utils/urls";
import { stripHtml } from "@/lib/utils";
import { themeConfig } from "@/config/theme";

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
    const author = await getAuthorBySlug(slug, { first: 1 }, { revalidate: 300 });
    if (!author) return { title: `Author | ${themeConfig.siteName}` };
    return buildPageMetadata({
      title: author.seo?.title || author.name,
      description:
        author.seo?.metaDesc ||
        author.description ||
        `Stories by ${author.name}`,
      path: author.uri || `/author/${slug}`,
      type: "profile",
      image: author.avatar?.url,
    });
  } catch {
    return { title: themeConfig.siteName };
  }
}

export default async function AuthorPage({ params }: PageProps) {
  const { slug } = await params;

  let author;
  try {
    author = await getAuthorBySlug(slug, { first: 12 }, { revalidate: 300 });
  } catch {
    notFound();
  }

  if (!author) notFound();

  const posts = author.posts?.nodes ?? [];
  const pageInfo = {
    hasNextPage: Boolean(author.posts?.pageInfo?.hasNextPage),
    endCursor: author.posts?.pageInfo?.endCursor ?? null,
  };
  const url = absoluteUrl(author.uri || `/author/${slug}`);
  const socialLinks = authorSocialToLinks(author.social);
  const sameAs = Object.values(socialLinks).filter(Boolean) as string[];
  const ld = personJsonLd({
    name: author.name,
    url,
    image: author.avatar?.url,
    description: author.description,
    email: author.email,
    sameAs: sameAs.length ? sameAs : undefined,
  });

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(ld) }}
      />

      <header className="flex flex-col gap-4 border-b border-[var(--np-border)] pb-6 sm:flex-row sm:items-start">
        {author.avatar?.url ? (
          <Image
            src={author.avatar.url}
            alt={author.name}
            width={author.avatar.width || 96}
            height={author.avatar.height || 96}
            className="size-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-full bg-[var(--np-primary)] text-2xl font-bold text-white">
            {author.name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--np-muted)]">
            Author
          </p>
          <h1 className="font-heading text-3xl font-bold text-[var(--np-primary)]">
            {author.name}
          </h1>
          {author.description ? (
            <p className="mt-2 max-w-2xl text-[var(--np-muted)]">
              {stripHtml(author.description)}
            </p>
          ) : null}
          <SocialLinks
            className="mt-4"
            size="md"
            links={socialLinks}
            fallbackToTheme={false}
            hideEmpty
          />
        </div>
      </header>

      <section>
        <h2 className="font-heading text-xl font-bold">Latest from {author.name}</h2>
        <div className="mt-4">
          <ArchiveLoadMore
            kind="author"
            slug={slug}
            initialItems={posts}
            initialPageInfo={pageInfo}
            emptyMessage="No published stories yet."
          />
        </div>
      </section>
    </div>
  );
}
