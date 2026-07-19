/**
 * Shared WordPress GraphQL connection helpers.
 */

export interface WPNode {
  id: string;
  databaseId: number;
}

export interface WPPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
  total?: number | null;
  offsetPagination?: {
    total?: number | null;
    hasMore?: boolean | null;
  } | null;
}

export interface WPConnection<T> {
  nodes: T[];
  edges?: Array<{
    cursor?: string | null;
    node: T;
  }>;
  pageInfo?: WPPageInfo;
}

export interface SEOFields {
  title?: string | null;
  metaDesc?: string | null;
  canonical?: string | null;
  opengraphTitle?: string | null;
  opengraphDescription?: string | null;
  opengraphImage?: {
    sourceUrl?: string | null;
    altText?: string | null;
  } | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: {
    sourceUrl?: string | null;
    altText?: string | null;
  } | null;
  metaRobotsNoindex?: string | null;
  metaRobotsNofollow?: string | null;
  schema?: {
    raw?: string | null;
  } | null;
  readingTime?: number | null;
  focuskw?: string | null;
  breadcrumbs?: Array<{
    text?: string | null;
    url?: string | null;
  }> | null;
}

export type ContentStatus =
  | "PUBLISH"
  | "DRAFT"
  | "PENDING"
  | "PRIVATE"
  | "FUTURE"
  | "TRASH"
  | "AUTO_DRAFT"
  | "INHERIT"
  | string;
