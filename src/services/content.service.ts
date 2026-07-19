import {
  GET_HOME_DATA,
  GET_POST_BY_SLUG,
  GET_POST_BY_URI,
  GET_POST_BY_NAME,
  GET_NODE_BY_URI,
  GET_POSTS,
  GET_RELATED_POSTS,
  GET_CATEGORY_BY_SLUG,
  GET_TAG_BY_SLUG,
  GET_AUTHOR_BY_SLUG,
  GET_SEARCH_RESULTS,
  GET_STORY_BY_SLUG,
  GET_STORIES,
  GET_LIVE_BLOG_BY_SLUG,
  GET_LIVE_BLOGS,
  GET_POLL_BY_SLUG,
  GET_POLL_BY_ID,
  GET_PAGE_BY_SLUG,
  GET_SITEMAP_POSTS,
  GET_SITEMAP_PAGES,
  GET_SITEMAP_CATEGORIES,
  GET_SITEMAP_STORIES,
} from "@/graphql";
import type { GraphQLFetchOptions } from "@/lib/graphql-fetch";
import type {
  Author,
  Category,
  LiveBlog,
  LiveUpdate,
  Page,
  Poll,
  PollOption,
  Post,
  Tag,
} from "@/types";
import { safeDecodeSlug, slugLookupCandidates } from "@/utils/slug";
import { fetchQuery } from "./graphql.helpers";

/** Web Story CPT as returned by WPGraphQL / ENM. */
export interface GraphQLStory {
  id: string;
  databaseId: number;
  title?: string | null;
  slug?: string | null;
  uri?: string | null;
  excerpt?: string | null;
  content?: string | null;
  date?: string | null;
  modified?: string | null;
  coverImageUrl?: string | null;
  pages?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  canonicalUrl?: string | null;
  isFeatured?: boolean | null;
  durationSeconds?: number | null;
  author?: {
    node?: {
      name?: string | null;
      slug?: string | null;
      uri?: string | null;
    } | null;
  } | null;
  relatedStories?: Array<{
    id: string;
    databaseId: number;
    title?: string | null;
    slug?: string | null;
    uri?: string | null;
    coverImageUrl?: string | null;
    excerpt?: string | null;
  }> | null;
}

