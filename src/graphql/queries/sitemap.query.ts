import { gql } from "@apollo/client";

/**
 * Lightweight post list for XML / next-sitemap generation.
 */
export const GET_SITEMAP_POSTS = gql`
  query GetSitemapPosts($first: Int = 100, $after: String) {
    posts(
      first: $first
      after: $after
      where: { status: PUBLISH, orderby: { field: MODIFIED, order: DESC } }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        databaseId
        slug
        uri
        modified
        modifiedGmt
      }
    }
  }
`;

export const GET_SITEMAP_PAGES = gql`
  query GetSitemapPages($first: Int = 100, $after: String) {
    pages(
      first: $first
      after: $after
      where: { status: PUBLISH, orderby: { field: MODIFIED, order: DESC } }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        databaseId
        slug
        uri
        modified
        modifiedGmt
      }
    }
  }
`;

export const GET_SITEMAP_CATEGORIES = gql`
  query GetSitemapCategories($first: Int = 100) {
    categories(first: $first, where: { hideEmpty: true }) {
      nodes {
        id
        databaseId
        slug
        uri
      }
    }
  }
`;

export const GET_SITEMAP_STORIES = gql`
  query GetSitemapStories($first: Int = 100, $after: String) {
    stories(
      first: $first
      after: $after
      where: { status: PUBLISH, orderby: { field: MODIFIED, order: DESC } }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        databaseId
        slug
        uri
        title
        modified
        modifiedGmt
        coverImageUrl
      }
    }
  }
`;
