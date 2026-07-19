import { GET_ARTICLE_SIDEBAR_BLOCKS } from "@/graphql/queries/article-sidebar.query";
import type { GraphQLFetchOptions } from "@/lib/graphql-fetch";
import type { Ad, Author, Post, RelatedPost, Tag } from "@/types";
import type {
  ArticleSidebarBlockConfig,
  ArticleSidebarBlockRaw,
  ArticleSidebarWidget,
} from "@/types/article-sidebar";
import { getActiveAds } from "./ads.service";
import {
  getPosts,
  getRelatedPosts,
} from "./content.service";
import { fetchQuery } from "./graphql.helpers";

function parseConfig(raw?: string | null): ArticleSidebarBlockConfig {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ArticleSidebarBlockConfig;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export interface ArticleSidebarContext {
  postId: number;
  related?: Array<RelatedPost | Post>;
  author?: Pick<
    Author,
    "id" | "name" | "slug" | "uri" | "avatar" | "description"
  > | null;
  /** Tags already on the article — used when popular tags query is empty. */
  articleTags?: Tag[];
  categoryId?: number | null;
  categorySlug?: string | null;
  sidebarAds?: Ad[];
}

/**
 * Load enabled article sidebar widget definitions from WordPress.
 */
export async function getArticleSidebarBlocks(
  options?: GraphQLFetchOptions,
): Promise<ArticleSidebarBlockRaw[]> {
  try {
    const data = await fetchQuery<{
      enmArticleSidebarBlocks?: ArticleSidebarBlockRaw[] | null;
      articleSidebarBlocks?: {
        nodes?: ArticleSidebarBlockRaw[] | null;
      } | null;
    }>(
      GET_ARTICLE_SIDEBAR_BLOCKS,
      {},
      {
        revalidate: 120,
        tags: ["article-sidebar", "navigation"],
        ...options,
      },
    );

    const list =
      data.enmArticleSidebarBlocks ??
      data.articleSidebarBlocks?.nodes ??
      [];

    return list
      .filter((b) => b.isEnabled !== false)
      .sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0));
  } catch {
    return [];
  }
}

/**
 * Hydrate sidebar widgets with post lists, ads, author, tags, etc.
 */