type Connection<T> = {
  nodes: T[];
  pageInfo?: {
    hasNextPage: boolean;
    hasPreviousPage?: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
};

export interface HomeDataResult {
  homepageBlocks: Array<{
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
  }>;
  breakingNewsActive: Array<{
    id: string;
    databaseId: number;
    title?: string | null;
    tickerText?: string | null;
    linkUrl?: string | null;
    priority?: number | null;
    bgColor?: string | null;
    textColor?: string | null;
    schedule?: string | null;
    expiry?: string | null;
    isActive?: boolean | null;
  }>;
  latestPosts: Connection<Post>;
  trendingPosts: Connection<Post>;
  stickyPosts: Connection<Post>;
  categories: Connection<
    Category & {
      posts?: Connection<Post> | null;
    }
  >;
}

export interface PostsListResult {
  posts: Connection<Post>;
}

export interface SearchResultsResult {
  posts: Connection<Post>;
}

const defaultTags = (extra: string[] = []): GraphQLFetchOptions => ({
  revalidate: 60,
  tags: ["content", ...extra],
});

export async function getHomeData(
  variables?: {
    latestFirst?: number;
    trendingFirst?: number;
    categoriesFirst?: number;
  },
  options?: GraphQLFetchOptions,
): Promise<HomeDataResult> {
  return fetchQuery<HomeDataResult>(
    GET_HOME_DATA,
    {
      latestFirst: variables?.latestFirst ?? 12,
      trendingFirst: variables?.trendingFirst ?? 10,
      categoriesFirst: variables?.categoriesFirst ?? 8,
    },
    {
      ...defaultTags(["home", "posts", "breaking"]),
      ...options,
    },
  );
}

export async function getPostBySlug(
  slug: string,
  options?: GraphQLFetchOptions,
): Promise<Post | null> {
  const decoded = safeDecodeSlug(slug);
  const opts: GraphQLFetchOptions = {
    ...defaultTags(["posts", `post:${decoded}`]),
    ...options,
    throwOnError: false,
  };

  let lastError: unknown = null;
  let reachedCms = false;

  async function attempt<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      const result = await fn();
      reachedCms = true;
      return result;
    } catch (error) {
      lastError = error;
      return null;
    }
  }

  // 1) Direct SLUG lookup with NFC-decoded slug (primary)
  const bySlug = await attempt(() =>
    fetchQuery<{ post: Post | null }>(
      GET_POST_BY_SLUG,
      { slug: decoded },
      opts,
    ),
  );
  if (bySlug?.post) return bySlug.post;

  // 2) posts(where: { name }) — most reliable for Unicode post_name
  const byName = await attempt(() =>
    fetchQuery<{ posts: { nodes: Post[] } }>(
      GET_POST_BY_NAME,
      { name: decoded },
      opts,
    ),
  );
  if (byName?.posts?.nodes?.[0]) return byName.posts.nodes[0];

  // 3) URI / nodeByUri candidates (WP permalinks + /article/ paths)
  for (const candidate of slugLookupCandidates(slug)) {
    const byUri = await attempt(() =>
      fetchQuery<{ post: Post | null }>(
        GET_POST_BY_URI,
        { uri: candidate },
        opts,
      ),
    );
    if (byUri?.post) return byUri.post;

    const byNode = await attempt(() =>
      fetchQuery<{
        nodeByUri:
          | (Post & { __typename?: string })
          | Record<string, unknown>
          | null;
      }>(GET_NODE_BY_URI, { uri: candidate }, opts),
    );
    const node = byNode?.nodeByUri;
    if (!node) continue;
    if (
      (node as { __typename?: string }).__typename === "Post" ||
      typeof (node as Post).databaseId === "number"
    ) {
      return node as Post;
    }
  }

  // CMS unreachable → surface as error (500/retry) instead of a fake 404.
  if (!reachedCms && lastError) {
    throw lastError;
  }

  return null;
}

export async function getPosts(
  variables?: {
    first?: number;
    after?: string;
    categorySlug?: string;
    tagSlug?: string;
    authorName?: string;
    search?: string;
  },
  options?: GraphQLFetchOptions,
): Promise<Connection<Post>> {
  const data = await fetchQuery<PostsListResult>(
    GET_POSTS,
    {
      first: variables?.first ?? 10,
      after: variables?.after,
      categorySlug: variables?.categorySlug,
      tagSlug: variables?.tagSlug,
      authorName: variables?.authorName,
      search: variables?.search,
    },
    {
      ...defaultTags(["posts"]),
      ...options,
    },
  );
  return data.posts;
}

/**
 * Top trending stories for empty search / 404 (falls back to latest until views exist).
 */
export async function getTrendingPosts(
  first = 10,
  options?: GraphQLFetchOptions,
): Promise<Post[]> {
  try {
    const home = await getHomeData(
      { trendingFirst: first, latestFirst: 1, categoriesFirst: 1 },
      {
        revalidate: 60,
        tags: ["home", "posts", "trending"],
        ...options,
      },
    );
    const nodes = home.trendingPosts?.nodes ?? [];
    if (nodes.length > 0) return nodes.slice(0, first);
  } catch {
    // fall through to latest posts
  }
  try {
    const latest = await getPosts({ first }, {
      revalidate: 60,
      tags: ["posts", "trending"],
      ...options,
    });
    return latest.nodes ?? [];
  } catch {
    return [];
  }
}

export async function getRelatedPosts(
  postId: number,
  limit = 6,
  options?: GraphQLFetchOptions,
): Promise<Post[]> {
  const data = await fetchQuery<{ relatedPosts: Post[] }>(
    GET_RELATED_POSTS,
    { postId, limit },
    {
      ...defaultTags(["posts", `related:${postId}`]),
      ...options,
    },
  );
  return data.relatedPosts ?? [];
}

