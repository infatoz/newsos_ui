import { gql } from "@apollo/client";
import { POST_CARD_FIELDS } from "../fragments/post-card.fragment";
import { AUTHOR_FIELDS } from "../fragments/author.fragment";

export const GET_AUTHOR_BY_SLUG = gql`
  ${POST_CARD_FIELDS}
  ${AUTHOR_FIELDS}

  query GetAuthorBySlug($slug: ID!, $first: Int = 12, $after: String) {
    user(id: $slug, idType: SLUG) {
      ...AuthorFields
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

export const GET_AUTHORS = gql`
  ${AUTHOR_FIELDS}

  query GetAuthors($first: Int = 50) {
    users(first: $first, where: { hasPublishedPosts: POST }) {
      nodes {
        ...AuthorFields
      }
    }
  }
`;
