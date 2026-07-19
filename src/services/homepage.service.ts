import {
  GET_HOME_DATA,
  GET_NAVIGATION,
  GET_SITE_SETTINGS,
  GET_ACTIVE_LIVE_BLOGS,
  GET_FEATURED_STORIES,
} from "@/graphql";
import type { GraphQLFetchOptions } from "@/lib/graphql-fetch";
import type {
  BreakingNews,
  DesktopNavItem,
  FooterSettings,
  HomepageBlock,
  HomepagePayload,
  LiveBlog,
  NavigationMenus,
  Post,
} from "@/types";
import type { FooterNavGroup, MobileNavItem } from "@/types/navigation";
import { fetchQuery } from "./graphql.helpers";
import { getActiveAds } from "./ads.service";

interface RawHomepageBlock {
  id: string;
  databaseId: number;
  title?: string | null;
  blockType?: string | null;
  config?: string | null;
  isEnabled?: boolean | null;
  categoryId?: number | null;
  postLimit?: number | null;
  titleOverride?: string | null;
  menuOrder?: number | null;
}

interface RawBreaking {
  id: string;
  databaseId: number;
  title?: string | null;
  tickerText?: string | null;
  linkUrl?: string | null;
  priority?: number | null;
  schedule?: string | null;
  expiry?: string | null;
  isActive?: boolean | null;
}

interface HomeQueryData {
  homepageBlocks?: { nodes?: RawHomepageBlock[] | null } | null;
  breakingNewsActive?: RawBreaking[] | null;
  latestPosts: { nodes: Post[] };
  trendingPosts: { nodes: Post[] };
  stickyPosts: { nodes: Post[] };
  categories: {
    nodes: Array<{
      id: string;
      databaseId: number;
      name: string;
      slug: string;
      uri?: string | null;
      posts?: { nodes: Post[] } | null;
    }>;
  };
  liveStreams?: {
    nodes?: Array<{
      id: string;
      databaseId: number;
      title?: string | null;
      excerpt?: string | null;
      streamUrl?: string | null;
      videoId?: string | null;
      embedUrl?: string | null;
      streamStatus?: string | null;
      showOnHomepage?: boolean | null;
    }> | null;
  } | null;
  videos?: {
    nodes?: Array<{
      id: string;
      databaseId: number;
      title?: string | null;
      slug?: string | null;
      uri?: string | null;
      videoUrl?: string | null;
      videoDuration?: number | null;
      featuredImage?: { node?: { sourceUrl?: string | null } | null } | null;
    }> | null;
  } | null;
  photoStories?: {
    nodes?: Array<{
      id: string;
      databaseId: number;
      title?: string | null;
      slug?: string | null;
      uri?: string | null;
      photoCoverUrl?: string | null;
      photoCount?: number | null;
      featuredImage?: { node?: { sourceUrl?: string | null } | null } | null;
    }> | null;
  } | null;
  stories?: {
    nodes?: Array<{
      id: string;
      databaseId: number;
      title?: string | null;
      slug?: string | null;
      uri?: string | null;
      coverImageUrl?: string | null;
    }> | null;
  } | null;
}