export async function getCategoryBySlug(
  slug: string,
  variables?: { first?: number; after?: string },
  options?: GraphQLFetchOptions,
): Promise<(Category & { posts?: Connection<Post> | null }) | null> {
  const data = await fetchQuery<{
    category: (Category & { posts?: Connection<Post> | null }) | null;
  }>(
    GET_CATEGORY_BY_SLUG,
    {
      slug,
      first: variables?.first ?? 12,
      after: variables?.after,
    },
    {
      ...defaultTags(["categories", `category:${slug}`]),
      ...options,
    },
  );
  return data.category ?? null;
}

export async function getTagBySlug(
  slug: string,
  variables?: { first?: number; after?: string },
  options?: GraphQLFetchOptions,
): Promise<(Tag & { posts?: Connection<Post> | null }) | null> {
  const data = await fetchQuery<{
    tag: (Tag & { posts?: Connection<Post> | null }) | null;
  }>(
    GET_TAG_BY_SLUG,
    {
      slug,
      first: variables?.first ?? 12,
      after: variables?.after,
    },
    {
      ...defaultTags(["tags", `tag:${slug}`]),
      ...options,
    },
  );
  return data.tag ?? null;
}

export async function getAuthorBySlug(
  slug: string,
  variables?: { first?: number; after?: string },
  options?: GraphQLFetchOptions,
): Promise<(Author & { posts?: Connection<Post> | null }) | null> {
  const data = await fetchQuery<{
    user: (Author & { posts?: Connection<Post> | null }) | null;
  }>(
    GET_AUTHOR_BY_SLUG,
    {
      slug,
      first: variables?.first ?? 12,
      after: variables?.after,
    },
    {
      ...defaultTags(["authors", `author:${slug}`]),
      ...options,
    },
  );
  return data.user ?? null;
}

export async function getSearchResults(
  search: string,
  variables?: { first?: number; after?: string },
  options?: GraphQLFetchOptions,
): Promise<Connection<Post>> {
  const data = await fetchQuery<SearchResultsResult>(
    GET_SEARCH_RESULTS,
    {
      search,
      first: variables?.first ?? 12,
      after: variables?.after,
    },
    {
      revalidate: 30,
      tags: ["search", "posts"],
      ...options,
    },
  );
  return data.posts;
}

export async function getStoryBySlug(
  slug: string,
  options?: GraphQLFetchOptions,
): Promise<GraphQLStory | null> {
  const data = await fetchQuery<{ story: GraphQLStory | null }>(
    GET_STORY_BY_SLUG,
    { slug },
    {
      ...defaultTags(["stories", `story:${slug}`]),
      ...options,
    },
  );
  return data.story ?? null;
}

export async function getStories(
  variables?: { first?: number; after?: string },
  options?: GraphQLFetchOptions,
): Promise<Connection<GraphQLStory>> {
  const data = await fetchQuery<{ stories: Connection<GraphQLStory> }>(
    GET_STORIES,
    {
      first: variables?.first ?? 12,
      after: variables?.after,
    },
    {
      ...defaultTags(["stories"]),
      ...options,
    },
  );
  return data.stories;
}

export async function getLiveBlogBySlug(
  slug: string,
  options?: GraphQLFetchOptions,
): Promise<LiveBlog | null> {
  const data = await fetchQuery<{ liveBlog: RawLiveBlog | null }>(
    GET_LIVE_BLOG_BY_SLUG,
    { slug },
    {
      revalidate: 15,
      tags: ["live-blogs", `live-blog:${slug}`],
      ...options,
    },
  );
  return data.liveBlog ? mapLiveBlog(data.liveBlog) : null;
}

export async function getLiveBlogs(
  variables?: { first?: number; after?: string },
  options?: GraphQLFetchOptions,
): Promise<Connection<LiveBlog>> {
  const data = await fetchQuery<{
    liveBlogs: Connection<RawLiveBlog>;
  }>(
    GET_LIVE_BLOGS,
    {
      first: variables?.first ?? 10,
      after: variables?.after,
    },
    {
      revalidate: 30,
      tags: ["live-blogs"],
      ...options,
    },
  );
  return {
    ...data.liveBlogs,
    nodes: (data.liveBlogs?.nodes ?? []).map(mapLiveBlog),
  };
}

