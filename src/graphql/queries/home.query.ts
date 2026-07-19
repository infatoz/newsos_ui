import { gql } from "@apollo/client";
import { POST_CARD_FIELDS } from "../fragments/post-card.fragment";
import { BREAKING_NEWS_FIELDS } from "../fragments/breaking.fragment";
import { CATEGORY_CARD_FIELDS } from "../fragments/category.fragment";

/**
 * Homepage payload: builder blocks, breaking ticker, latest + trending rails,
 * and category section seeds for the frontend to hydrate.
 *
 * Note: ENM does not expose a views field yet — `trendingPosts` falls back to
 * the latest published posts (same as most-read until analytics meta is wired).
 */
export const GET_HOME_DATA = gql`
  ${POST_CARD_FIELDS}
  ${BREAKING_NEWS_FIELDS}
  ${CATEGORY_CARD_FIELDS}

  query GetHomeData(
    $latestFirst: Int = 12
    $trendingFirst: Int = 10
    $categoriesFirst: Int = 8
  ) {
    homepageBlocks(first: 50) {
      nodes {
        id
        databaseId
        title
        blockType
        config
        isEnabled
        categoryId
        postLimit
        titleOverride
        menuOrder
      }
    }

    breakingNewsActive {
      ...BreakingNewsFields
    }

    latestPosts: posts(
      first: $latestFirst
      where: { orderby: { field: DATE, order: DESC }, status: PUBLISH }
    ) {
      nodes {
        ...PostCardFields
      }
    }

    trendingPosts: posts(
      first: $trendingFirst
      where: { orderby: { field: DATE, order: DESC }, status: PUBLISH }
    ) {
      nodes {
        ...PostCardFields
      }
    }

    stickyPosts: posts(
      first: 5
      where: { orderby: { field: DATE, order: DESC }, status: PUBLISH }
    ) {
      nodes {
        ...PostCardFields
      }
    }

    categories(first: $categoriesFirst, where: { hideEmpty: true, orderby: COUNT, order: DESC }) {
      nodes {
        ...CategoryCardFields
        count
        description
        posts(first: 6, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
          nodes {
            ...PostCardFields
          }
        }
      }
    }

    liveStreams(first: 5, where: { status: PUBLISH }) {
      nodes {
        id
        databaseId
        title
        excerpt
        streamUrl
        videoId
        embedUrl
        streamStatus
        showOnHomepage
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }

    videos(first: 8, where: { status: PUBLISH }) {
      nodes {
        id
        databaseId
        title
        slug
        uri
        videoUrl
        videoDuration
        featuredImage {
          node {
            sourceUrl
          }
        }
      }
    }

    photoStories(first: 8, where: { status: PUBLISH }) {
      nodes {
        id
        databaseId
        title
        slug
        uri
        photoCoverUrl
        photoCount
        featuredImage {
          node {
            sourceUrl
          }
        }
      }
    }

    stories(first: 8, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
      nodes {
        id
        databaseId
        title
        slug
        uri
        coverImageUrl
      }
    }
  }
`;
