import type { Ad, Author, Post, RelatedPost, Tag } from "@/types";

export type ArticleSidebarBlockType =
  | "related"
  | "latest"
  | "trending"
  | "most_read"
  | "category"
  | "author_box"
  | "popular_tags"
  | "newsletter"
  | "ad"
  | "custom_html"
  | string;

export interface ArticleSidebarBlockConfig {
  showExcerpts?: boolean;
  showThumbnails?: boolean;
  adPlacement?: string;
  adWidth?: number;
  adHeight?: number;
  description?: string;
  ctaLabel?: string;
  html?: string;
  period?: string;
}

export interface ArticleSidebarBlockRaw {
  id: string;
  databaseId?: number;
  title?: string | null;
  blockType?: string | null;
  config?: string | null;
  isEnabled?: boolean | null;
  categoryId?: number | null;
  postLimit?: number | null;
  titleOverride?: string | null;
  menuOrder?: number | null;
}

export interface ArticleSidebarWidgetBase {
  id: string;
  type: ArticleSidebarBlockType;
  title: string;
  config: ArticleSidebarBlockConfig;
  postLimit: number;
  categoryId: number;
}

export interface ArticleSidebarPostsWidget extends ArticleSidebarWidgetBase {
  type: "related" | "latest" | "trending" | "most_read" | "category";
  posts: Array<Post | RelatedPost>;
}

export interface ArticleSidebarAuthorWidget extends ArticleSidebarWidgetBase {
  type: "author_box";
  author: Pick<
    Author,
    "id" | "name" | "slug" | "uri" | "avatar" | "description"
  > | null;
}

export interface ArticleSidebarTagsWidget extends ArticleSidebarWidgetBase {
  type: "popular_tags";
  tags: Tag[];
}

export interface ArticleSidebarNewsletterWidget extends ArticleSidebarWidgetBase {
  type: "newsletter";
}

export interface ArticleSidebarAdWidget extends ArticleSidebarWidgetBase {
  type: "ad";
  ads: Ad[];
}

export interface ArticleSidebarHtmlWidget extends ArticleSidebarWidgetBase {
  type: "custom_html";
  html: string;
}

export type ArticleSidebarWidget =
  | ArticleSidebarPostsWidget
  | ArticleSidebarAuthorWidget
  | ArticleSidebarTagsWidget
  | ArticleSidebarNewsletterWidget
  | ArticleSidebarAdWidget
  | ArticleSidebarHtmlWidget
  | ArticleSidebarWidgetBase;