/** GraphQL LiveBlog shape before UI mapping. */
interface RawLiveUpdate {
  id: string;
  databaseId?: number;
  title?: string | null;
  content?: string | null;
  date?: string | null;
  modified?: string | null;
  displayTimestamp?: string | null;
  isPinned?: boolean | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  author?: { node?: LiveUpdate["author"] } | null;
  featuredImage?: {
    node?: { sourceUrl?: string | null } | null;
  } | null;
}

interface RawLiveBlog {
  id: string;
  databaseId?: number;
  title: string;
  slug: string;
  uri?: string | null;
  excerpt?: string | null;
  content?: string | null;
  date?: string | null;
  modified?: string | null;
  liveStatus?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  featuredImage?: LiveBlog["featuredImage"];
  author?: LiveBlog["author"];
  updates?: RawLiveUpdate[] | null;
  seo?: LiveBlog["seo"];
}

function mapLiveBlog(raw: RawLiveBlog): LiveBlog {
  const status = (raw.liveStatus || "live").toLowerCase();
  const isLive = status === "live" || status === "active";
  const updates = (raw.updates ?? []).map((u) => {
    const mediaUrl =
      u.mediaUrl?.trim() ||
      u.featuredImage?.node?.sourceUrl?.trim() ||
      "";
    const mediaType = (u.mediaType || "image").toLowerCase();
    const embedType =
      mediaType === "video"
        ? ("video" as const)
        : mediaType === "embed"
          ? ("html" as const)
          : ("image" as const);

    return {
      id: u.id,
      databaseId: u.databaseId,
      title: u.title,
      content: u.content || "",
      publishedAt:
        u.displayTimestamp ||
        u.date ||
        u.modified ||
        raw.startedAt ||
        raw.date ||
        new Date().toISOString(),
      isPinned: Boolean(u.isPinned),
      author: u.author?.node ?? null,
      embeds: mediaUrl
        ? [{ type: embedType, url: mediaUrl }]
        : null,
    };
  });

  // Newest first for liveBlogUpdate / UI.
  updates.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return {
    id: raw.id,
    databaseId: raw.databaseId,
    title: raw.title,
    slug: raw.slug,
    uri: raw.uri,
    summary: raw.excerpt,
    content: raw.content,
    isLive,
    startedAt: raw.startedAt || raw.date,
    endedAt: raw.endedAt,
    coverageEndTime: isLive ? null : raw.endedAt || raw.modified,
    featuredImage: raw.featuredImage,
    author: raw.author,
    updates,
    seo: raw.seo,
  };
}

/** Raw poll CPT from GraphQL before mapping to UI Poll. */
interface GraphQLPoll {
  id: string;
  databaseId: number;
  title?: string | null;
  slug?: string | null;
  uri?: string | null;
  content?: string | null;
  choices?: string | null;
  results?: string | null;
  totalVotes?: number | null;
  expiry?: string | null;
  allowMultiple?: boolean | null;
  isClosed?: boolean | null;
}

function mapPoll(raw: GraphQLPoll): Poll {
  let options: PollOption[] = [];
  try {
    const choices = raw.choices ? (JSON.parse(raw.choices) as unknown) : [];
    const resultsRaw = raw.results ? (JSON.parse(raw.results) as unknown) : {};
    const results =
      resultsRaw && typeof resultsRaw === "object" && !Array.isArray(resultsRaw)
        ? (resultsRaw as Record<string, unknown>)
        : {};

    if (Array.isArray(choices)) {
      options = choices.map((item, index) => {
        let id: string;
        let label: string;
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const row = item as Record<string, unknown>;
          id = String(row.id ?? `opt-${index + 1}`);
          label = String(row.label ?? "");
        } else {
          // Legacy: plain string labels keyed by index in results.
          id = String(index);
          label = String(item);
        }
        const votes = Number(results[id] ?? results[String(index)] ?? 0);
        return { id, label, votes };
      });
    }
  } catch {
    options = [];
  }

  const totalVotes =
    raw.totalVotes ?? options.reduce((sum, opt) => sum + opt.votes, 0);

  return {
    id: raw.id,
    databaseId: raw.databaseId,
    question: raw.title ?? "Poll",
    options: options.map((opt) => ({
      ...opt,
      percentage:
        totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0,
    })),
    totalVotes,
    endsAt: raw.expiry ?? null,
    isClosed: Boolean(raw.isClosed),
    allowMultiple: Boolean(raw.allowMultiple),
  };
}

