import { gql } from "@apollo/client";
import { POST_CARD_FIELDS } from "../fragments/post-card.fragment";
import { CATEGORY_FIELDS } from "../fragments/category.fragment";

export const GET_CATEGORY_BY_SLUG = gql`
  ${POST_CARD_FIELDS}
  ${CATEGORY_FIELDS}

  query GetCategoryBySlug(
    $slug: ID!
    $first: Int = 12
    $after: String
  ) {
    category(id: $slug, idType: SLUG) {
      ...CategoryFields
      seo {
        title
        metaDesc
        canonical
        opengraphTitle
        opengraphDescription
        opengraphImage {
          sourceUrl
          altText
        }
        metaRobotsNoindex
        metaRobotsNofollow
      }
      posts(
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
          ...PostCardFields
        }
      }
      children {
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
  }
`;

export const GET_CATEGORIES = gql`
  ${CATEGORY_FIELDS}

  query GetCategories($first: Int = 50, $hideEmpty: Boolean = true) {
    categories(
      first: $first
      where: { hideEmpty: $hideEmpty, orderby: NAME, order: ASC }
    ) {
      nodes {
        ...CategoryFields
      }
    }
  }
`;
