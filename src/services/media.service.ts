import {
  GET_VIDEOS,
  GET_VIDEO_BY_SLUG,
  GET_PHOTO_STORIES,
  GET_PHOTO_STORY_BY_SLUG,
  GET_SHORTS,
  GET_SHORT_BY_SLUG,
  GET_NEWS_SITEMAP_POSTS,
  GET_SITEMAP_IMAGE_POSTS,
} from "@/graphql";
import type { GraphQLFetchOptions } from "@/lib/graphql-fetch";
import type {
  PhotoGalleryItem,
  PhotoStory,
  Post,
  Short,
  Video,
} from "@/types";
import { stripHtml } from "@/lib/utils";
import { fetchQuery } from "./graphql.helpers";

type Connection<T> = {
  nodes: T[];
  pageInfo?: {
    hasNextPage: boolean;
    hasPreviousPage?: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
};

const defaultTags = (extra: string[] = []): GraphQLFetchOptions => ({
  revalidate: 60,
  tags: ["content", ...extra],
});

export async function getVideos(
  variables?: { first?: number; after?: string },
  options?: GraphQLFetchOptions,
): Promise<Connection<Video>> {
  try {
    const data = await fetchQuery<{ videos: Connection<Video> }>(
      GET_VIDEOS,
      {
        first: variables?.first ?? 12,
        after: variables?.after,
      },
      { ...defaultTags(["videos"]), ...options },
    );
    return data.videos ?? { nodes: [] };
  } catch {
    return { nodes: [] };
  }
}

export async function getVideoBySlug(
  slug: string,
  options?: GraphQLFetchOptions,
): Promise<Video | null> {
  try {
    const data = await fetchQuery<{ video: Video | null }>(
      GET_VIDEO_BY_SLUG,
      { slug },
      { ...defaultTags(["videos", `video:${slug}`]), ...options },
    );
    return data.video ?? null;
  } catch {
    return null;
  }
}

export async function getPhotoStories(
  variables?: { first?: number; after?: string },
  options?: GraphQLFetchOptions,
): Promise<Connection<PhotoStory>> {
  try {
    const data = await fetchQuery<{ photoStories: Connection<PhotoStory> }>(
      GET_PHOTO_STORIES,
      {
        first: variables?.first ?? 12,
        after: variables?.after,
      },
      { ...defaultTags(["photos"]), ...options },
    );
    return data.photoStories ?? { nodes: [] };
  } catch {
    return { nodes: [] };
  }
}

export async function getPhotoStoryBySlug(
  slug: string,
  options?: GraphQLFetchOptions,
): Promise<PhotoStory | null> {
  try {
    const data = await fetchQuery<{ photoStory: PhotoStory | null }>(
      GET_PHOTO_STORY_BY_SLUG,
      { slug },
      { ...defaultTags(["photos", `photo:${slug}`]), ...options },
    );
    return data.photoStory ?? null;
  } catch {
    return null;
  }
}

export async function getShorts(
  variables?: { first?: number; after?: string },
  options?: GraphQLFetchOptions,
): Promise<Connection<Short>> {
  try {
    const data = await fetchQuery<{ shorts: Connection<Short> }>(
      GET_SHORTS,
      {
        first: variables?.first ?? 24,
        after: variables?.after,
      },
      { ...defaultTags(["shorts"]), ...options },
    );
    return data.shorts ?? { nodes: [] };
  } catch {
    return { nodes: [] };
  }
}

export async function getShortBySlug(
  slug: string,
  options?: GraphQLFetchOptions,
): Promise<Short | null> {
  try {
    const data = await fetchQuery<{ short: Short | null }>(
      GET_SHORT_BY_SLUG,
      { slug },
      { ...defaultTags(["shorts", `short:${slug}`]), ...options },
    );
    return data.short ?? null;
  } catch {
    return null;
  }
}

/** Parse photo gallery JSON from WP meta. */
export function parsePhotoGallery(
  raw?: string | null,
): PhotoGalleryItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const items: PhotoGalleryItem[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const url =
        typeof o.url === "string"
          ? o.url
          : typeof o.sourceUrl === "string"
            ? o.sourceUrl
            : null;
      if (!url) continue;
      items.push({
        id:
          typeof o.id === "number" || typeof o.id === "string"
            ? o.id
            : null,
        url,
        heading:
          typeof o.heading === "string"
            ? o.heading
            : typeof o.title === "string"
              ? o.title
              : typeof o.caption === "string"
                ? o.caption
                : null,
        description:
          typeof o.description === "string" ? o.description : null,
        caption: typeof o.caption === "string" ? o.caption : null,
        width: typeof o.width === "number" ? o.width : null,
        height: typeof o.height === "number" ? o.height : null,
        alt: typeof o.alt === "string" ? o.alt : null,
      });
    }
    return items;
  } catch {
    return [];
  }
}

