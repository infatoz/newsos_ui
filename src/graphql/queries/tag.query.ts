import { gql } from "@apollo/client";
import { POST_CARD_FIELDS } from "../fragments/post-card.fragment";

export const GET_TAG_BY_SLUG = gql`
  ${POST_CARD_FIELDS}

  query GetTagBySlug($slug: ID!, $first: Int = 12, $after: String) {
    tag(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      uri
      description
      count
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
    }
  }
`;

export const GET_TAGS = gql`
  query GetTags($first: Int = 50, $hideEmpty: Boolean = true) {
    tags(first: $first, where: { hideEmpty: $hideEmpty, orderby: COUNT, order: DESC }) {
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
`;
