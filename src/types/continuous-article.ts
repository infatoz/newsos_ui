import type { Ad, Poll, Post, RelatedPost } from "@/types";

export type ContinuousQueueItem = {
  id: string;
  databaseId: number;
  slug: string;
  uri?: string | null;
  title: string;
};

/** JSON payload from GET /api/articles/[slug]. */
export type ContinuousArticlePayload = {
  post: Post;
  related: Array<RelatedPost | Post>;
  url: string;
  path: string;
  minutes: number;
  ampUrl: string | null;
  polls: Record<number, Poll>;
  inArticleAds: Ad[];
  queue: ContinuousQueueItem[];
};