function hoursAgoParts(hours: number): {
  year: number;
  month: number;
  day: number;
  hour: number;
  cutoff: Date;
} {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return {
    year: cutoff.getUTCFullYear(),
    month: cutoff.getUTCMonth() + 1,
    day: cutoff.getUTCDate(),
    hour: cutoff.getUTCHours(),
    cutoff,
  };
}

export type NewsSitemapPost = Pick<
  Post,
  | "id"
  | "databaseId"
  | "title"
  | "slug"
  | "uri"
  | "date"
  | "dateGmt"
  | "modified"
  | "modifiedGmt"
  | "excerpt"
  | "featuredImage"
  | "categories"
  | "tags"
>;

/** Posts from the last N hours for Google News sitemaps. */
export async function getNewsSitemapPosts(
  hours = 48,
  options?: GraphQLFetchOptions,
): Promise<NewsSitemapPost[]> {
  const { year, month, day, hour, cutoff } = hoursAgoParts(hours);
  try {
    const data = await fetchQuery<{
      posts: Connection<NewsSitemapPost>;
    }>(
      GET_NEWS_SITEMAP_POSTS,
      { first: 100, year, month, day, hour },
      { revalidate: 900, tags: ["sitemap", "news", "posts"], ...options },
    );
    const nodes = data.posts?.nodes ?? [];
    return nodes.filter((p) => {
      const d = p.dateGmt || p.date;
      if (!d) return true;
      return new Date(d).getTime() >= cutoff.getTime();
    });
  } catch {
    return [];
  }
}

/** Posts with featured images for image / Discover sitemaps. */
export async function getSitemapImagePosts(
  variables?: { first?: number; after?: string },
  options?: GraphQLFetchOptions,
): Promise<Connection<NewsSitemapPost>> {
  try {
    const data = await fetchQuery<{ posts: Connection<NewsSitemapPost> }>(
      GET_SITEMAP_IMAGE_POSTS,
      { first: variables?.first ?? 100, after: variables?.after },
      { revalidate: 3600, tags: ["sitemap", "images", "posts"], ...options },
    );
    return data.posts ?? { nodes: [] };
  } catch {
    return { nodes: [] };
  }
}

export interface FeaturedImageSitemapData {
  pageUrl: string;
  lastmod?: string | null;
  imageUrl: string;
  title: string;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
}

/** Extract image sitemap rows from posts that have featured images. */
export function featuredImagesFromPosts(
  posts: Array<{
    title: string;
    slug: string;
    uri?: string | null;
    modified?: string | null;
    modifiedGmt?: string | null;
    featuredImage?: { node?: { sourceUrl?: string | null; caption?: string | null; altText?: string | null; mediaDetails?: { width?: number | null; height?: number | null } | null } | null } | null;
  }>,
  pathPrefix = "/article",
): FeaturedImageSitemapData[] {
  const rows: FeaturedImageSitemapData[] = [];
  for (const post of posts) {
    const img = post.featuredImage?.node;
    if (!img?.sourceUrl) continue;
    rows.push({
      pageUrl: post.uri || `${pathPrefix}/${post.slug}`,
      lastmod: post.modifiedGmt || post.modified,
      imageUrl: img.sourceUrl,
      title: post.title,
      caption: img.caption ? stripHtml(img.caption) : img.altText,
      width: img.mediaDetails?.width,
      height: img.mediaDetails?.height,
    });
  }
  return rows;
}

export interface VideoSitemapData {
  pageUrl: string;
  lastmod?: string | null;
  thumbnailUrl: string;
  title: string;
  description: string;
  contentUrl?: string | null;
  playerUrl?: string | null;
  duration?: number | null;
  publicationDate?: string | null;
}

/** Build video sitemap rows from Video CPT nodes. */
export function videoSitemapFromVideos(
  videos: Video[],
): VideoSitemapData[] {
  return videos
    .filter((v) => v.slug && (v.videoUrl || v.videoEmbed))
    .map((v) => ({
      pageUrl: v.uri || `/videos/${v.slug}`,
      lastmod: v.modified || v.date,
      thumbnailUrl:
        v.featuredImage?.node?.sourceUrl || "",
      title: v.title,
      description: stripHtml(v.excerpt || v.title).slice(0, 2048),
      contentUrl: v.videoUrl,
      playerUrl: v.videoEmbed || null,
      duration: v.videoDuration,
      publicationDate: v.date,
    }))
    .filter((row) => row.thumbnailUrl);
}

/** Large images suitable for Google Discover (≥1200px wide preferred). */
export function discoverImagesFromPosts(
  posts: NewsSitemapPost[],
  minWidth = 1200,
): FeaturedImageSitemapData[] {
  return featuredImagesFromPosts(posts).filter(
    (row) => !row.width || row.width >= minWidth,
  );
}
