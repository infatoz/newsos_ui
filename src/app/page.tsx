import Link from "next/link";
import Image from "next/image";
import { type ReactNode } from "react";
import type { Metadata } from "next";
import { ArticleCard } from "@/components/molecules/ArticleCard";
import { BreakingTicker } from "@/components/molecules/BreakingTicker";
import { AdSlot } from "@/components/atoms/AdSlot";
import { LiveTvWidget } from "@/widgets/LiveTvWidget";
import { MainLayout } from "@/layouts/MainLayout";
import { buildPageMetadata } from "@/seo/metadata";
import { themeConfig } from "@/config/theme";
import { getHomepagePayload, getHomepageChrome } from "@/services/homepage.service";
import { getActiveAds } from "@/services/ads.service";
import { getStories, getLiveBlogs } from "@/services/content.service";
import { getSiteBranding } from "@/services/branding.service";
import type { HomepageBlock, Post, Ad } from "@/types";
import type { GraphQLStory } from "@/services/content.service";
import type { LiveBlog } from "@/types";
import { cn } from "@/lib/utils";
import { resolveSlotSize } from "@/utils/ad-slot-size";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: themeConfig.siteName,
  description: themeConfig.siteDescription,
  path: "/",
});

function SectionShell({
  title,
  href,
  children,
  compact,
}: {
  title: string;
  href?: string | null;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={cn("space-y-3", compact && "h-full")}>
      <div className="flex items-baseline justify-between gap-4 border-b-2 border-[var(--np-primary)] pb-2">
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-[var(--np-primary)] md:text-xl">
          {title}
        </h2>
        {href ? (
          <Link
            href={href}
            className="text-xs font-semibold uppercase tracking-wide text-[var(--np-accent)] hover:underline"
          >
            More
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function PostGrid({
  posts,
  variant = "compact",
  columns = 3,
  cardLayout = "grid",
}: {
  posts: Post[];
  variant?: "featured" | "compact" | "horizontal";
  columns?: 1 | 2 | 3;
  cardLayout?: "grid" | "list" | "magazine" | "horizontal";
}) {
  if (!posts.length) {
    return (
      <p className="text-sm text-[var(--np-muted)]">No stories available.</p>
    );
  }

  if (cardLayout === "list" || cardLayout === "horizontal") {
    return (
      <ul className="flex flex-col gap-3">
        {posts.map((post, i) => (
          <li key={post.id}>
            <ArticleCard
              article={post}
              variant="horizontal"
              showExcerpt={i === 0}
              priority={i === 0}
            />
          </li>
        ))}
      </ul>
    );
  }

  if (cardLayout === "magazine" && posts.length > 1) {
    const [lead, ...rest] = posts;
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ArticleCard article={lead} variant="featured" showExcerpt priority />
        </div>
        <ul className="flex flex-col gap-3">
          {rest.slice(0, 4).map((post) => (
            <li key={post.id}>
              <ArticleCard article={post} variant="horizontal" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const colClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid gap-4 sm:grid-cols-2"
        : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <ul className={colClass}>
      {posts.map((post, i) => (
        <li key={post.id}>
          <ArticleCard
            article={post}
            variant={i === 0 && variant === "featured" ? "featured" : variant}
            showExcerpt={i === 0}
            priority={i === 0}
          />
        </li>
      ))}
    </ul>
  );
}

function HeroBlock({ block }: { block: Extract<HomepageBlock, { type: "hero" }> }) {
  const secondary = block.secondary ?? [];
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ArticleCard article={block.featured} variant="featured" showExcerpt priority />
      </div>
      <ul className="flex flex-col gap-3 border-l-0 border-[var(--np-border)] lg:border-l lg:pl-4">
        {secondary.map((story) => {
          const key =
            "id" in story && typeof story.id === "string"
              ? story.id
              : "slug" in story && typeof story.slug === "string"
                ? story.slug
                : Math.random().toString(36);
          return (
            <li key={key}>
              <ArticleCard article={story} variant="horizontal" />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function renderBlock(block: HomepageBlock, compact = false) {
  const type = block.type;
  const cardLayout = block.cardLayout ?? "grid";
  const gridCols =
    block.layoutWidth === "half" || block.layoutWidth === "third" ? 1 : 3;

  if (type === "hero") {
    const hero = block as Extract<HomepageBlock, { type: "hero" }>;
    return <HeroBlock key={hero.id} block={hero} />;
  }
  if (type === "breaking") {
    return null;
  }
  if (type === "most-read") {
    const b = block as Extract<HomepageBlock, { type: "most-read" }>;
    return (
      <SectionShell key={b.id} title={b.title || "Trending"} href={b.viewAllHref} compact={compact}>
        <PostGrid
          posts={b.stories as Post[]}
          columns={gridCols as 1 | 2 | 3}
          cardLayout={cardLayout}
        />
      </SectionShell>
    );
  }
  if (type === "editors-picks") {
    const b = block as Extract<HomepageBlock, { type: "editors-picks" }>;
    return (
      <SectionShell key={b.id} title={b.title || "Editors’ Picks"} href={b.viewAllHref} compact={compact}>
        <PostGrid
          posts={b.stories as Post[]}
          variant="featured"
          columns={gridCols as 1 | 2 | 3}
          cardLayout={cardLayout}
        />
      </SectionShell>
    );
  }
  if (type === "top-stories") {
    const b = block as Extract<HomepageBlock, { type: "top-stories" }>;
    return (
      <SectionShell key={b.id} title={b.title || "Latest"} href={b.viewAllHref} compact={compact}>
        <PostGrid
          posts={b.stories as Post[]}
          columns={gridCols as 1 | 2 | 3}
          cardLayout={b.layout === "magazine" ? "magazine" : cardLayout}
        />
      </SectionShell>
    );
  }
  if (type === "section-rail") {
    const b = block as Extract<HomepageBlock, { type: "section-rail" }>;
    return (
      <SectionShell
        key={b.id}
        title={b.title || b.category?.name || "Section"}
        href={
          b.viewAllHref ??
          (b.category?.slug ? `/category/${b.category.slug}` : null)
        }
        compact={compact}
      >
        <PostGrid
          posts={b.stories as Post[]}
          columns={gridCols as 1 | 2 | 3}
          cardLayout={cardLayout}
        />
      </SectionShell>
    );
  }
  if (type === "opinion") {
    const b = block as Extract<HomepageBlock, { type: "opinion" }>;
    return (
      <SectionShell key={b.id} title={b.title || "Opinion"} href={b.viewAllHref} compact={compact}>
        <PostGrid
          posts={b.stories as Post[]}
          cardLayout="horizontal"
          columns={1}
        />
      </SectionShell>
    );
  }
  if (type === "newsletter") {
    const b = block as Extract<HomepageBlock, { type: "newsletter" }>;
    return (
      <section
        key={b.id}
        className="rounded-sm border border-[var(--np-border)] bg-[var(--np-surface)] p-6"
      >
        <h2 className="font-heading text-xl font-bold text-[var(--np-primary)]">
          {b.heading || b.title || "Newsletter"}
        </h2>
        <p className="mt-2 text-sm text-[var(--np-muted)]">
          {b.description ||
            "Get the day’s top stories delivered to your inbox."}
        </p>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          action={`mailto:${themeConfig.contactEmail}`}
          method="get"
        >
          <input
            type="email"
            name="body"
            required
            placeholder="Your email"
            className="flex-1 border border-[var(--np-border)] bg-white px-3 py-2 text-sm"
            aria-label="Email address"
          />
          <button
            type="submit"
            className="bg-[var(--np-accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            {b.ctaLabel || "Subscribe"}
          </button>
        </form>
      </section>
    );
  }
  if (type === "ad") {
    const b = block as Extract<HomepageBlock, { type: "ad" }>;
    const reserve = {
      adWidth: b.slotWidth,
      adHeight: b.slotHeight,
      adWidthMobile: b.slotWidthMobile,
      adHeightMobile: b.slotHeightMobile,
    };
    const size = resolveSlotSize(b.ad, reserve);
    return (
      <div key={b.id} className="flex justify-center py-2">
        <AdSlot ad={b.ad} reserve={reserve} lazy />
        <span className="sr-only">
          Advertisement slot {size.width}x{size.height}
        </span>
      </div>
    );
  }
  if (type === "live") {
    const b = block as Extract<HomepageBlock, { type: "live" }>;
    return (
      <div key={b.id} className={cn(compact && "h-full")}>
        <LiveTvWidget stream={b.stream} title={b.title || "Live TV"} />
      </div>
    );
  }
  if (type === "video") {
    const b = block as Extract<HomepageBlock, { type: "video" }>;
    return (
      <SectionShell key={b.id} title={b.title || "Videos"} href="/videos" compact={compact}>
        {b.videos?.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {b.videos.map((video) => (
              <li key={video.id}>
                <Link href={video.href} className="block space-y-2">
                  <div className="relative aspect-video w-full overflow-hidden bg-[var(--np-surface)]">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    ) : null}
                  </div>
                  <h3 className="font-heading text-sm font-semibold">{video.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--np-muted)]">No videos available.</p>
        )}
      </SectionShell>
    );
  }
  if (type === "photo-gallery") {
    const b = block as Extract<HomepageBlock, { type: "photo-gallery" }>;
    return (
      <SectionShell
        key={b.id}
        title={b.title || "Photos"}
        href={b.viewAllHref || "/photos"}
        compact={compact}
      >
        {b.albums.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {b.albums.map((album) => (
              <li key={album.id}>
                <Link href={album.href} className="block space-y-2">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--np-surface)]">
                    {album.coverUrl ? (
                      <Image
                        src={album.coverUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : null}
                  </div>
                  <h3 className="font-heading text-sm font-semibold">{album.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--np-muted)]">No photo stories available.</p>
        )}
      </SectionShell>
    );
  }
  if (type === "custom") {
    const b = block as Extract<HomepageBlock, { type: "custom" }>;
    const stories = Array.isArray(b.payload?.stories)
      ? (b.payload.stories as Array<{
          id: string;
          title?: string | null;
          href?: string;
          coverUrl?: string | null;
        }>)
      : [];
    if (b.payload?.blockType === "stories" || stories.length) {
      return (
        <SectionShell
          key={b.id}
          title={b.title || "Web Stories"}
          href={b.viewAllHref || "/stories"}
          compact={compact}
        >
          {stories.length ? (
            <ul className="flex gap-3 overflow-x-auto pb-2">
              {stories.map((story) => (
                <li key={story.id} className="w-36 shrink-0">
                  <Link href={story.href || "/stories"} className="block">
                    <div className="relative aspect-[9/16] w-full overflow-hidden bg-[var(--np-border)]">
                      {story.coverUrl ? (
                        <Image
                          src={story.coverUrl}
                          alt={story.title ?? ""}
                          fill
                          className="object-cover"
                          sizes="144px"
                        />
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-medium">
                      {story.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--np-muted)]">No web stories available.</p>
          )}
        </SectionShell>
      );
    }
  }
  return null;
}

type LayoutWidth = NonNullable<HomepageBlock["layoutWidth"]>;

function widthUnits(width: LayoutWidth = "full"): number {
  if (width === "half") return 3;
  if (width === "third") return 2;
  if (width === "two-thirds") return 4;
  return 6;
}

function spanClass(width: LayoutWidth = "full"): string {
  if (width === "half") return "md:col-span-3";
  if (width === "third") return "md:col-span-2";
  if (width === "two-thirds") return "md:col-span-4";
  return "md:col-span-6";
}

/** Pack consecutive non-full blocks into 2/3-column rows (TOI / Google News style). */
function renderPackedBlocks(blocks: HomepageBlock[]) {
  const rows: ReactNode[] = [];
  let row: HomepageBlock[] = [];
  let used = 0;

  const flush = () => {
    if (!row.length) return;
    if (row.length === 1 && (row[0].layoutWidth ?? "full") === "full") {
      rows.push(
        <div key={`row-${row[0].id}`} className="w-full">
          {renderBlock(row[0], false)}
        </div>,
      );
    } else {
      rows.push(
        <div
          key={`row-${row.map((b) => b.id).join("-")}`}
          className="grid grid-cols-1 gap-6 md:grid-cols-6"
        >
          {row.map((block) => (
            <div
              key={block.id}
              className={cn("min-w-0", spanClass(block.layoutWidth))}
            >
              {renderBlock(block, true)}
            </div>
          ))}
        </div>,
      );
    }
    row = [];
    used = 0;
  };

  for (const block of blocks) {
    const width = block.layoutWidth ?? "full";
    const units = widthUnits(width);

    if (width === "full") {
      flush();
      rows.push(
        <div key={`full-${block.id}`} className="w-full">
          {renderBlock(block, false)}
        </div>,
      );
      continue;
    }

    if (used + units > 6) {
      flush();
    }
    row.push(block);
    used += units;
    if (used >= 6) {
      flush();
    }
  }
  flush();
  return rows;
}

async function HomeVideosAndLive({
  stories,
  liveBlogs,
  showStories,
}: {
  stories: GraphQLStory[];
  liveBlogs: LiveBlog[];
  showStories: boolean;
}) {
  return (
    <>
      {liveBlogs.length > 0 ? (
        <SectionShell title="Live" href="/search?q=live">
          <ul className="grid gap-3 sm:grid-cols-2">
            {liveBlogs.map((blog) => (
              <li key={blog.id}>
                <Link
                  href={blog.uri || `/live-blog/${blog.slug}`}
                  className="block border border-[var(--np-border)] bg-[var(--np-surface)] p-4 hover:border-[var(--np-accent)]"
                >
                  <span className="inline-block bg-[var(--np-live)] px-2 py-0.5 text-xs font-bold uppercase text-white">
                    Live
                  </span>
                  <h3 className="mt-2 font-heading text-lg font-semibold">
                    {blog.title}
                  </h3>
                  {blog.summary ? (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--np-muted)]">
                      {blog.summary}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}

      {showStories && stories.length > 0 ? (
        <SectionShell title="Web Stories" href="/stories">
          <ul className="flex gap-3 overflow-x-auto pb-2">
            {stories.map((story) => (
              <li key={story.id} className="w-36 shrink-0">
                <Link
                  href={story.uri || `/stories/${story.slug}`}
                  className="block"
                >
                  <div className="relative aspect-[9/16] w-full overflow-hidden bg-[var(--np-border)]">
                    {story.coverImageUrl ? (
                      <Image
                        src={story.coverImageUrl}
                        alt={story.title ?? ""}
                        fill
                        className="object-cover"
                        sizes="144px"
                      />
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-medium">
                    {story.title}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}
    </>
  );
}

export default async function HomePage() {
  // Await homepage chrome + content together so breaking ticker / hero / ads
  // are in the first HTML paint (avoids Suspense insertion CLS on <main>).
  const [branding, chrome, homeBundle, placementAds] = await Promise.all([
    getSiteBranding({ revalidate: 300 }),
    getHomepageChrome({ revalidate: 300 }).catch(() => null),
    Promise.all([
      getStories({ first: 8 }, { revalidate: 60 }),
      getLiveBlogs({ first: 3 }, { revalidate: 30 }),
      getHomepagePayload({ revalidate: 60 }),
    ]).catch(() => null),
    getActiveAds({ placement: "homepage" }, { revalidate: 30 }).catch(
      (): Ad[] => [],
    ),
  ]);

  const stories = homeBundle?.[0]?.nodes ?? [];
  const liveBlogs = homeBundle?.[1]?.nodes ?? [];
  const payload = homeBundle?.[2] ?? null;
  const hasStoriesBlock = Boolean(
    payload?.blocks.some(
      (b) =>
        b.type === "custom" &&
        (b as Extract<HomepageBlock, { type: "custom" }>).payload?.blockType ===
          "stories",
    ),
  );
  const hasBuilderAd = Boolean(payload?.blocks.some((b) => b.type === "ad"));
  const homepageAd =
    !hasBuilderAd && placementAds.length > 0 ? placementAds[0] : null;

  return (
    <MainLayout
      logoUrl={branding.logoUrl}
      siteName={branding.siteName}
      siteDescription={branding.siteTagline}
      navItems={chrome?.navigation?.primary}
      utilityItems={chrome?.navigation?.utility}
      trendingItems={chrome?.navigation?.trending}
      mobileScrollItems={chrome?.navigation?.mobileScroll}
      footerGroups={chrome?.navigation?.footer}
      footerSettings={chrome?.navigation?.footerSettings}
      mobileNav={chrome?.navigation?.mobile}
      mobileNavStyle={chrome?.navigation?.mobileStyle}
      topSlot={
        payload?.breaking?.length ? (
          <BreakingTicker items={payload.breaking} />
        ) : null
      }
    >
      <div className="flex flex-col gap-10">
        {payload?.blocks.length ? (
          <div className="flex flex-col gap-8 md:gap-10">
            {renderPackedBlocks(payload.blocks)}
          </div>
        ) : (
          <p className="text-sm text-[var(--np-muted)]">
            Homepage sections are temporarily unavailable.
          </p>
        )}

        {homepageAd ? (
          <div className="flex justify-center py-2">
            <AdSlot ad={homepageAd} lazy />
          </div>
        ) : null}

        <HomeVideosAndLive
          stories={stories}
          liveBlogs={liveBlogs}
          showStories={!hasStoriesBlock}
        />
      </div>
    </MainLayout>
  );
}
