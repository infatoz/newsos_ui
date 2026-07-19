import { gql } from "@apollo/client";
import { MEDIA_FIELDS } from "../fragments/media.fragment";

/**
 * Recent posts for Google News / Discover sitemaps.
 * `dateQuery.after` uses WPGraphQL DateInput (year/month/day/hour).
 */
export const GET_NEWS_SITEMAP_POSTS = gql`
  ${MEDIA_FIELDS}

  query GetNewsSitemapPosts(
    $first: Int = 100
    $after: String
    $year: Int!
    $month: Int!
    $day: Int!
    $hour: Int
  ) {
    posts(
      first: $first
      after: $after
      where: {
        status: PUBLISH
        orderby: { field: DATE, order: DESC }
        dateQuery: {
          after: { year: $year, month: $month, day: $day, hour: $hour }
          inclusive: true
        }
      }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        databaseId
        title
        slug
        uri
        date
        dateGmt
        modified
        modifiedGmt
        excerpt
        featuredImage {
          node {
            ...MediaFields
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
        tags {
          nodes {
            name
          }
        }
      }
    }
  }
`;

/** Posts with featured images for image / Discover sitemaps. */
export const GET_SITEMAP_IMAGE_POSTS = gql`
  ${MEDIA_FIELDS}

  query GetSitemapImagePosts($first: Int = 100, $after: String) {
    posts(
      first: $first
      after: $after
      where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        databaseId
        title
        slug
        uri
        date
        modified
        modifiedGmt
        featuredImage {
          node {
            ...MediaFields
          }
        }
      }
    }
  }
`;