export async function mapArticleSidebarWidgets(
  blocks: ArticleSidebarBlockRaw[],
  context: ArticleSidebarContext,
  options?: GraphQLFetchOptions,
): Promise<ArticleSidebarWidget[]> {
  if (!blocks.length) {
    // Fallback: preserve previous ads-only sidebar behaviour.
    if (context.sidebarAds?.length) {
      return [
        {
          id: "fallback-ads",
          type: "ad",
          title: "Advertisement",
          config: { adPlacement: "sidebar" },
          postLimit: 2,
          categoryId: 0,
          ads: context.sidebarAds.slice(0, 2),
        },
      ];
    }
    return [];
  }

  const maxLimit = Math.max(
    5,
    ...blocks.map((b) => Math.min(20, b.postLimit || 5)),
  );

  const [latestConn, trendingConn, popularTags] = await Promise.all([
    getPosts({ first: maxLimit }, options).catch(() => ({ nodes: [] as Post[] })),
    getPosts({ first: maxLimit }, options).catch(() => ({ nodes: [] as Post[] })),
    fetchPopularTags(Math.max(12, maxLimit), options).catch(() => [] as Tag[]),
  ]);

  const latest = latestConn.nodes ?? [];
  const trending = trendingConn.nodes ?? [];

  const widgets: ArticleSidebarWidget[] = [];

  for (const block of blocks) {
    const type = (block.blockType || "latest").replace(/-/g, "_");
    const config = parseConfig(block.config);
    const title =
      block.titleOverride?.trim() ||
      block.title?.trim() ||
      type.replace(/_/g, " ");
    const postLimit = Math.min(20, Math.max(1, block.postLimit || 5));
    const categoryId = block.categoryId || 0;
    const base = {
      id: block.id || `as-${block.databaseId ?? title}`,
      title,
      config,
      postLimit,
      categoryId,
    };

    switch (type) {
      case "related": {
        let posts = (context.related ?? []).slice(0, postLimit);
        if (!posts.length && context.postId) {
          posts = await getRelatedPosts(context.postId, postLimit, options).catch(
            () => [],
          );
        }
        widgets.push({ ...base, type: "related", posts });
        break;
      }
      case "latest":
        widgets.push({
          ...base,
          type: "latest",
          posts: latest
            .filter((p) => p.databaseId !== context.postId)
            .slice(0, postLimit),
        });
        break;
      case "trending":
      case "most_read":
        widgets.push({
          ...base,
          type: type === "most_read" ? "most_read" : "trending",
          posts: trending
            .filter((p) => p.databaseId !== context.postId)
            .slice(0, postLimit),
        });
        break;
      case "category": {
        const catId = categoryId || context.categoryId || 0;
        let posts: Post[] = [];
        const slug =
          catId && catId === context.categoryId
            ? context.categorySlug
            : catId
              ? await resolveCategorySlug(catId, options)
              : context.categorySlug;
        if (slug) {
          const conn = await getPosts(
            { first: postLimit + 2, categorySlug: slug },
            options,
          ).catch(() => ({ nodes: [] as Post[] }));
          posts = (conn.nodes ?? [])
            .filter((p) => p.databaseId !== context.postId)
            .slice(0, postLimit);
        } else {
          posts = latest
            .filter((p) => p.databaseId !== context.postId)
            .slice(0, postLimit);
        }
        widgets.push({ ...base, type: "category", posts });
        break;
      }
      case "author_box":
        widgets.push({
          ...base,
          type: "author_box",
          author: context.author ?? null,
        });
        break;
      case "popular_tags":
        widgets.push({
          ...base,
          type: "popular_tags",
          tags: (popularTags.length ? popularTags : context.articleTags ?? []).slice(
            0,
            postLimit,
          ),
        });
        break;
      case "newsletter":
        widgets.push({ ...base, type: "newsletter" });
        break;
      case "ad": {
        const placement = config.adPlacement || "sidebar";
        let ads =
          placement === "sidebar" && context.sidebarAds?.length
            ? context.sidebarAds
            : await getActiveAds({ placement }, options).catch(() => []);
        widgets.push({
          ...base,
          type: "ad",
          ads: ads.slice(0, Math.max(1, postLimit)),
        });
        break;
      }
      case "custom_html":
        widgets.push({
          ...base,
          type: "custom_html",
          html: config.html || "",
        });
        break;
      default:
        widgets.push({ ...base, type });
    }
  }

  return widgets;
}

async function fetchPopularTags(
  first: number,
  options?: GraphQLFetchOptions,
): Promise<Tag[]> {
  const data = await fetchQuery<{
    tags?: { nodes?: Tag[] | null } | null;
  }>(
    `
    query PopularTags($first: Int!) {
      tags(first: $first, where: { orderby: COUNT, order: DESC }) {
        nodes {
          id
          databaseId
          name
          slug
          uri
          count
        }
      }
    }
    `,
    { first },
    { revalidate: 600, tags: ["tags"], ...options },
  );
  return data.tags?.nodes ?? [];
}

async function resolveCategorySlug(
  categoryId: number,
  options?: GraphQLFetchOptions,
): Promise<string | null> {
  try {
    const data = await fetchQuery<{
      category?: { slug?: string | null } | null;
    }>(
      `
      query CategorySlugById($id: ID!) {
        category(id: $id, idType: DATABASE_ID) {
          slug
        }
      }
      `,
      { id: String(categoryId) },
      { revalidate: 600, tags: ["categories"], ...options },
    );
    return data.category?.slug ?? null;
  } catch {
    return null;
  }
}