function parseConfig(raw?: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function parseLayoutWidth(
  config: Record<string, unknown>,
  blockType?: string,
): "full" | "half" | "third" | "two-thirds" {
  const hasExplicit =
    typeof config.layoutWidth === "string" || typeof config.layout === "string";
  const raw = String(config.layoutWidth ?? config.layout ?? "").toLowerCase();

  if (hasExplicit) {
    if (raw === "half" || raw === "2" || raw === "columns-2" || raw === "50") {
      return "half";
    }
    if (raw === "third" || raw === "1/3" || raw === "columns-3" || raw === "33") {
      return "third";
    }
    if (
      raw === "two-thirds" ||
      raw === "two_thirds" ||
      raw === "2/3" ||
      raw === "66"
    ) {
      return "two-thirds";
    }
    if (raw === "full" || raw === "1" || raw === "100") {
      return "full";
    }
  }

  // Google News / TOI-style defaults when editors haven't set a width yet.
  const t = (blockType || "").replace(/_/g, "-");
  if (t === "live-tv" || t === "live") return "half";
  if (t === "latest" || t === "top-stories") return "half";
  if (t === "trending") return "two-thirds";
  if (t === "most-read") return "third";
  if (t === "videos" || t === "video" || t === "opinion") return "half";
  if (t === "category") return "third";
  if (t === "photos" || t === "stories") return "half";
  return "full";
}

function parseCardLayout(
  config: Record<string, unknown>,
): "grid" | "list" | "magazine" | "horizontal" {
  const raw = String(config.cardLayout ?? config.display ?? "grid").toLowerCase();
  if (raw === "list" || raw === "magazine" || raw === "horizontal") {
    return raw;
  }
  return "grid";
}

function mapBreaking(items: RawBreaking[]): BreakingNews[] {
  return items.map((item) => ({
    id: item.id,
    databaseId: item.databaseId,
    headline: item.tickerText || item.title || "",
    href: item.linkUrl || null,
    startedAt: item.schedule || null,
    expiresAt: item.expiry || null,
    priority: item.priority ?? null,
    isActive: Boolean(item.isActive),
    label: "Breaking",
  }));
}

type RawMobileNavTab = {
  icon?: string | null;
  iconSvg?: string | null;
  label?: string | null;
  url?: string | null;
  order?: number | null;
  visible?: boolean | null;
};

type RawMobileNav = {
  enabled?: boolean | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  hoverColor?: string | null;
  activeColor?: string | null;
  borderColor?: string | null;
  tabs?: RawMobileNavTab[] | null;
} | null;

function mapMobileTabs(tabs: RawMobileNavTab[] = []): MobileNavItem[] {
  return tabs
    .filter((tab) => tab.visible !== false && tab.label && tab.url)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((tab, index) => ({
      id: `mobile-tab-${index}`,
      label: tab.label!,
      href: tab.url!,
      icon: tab.icon ?? null,
      iconSvg: tab.iconSvg?.trim() || null,
      order: tab.order ?? index,
    }));
}

function mapMobileNav(mobileNav: RawMobileNav): {
  tabs: MobileNavItem[];
  style: import("@/types/navigation").MobileNavStyle | null;
} {
  if (!mobileNav || mobileNav.enabled === false) {
    return { tabs: [], style: null };
  }

  return {
    tabs: mapMobileTabs(mobileNav.tabs ?? []),
    style: {
      backgroundColor: mobileNav.backgroundColor ?? null,
      textColor: mobileNav.textColor ?? null,
      hoverColor: mobileNav.hoverColor ?? null,
      activeColor: mobileNav.activeColor ?? null,
      borderColor: mobileNav.borderColor ?? null,
    },
  };
}

interface RawEnmMenuItem {
  id: string;
  databaseId?: number | null;
  label?: string | null;
  url?: string | null;
  path?: string | null;
  target?: string | null;
  description?: string | null;
  order?: number | null;
  children?: RawEnmMenuItem[] | null;
}

function menuHref(item: RawEnmMenuItem): string {
  const path = item.path?.trim();
  const url = item.url?.trim();
  if (path && path.startsWith("/")) return path;
  if (path && (path.startsWith("http://") || path.startsWith("https://"))) {
    return path;
  }
  if (url) {
    try {
      const parsed = new URL(url, "http://localhost");
      if (parsed.pathname) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
      }
    } catch {
      return url;
    }
    return url;
  }
  return "/";
}

