import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPollBySlug } from "@/services/content.service";
import { PollEmbed } from "@/components/organisms/PollEmbed";
import { buildPageMetadata } from "@/seo/metadata";
import { themeConfig } from "@/config/theme";

export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const poll = await getPollBySlug(slug, { revalidate: 60 });
    if (!poll) return { title: `Poll | ${themeConfig.siteName}` };
    return buildPageMetadata({
      title: poll.question,
      description: `Vote: ${poll.question}`,
      path: `/poll/${slug}`,
    });
  } catch {
    return { title: themeConfig.siteName };
  }
}

export default async function PollPage({ params }: PageProps) {
  const { slug } = await params;

  let poll;
  try {
    poll = await getPollBySlug(slug, { revalidate: 60 });
  } catch {
    notFound();
  }

  if (!poll) notFound();

  return (
    <article className="mx-auto max-w-xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-[var(--np-muted)]">
        <Link href="/" className="hover:text-[var(--np-accent)]">
          Home
        </Link>
        <span className="mx-1">/</span>
        <span>Poll</span>
      </nav>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--np-accent)]">
          Reader poll
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-[var(--np-primary)] md:text-3xl">
          {poll.question}
        </h1>
      </header>

      <PollEmbed poll={poll} className="my-0" />
    </article>
  );
}
