import { gql } from "@apollo/client";
import {
  LIVE_BLOG_FIELDS,
  LIVE_BLOG_CARD_FIELDS,
} from "../fragments/live-blog.fragment";

export const GET_LIVE_BLOGS = gql`
  ${LIVE_BLOG_CARD_FIELDS}

  query GetLiveBlogs($first: Int = 10, $after: String) {
    liveBlogs(
      first: $first
      after: $after
      where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        ...LiveBlogCardFields
      }
    }
  }
`;

export const GET_LIVE_BLOG_BY_SLUG = gql`
  ${LIVE_BLOG_FIELDS}

  query GetLiveBlogBySlug($slug: ID!) {
    liveBlog(id: $slug, idType: SLUG) {
      ...LiveBlogFields
    }
  }
`;

export const GET_ACTIVE_LIVE_BLOGS = gql`
  ${LIVE_BLOG_CARD_FIELDS}

  query GetActiveLiveBlogs($first: Int = 5) {
    liveBlogs(
      first: $first
      where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
    ) {
      nodes {
        ...LiveBlogCardFields
      }
    }
  }
`;