/** Poll IDs embedded via `[enm_poll]` shortcode markers in post HTML. */
export { extractPollIdsFromHtml } from "@/utils/poll";

export async function getPollBySlug(
  slug: string,
  options?: GraphQLFetchOptions,
): Promise<Poll | null> {
  const data = await fetchQuery<{ poll: GraphQLPoll | null }>(
    GET_POLL_BY_SLUG,
    { slug },
    {
      revalidate: 60,
      tags: ["polls", `poll:${slug}`],
      ...options,
    },
  );
  return data.poll ? mapPoll(data.poll) : null;
}

export async function getPollById(
  id: number | string,
  options?: GraphQLFetchOptions,
): Promise<Poll | null> {
  const data = await fetchQuery<{ poll: GraphQLPoll | null }>(
    GET_POLL_BY_ID,
    { id: String(id) },
    {
      revalidate: 60,
      tags: ["polls", `poll:id:${id}`],
      ...options,
    },
  );
  return data.poll ? mapPoll(data.poll) : null;
}

export async function getPageBySlug(
  slug: string,
  options?: GraphQLFetchOptions,
): Promise<Page | null> {
  const uri = slug.startsWith("/") ? slug : `/${slug}`;
  const data = await fetchQuery<{ page: Page | null }>(
    GET_PAGE_BY_SLUG,
    { slug: uri },
    {
      revalidate: 300,
      tags: ["pages", `page:${slug}`],
      ...options,
    },
  );
  return data.page ?? null;
}

export interface SitemapNode {
  id: string;
  databaseId: number;
  slug?: string | null;
  uri?: string | null;
  title?: string | null;
  modified?: string | null;
  modifiedGmt?: string | null;
  coverImageUrl?: string | null;
}

export async function getSitemapPosts(
  variables?: { first?: number; after?: string },
  options?: GraphQLFetchOptions,
): Promise<Connection<SitemapNode>> {
  const data = await fetchQuery<{ posts: Connection<SitemapNode> }>(
    GET_SITEMAP_POSTS,
    { first: variables?.first ?? 100, after: variables?.after },
    { revalidate: 3600, tags: ["sitemap", "posts"], ...options },
  );
  return data.posts;
}

export async function getSitemapPages(
  variables?: { first?: number; after?: string },
  options?: GraphQLFetchOptions,
): Promise<Connection<SitemapNode>> {
  const data = await fetchQuery<{ pages: Connection<SitemapNode> }>(
    GET_SITEMAP_PAGES,
    { first: variables?.first ?? 100, after: variables?.after },
    { revalidate: 3600, tags: ["sitemap", "pages"], ...options },
  );
  return data.pages;
}

export async function getSitemapCategories(
  options?: GraphQLFetchOptions,
): Promise<SitemapNode[]> {
  const data = await fetchQuery<{ categories: { nodes: SitemapNode[] } }>(
    GET_SITEMAP_CATEGORIES,
    { first: 100 },
    { revalidate: 3600, tags: ["sitemap", "categories"], ...options },
  );
  return data.categories?.nodes ?? [];
}

export async function getSitemapStories(
  variables?: { first?: number; after?: string },
  options?: GraphQLFetchOptions,
): Promise<Connection<SitemapNode>> {
  const data = await fetchQuery<{ stories: Connection<SitemapNode> }>(
    GET_SITEMAP_STORIES,
    { first: variables?.first ?? 100, after: variables?.after },
    { revalidate: 3600, tags: ["sitemap", "stories"], ...options },
  );
  return data.stories;
}