function mapMenuItems(items: RawEnmMenuItem[] | null | undefined): DesktopNavItem[] {
  if (!items?.length) return [];
  return items
    .map((item) => ({
      id: item.id,
      label: item.label ?? "",
      href: menuHref(item),
      target: (item.target as DesktopNavItem["target"]) || "_self",
      description: item.description ?? null,
      order: item.order ?? 0,
      children: mapMenuItems(item.children ?? []),
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function mapHomepageBlocks(
  rawBlocks: RawHomepageBlock[],
  context: {
    latest: Post[];
    trending: Post[];
    sticky: Post[];
    breaking: BreakingNews[];
    categories: HomeQueryData["categories"]["nodes"];
    liveStreams: NonNullable<NonNullable<HomeQueryData["liveStreams"]>["nodes"]>;
    videos: NonNullable<NonNullable<HomeQueryData["videos"]>["nodes"]>;
    photoStories: NonNullable<NonNullable<HomeQueryData["photoStories"]>["nodes"]>;
    webStories: NonNullable<NonNullable<HomeQueryData["stories"]>["nodes"]>;
    adsByPlacement: Map<string, import("@/types").Ad>;
  },
): HomepageBlock[] {
  const mapped = rawBlocks
    .filter((block) => block.isEnabled !== false)
    .sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0))
    .map((block, index): HomepageBlock => {
      const type = (block.blockType || "latest").replace(/_/g, "-");
      const config = parseConfig(block.config);
      const title = block.titleOverride || block.title || undefined;
      const limit = block.postLimit || 6;
      const layoutWidth = parseLayoutWidth(config, type);
      const cardLayout = parseCardLayout(config);
      const base = {
        id: block.id,
        title,
        order: block.menuOrder ?? index,
        isVisible: true,
        viewAllHref: null as string | null,
        layoutWidth,
        cardLayout,
      };

      switch (type) {
        case "hero":
          return {
            ...base,
            type: "hero",
            featured: context.sticky[0] ?? context.latest[0],
            secondary: context.latest.slice(1, 4),
          };
        case "breaking":
          return {
            ...base,
            type: "breaking",
            items: context.breaking,
          };
        case "trending":
        case "most-read":
          return {
            ...base,
            type: "most-read",
            stories: context.trending.slice(0, limit),
            period: "24h",
          };
        case "editors-pick":
        case "editors_pick":
          return {
            ...base,
            type: "editors-picks",
            stories: context.sticky.slice(0, limit).length
              ? context.sticky.slice(0, limit)
              : context.latest.slice(0, limit),
          };
        case "category": {
          const category =
            context.categories.find(
              (cat) => cat.databaseId === block.categoryId,
            ) ?? context.categories[0];
          return {
            ...base,
            type: "section-rail",
            category: category
              ? {
                  id: category.id,
                  name: category.name,
                  slug: category.slug,
                  uri: category.uri,
                }
              : null,
            stories: category?.posts?.nodes?.slice(0, limit) ?? [],
            layout: "horizontal",
            viewAllHref: category?.uri ?? null,
          };
        }
        case "latest":
        case "top-stories":
          return {
            ...base,
            type: "top-stories",
            stories: context.latest.slice(0, limit),
            layout: "magazine",
          };
        case "opinion":
          return {
            ...base,
            type: "opinion",
            stories: context.latest.slice(0, limit),
          };
        case "videos":
        case "video":
          return {
            ...base,
            type: "video",
            videos: context.videos.slice(0, limit).map((video) => ({
              id: video.id,
              title: video.title || "Video",
              href: video.uri || `/videos/${video.slug}`,
              thumbnailUrl: video.featuredImage?.node?.sourceUrl ?? null,
              duration: video.videoDuration
                ? `${Math.round(video.videoDuration / 60)}m`
                : null,
            })),
            stream: null,
          };
        case "live-tv":
        case "live": {
          const streamId =
            typeof config.liveStreamId === "number"
              ? config.liveStreamId
              : Number(config.liveStreamId || 0);
          const fromCpt =
            (streamId > 0
              ? context.liveStreams.find((s) => s.databaseId === streamId)
              : null) ??
            context.liveStreams.find((s) => s.showOnHomepage) ??
            context.liveStreams[0] ??
            null;
          const status = (fromCpt?.streamStatus || "").toLowerCase();
          return {
            ...base,
            type: "live",
            stream: {
              id: fromCpt?.id ?? `live-${block.id}`,
              databaseId: fromCpt?.databaseId ?? block.databaseId,
              title: fromCpt?.title || title || "Live TV",
              description: fromCpt?.excerpt
                ? String(fromCpt.excerpt).replace(/<[^>]+>/g, "")
                : null,
              isLive: status === "live" || !status,
              embedUrl:
                (typeof config.embedUrl === "string" ? config.embedUrl : null) ||
                fromCpt?.embedUrl ||
                null,
              streamUrl:
                (typeof config.streamUrl === "string" ? config.streamUrl : null) ||
                fromCpt?.streamUrl ||
                fromCpt?.embedUrl ||
                null,
              provider: "youtube",
            },
          };
        }
        case "photos":
        case "photo-gallery":
          return {
            ...base,
            type: "photo-gallery",
            albums: context.photoStories.slice(0, limit).map((album) => ({
              id: album.id,
              title: album.title || "Photos",
              href: album.uri || `/photos/${album.slug}`,
              coverUrl:
                album.photoCoverUrl ||
                album.featuredImage?.node?.sourceUrl ||
                null,
              photoCount: album.photoCount ?? null,
            })),
            viewAllHref: "/photos",
          };
        case "stories":
          return {
            ...base,
            type: "custom",
            title: title || "Web Stories",
            viewAllHref: "/stories",
            payload: {
              blockType: "stories",
              postLimit: limit,
              stories: context.webStories.slice(0, limit).map((story) => ({
                id: story.id,
                title: story.title,
                href: story.uri || `/stories/${story.slug}`,
                coverUrl: story.coverImageUrl,
              })),
              ...config,
            },
          };
        case "newsletter":
          return {
            ...base,
            type: "newsletter",
            heading: title || "Newsletter",
            description:
              typeof config.description === "string" ? config.description : null,
            ctaLabel:
              typeof config.ctaLabel === "string" ? config.ctaLabel : "Subscribe",
          };
        case "ad": {
          const placementKey =
            typeof config.adPlacement === "string" && config.adPlacement
              ? config.adPlacement
              : "homepage";
          const ad = context.adsByPlacement.get(placementKey) ?? null;
          const adWidth =
            typeof config.adWidth === "number"
              ? config.adWidth
              : Number(config.adWidth) || 0;
          const adHeight =
            typeof config.adHeight === "number"
              ? config.adHeight
              : Number(config.adHeight) || 0;
          const adWidthMobile =
            typeof config.adWidthMobile === "number"
              ? config.adWidthMobile
              : Number(config.adWidthMobile) || 0;
          const adHeightMobile =
            typeof config.adHeightMobile === "number"
              ? config.adHeightMobile
              : Number(config.adHeightMobile) || 0;
          return {
            ...base,
            type: "ad",
            placement: {
              id: `hp-ad-${block.id}`,
              position: placementKey,
              ads: ad ? [ad] : [],
            },
            ad,
            slotWidth: adWidth > 0 ? adWidth : null,
            slotHeight: adHeight > 0 ? adHeight : null,
            slotWidthMobile: adWidthMobile > 0 ? adWidthMobile : null,
            slotHeightMobile: adHeightMobile > 0 ? adHeightMobile : null,
          };
        }
        default:
          return {
            ...base,
            type: "custom",
            payload: {
              ...config,
              categoryId: block.categoryId,
              postLimit: limit,
              blockType: block.blockType,
            },
          };
      }
    })
    .filter((block) => {
      if (block.type === "hero") {
        return Boolean((block as Extract<HomepageBlock, { type: "hero" }>).featured);
      }
      return true;
    });

  // Place Live TV beside Latest for a natural 2-column news row.
  const liveIdx = mapped.findIndex((b) => b.type === "live");
  const latestIdx = mapped.findIndex((b) => b.type === "top-stories");
  if (liveIdx >= 0 && latestIdx >= 0 && Math.abs(liveIdx - latestIdx) > 1) {
    const [liveBlock] = mapped.splice(liveIdx, 1);
    const insertAt = mapped.findIndex((b) => b.type === "top-stories");
    if (insertAt >= 0 && liveBlock) {
      mapped.splice(insertAt + 1, 0, liveBlock);
    }
  }

  return mapped;
}

/**
 * When editors have not created Homepage Blocks yet, still render a
 * production-ready homepage from live posts / categories.
 */
function buildDefaultBlocks(context: {
  latest: Post[];
  trending: Post[];
  sticky: Post[];
  categories: HomeQueryData["categories"]["nodes"];
}): HomepageBlock[] {
  const blocks: HomepageBlock[] = [];
  const featured = context.sticky[0] ?? context.latest[0];

  if (featured) {
    blocks.push({
      id: "default-hero",
      type: "hero",
      title: "Top Stories",
      order: 0,
      isVisible: true,
      featured,
      secondary: context.latest.filter((p) => p.id !== featured.id).slice(0, 3),
    });
  }

  if (context.latest.length) {
    blocks.push({
      id: "default-latest",
      type: "top-stories",
      title: "Latest News",
      order: 1,
      isVisible: true,
      stories: context.latest.slice(0, 9),
      layout: "magazine",
      viewAllHref: null,
    });
  }

  if (context.trending.length) {
    blocks.push({
      id: "default-trending",
      type: "most-read",
      title: "Trending",
      order: 2,
      isVisible: true,
      stories: context.trending.slice(0, 6),
      period: "24h",
    });
  }

  context.categories.slice(0, 4).forEach((category, index) => {
    const stories = category.posts?.nodes ?? [];
    if (!stories.length) return;
    blocks.push({
      id: `default-cat-${category.slug}`,
      type: "section-rail",
      title: category.name,
      order: 10 + index,
      isVisible: true,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        uri: category.uri,
      },
      stories: stories.slice(0, 6),
      layout: "horizontal",
      viewAllHref: category.uri ?? `/category/${category.slug}`,
    });
  });

  blocks.push({
    id: "default-newsletter",
    type: "newsletter",
    title: "Newsletter",
    order: 99,
    isVisible: true,
    heading: "Stay informed",
    description: "Get the day’s top stories in your inbox.",
    ctaLabel: "Subscribe",
  });

  return blocks;
}

/**
 * Assembles the homepage payload used by the Next.js app router page.
 */
export async function getHomepagePayload(
  options?: GraphQLFetchOptions,
): Promise<HomepagePayload> {
  const home = await fetchQuery<HomeQueryData>(
    GET_HOME_DATA,
    { latestFirst: 16, trendingFirst: 10, categoriesFirst: 8 },
    {
      revalidate: 60,
      tags: ["home", "homepage-blocks", "posts", "breaking"],
      ...options,
    },
  );

  let mobileNavTabs: MobileNavItem[] = [];
  try {
    const navigation = await fetchQuery<{
      mobileNav: RawMobileNav;
    }>(
      GET_NAVIGATION,
      {},
      {
        revalidate: 300,
        tags: ["navigation", "mobile-nav"],
        ...options,
      },
    );
    mobileNavTabs = mapMobileNav(navigation.mobileNav).tabs;
  } catch {
    // Menus / nav must never blank the homepage.
    mobileNavTabs = [];
  }

  const breaking = mapBreaking(home.breakingNewsActive ?? []);
  const latest = home.latestPosts?.nodes ?? [];

  const rawBlocks = home.homepageBlocks?.nodes ?? [];
  const adPlacements = new Set<string>(["homepage"]);
  for (const block of rawBlocks) {
    if ((block.blockType || "").replace(/_/g, "-") !== "ad") continue;
    const cfg = parseConfig(block.config);
    if (typeof cfg.adPlacement === "string" && cfg.adPlacement) {
      adPlacements.add(cfg.adPlacement);
    }
  }

  const adsByPlacement = new Map<string, import("@/types").Ad>();
  await Promise.all(
    [...adPlacements].map(async (placement) => {
      try {
        const ads = await getActiveAds({ placement }, options);
        if (ads[0]) adsByPlacement.set(placement, ads[0]);
      } catch {
        // ignore
      }
    }),
  );

  const context = {
    latest,
    trending: home.trendingPosts?.nodes ?? [],
    // WPGraphQL where.onlySticky is not available on all versions — prefer isSticky client-side.
    sticky: latest.filter((post) => Boolean(post.isSticky)),
    breaking,
    categories: home.categories?.nodes ?? [],
    liveStreams: home.liveStreams?.nodes ?? [],
    videos: home.videos?.nodes ?? [],
    photoStories: home.photoStories?.nodes ?? [],
    webStories: home.stories?.nodes ?? [],
    adsByPlacement,
  };

  const mapped = mapHomepageBlocks(rawBlocks, context);
  const blocks =
    mapped.length > 0 ? mapped : buildDefaultBlocks(context);

  return {
    blocks,
    breaking,
    mobileNav: mobileNavTabs,
    updatedAt: new Date().toISOString(),
  };
}

export async function getHomepageChrome(options?: GraphQLFetchOptions) {
  const settled = await Promise.allSettled([
    fetchQuery<{
      siteSettings: Record<string, unknown> | null;
      scripts: Record<string, unknown> | null;
      generalSettings: Record<string, unknown> | null;
    }>(GET_SITE_SETTINGS, {}, {
      revalidate: 300,
      tags: ["settings", "scripts"],
      ...options,
    }),
    fetchQuery<{
      siteMenus?: {
        desktop?: RawEnmMenuItem[] | null;
        top?: RawEnmMenuItem[] | null;
        company?: RawEnmMenuItem[] | null;
        explore?: RawEnmMenuItem[] | null;
        policies?: RawEnmMenuItem[] | null;
        trending?: RawEnmMenuItem[] | null;
        mobileScroll?: RawEnmMenuItem[] | null;
        amp?: RawEnmMenuItem[] | null;
      } | null;
      footerSettings?: FooterSettings | null;
      mobileNav?: RawMobileNav;
    }>(GET_NAVIGATION, {}, {
      revalidate: 300,
      tags: ["navigation"],
      ...options,
    }),
    getActiveAds({ placement: "header" }, options),
    fetchQuery<{ liveBlogs?: { nodes?: LiveBlog[] } | null }>(
      GET_ACTIVE_LIVE_BLOGS,
      { first: 3 },
      { revalidate: 30, tags: ["live-blogs"], ...options },
    ),
    fetchQuery<{ stories?: { nodes?: unknown[] } | null }>(
      GET_FEATURED_STORIES,
      { first: 8 },
      { revalidate: 60, tags: ["stories"], ...options },
    ),
  ]);

  const settings =
    settled[0].status === "fulfilled" ? settled[0].value : null;
  const navigation =
    settled[1].status === "fulfilled" ? settled[1].value : null;
  const ads = settled[2].status === "fulfilled" ? settled[2].value : [];
  const liveBlogs =
    settled[3].status === "fulfilled" ? settled[3].value : null;
  const stories =
    settled[4].status === "fulfilled" ? settled[4].value : null;

  const menus = navigation?.siteMenus;
  const footerSettings = navigation?.footerSettings ?? null;
  const primary = mapMenuItems(menus?.desktop);
  const utility = mapMenuItems(menus?.top);
  const trending = mapMenuItems(menus?.trending);
  const mobileScroll = mapMenuItems(menus?.mobileScroll);

  const toFooterItems = (items: DesktopNavItem[]) =>
    items.map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      target: item.target,
    }));

  const footer: FooterNavGroup[] = [];
  const companyItems = mapMenuItems(menus?.company);
  const exploreItems = mapMenuItems(menus?.explore);
  const policyItems = mapMenuItems(menus?.policies);

  if (companyItems.length > 0) {
    footer.push({
      id: "company",
      title: footerSettings?.companyTitle?.trim() || "Company",
      items: toFooterItems(companyItems),
    });
  }
  if (exploreItems.length > 0) {
    footer.push({
      id: "explore",
      title: footerSettings?.exploreTitle?.trim() || "Explore",
      items: toFooterItems(exploreItems),
    });
  }
  if (policyItems.length > 0) {
    footer.push({
      id: "policies",
      title: footerSettings?.policiesTitle?.trim() || "Policies",
      items: toFooterItems(policyItems),
    });
  }

  const mappedMobile = mapMobileNav(navigation?.mobileNav ?? null);

  return {
    settings: settings?.siteSettings ?? null,
    scripts: settings?.scripts ?? null,
    generalSettings: settings?.generalSettings ?? null,
    navigation: {
      primary,
      utility,
      trending,
      mobileScroll,
      footer,
      footerSettings,
      mobile: mappedMobile.tabs,
      mobileStyle: mappedMobile.style,
    } satisfies NavigationMenus,
    headerAds: ads,
    activeLiveBlogs: liveBlogs?.liveBlogs?.nodes ?? [],
    featuredStories: stories?.stories?.nodes ?? [],
  };
}
