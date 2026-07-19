import { gql } from "@apollo/client";
import { POST_CARD_FIELDS } from "../fragments/post-card.fragment";
import { POST_FULL_FIELDS } from "../fragments/post-full.fragment";

export const GET_POST_BY_SLUG = gql`
  ${POST_FULL_FIELDS}

  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      ...PostFullFields
    }
  }
`;

export const GET_POST_BY_URI = gql`
  ${POST_FULL_FIELDS}

  query GetPostByUri($uri: ID!) {
    post(id: $uri, idType: URI) {
      ...PostFullFields
    }
  }
`;

/** Fallback when SLUG idType fails for encoded / Unicode post_names. */
export const GET_POST_BY_NAME = gql`
  ${POST_FULL_FIELDS}

  query GetPostByName($name: String!) {
    posts(first: 1, where: { name: $name, status: PUBLISH }) {
      nodes {
        ...PostFullFields
      }
    }
  }
`;

export const GET_NODE_BY_URI = gql`
  ${POST_FULL_FIELDS}

  query GetNodeByUri($uri: String!) {
    nodeByUri(uri: $uri) {
      __typename
      ... on Post {
        ...PostFullFields
      }
    }
  }
`;

export const GET_POSTS = gql`
  ${POST_CARD_FIELDS}

  query GetPosts(
    $first: Int = 10
    $after: String
    $categorySlug: String
    $tagSlug: String
    $authorName: String
    $search: String
  ) {
    posts(
      first: $first
      after: $after
      where: {
        status: PUBLISH
        orderby: { field: DATE, order: DESC }
        categoryName: $categorySlug
        tag: $tagSlug
        authorName: $authorName
        search: $search
      }
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
`;

export const GET_RELATED_POSTS = gql`
  ${POST_CARD_FIELDS}

  query GetRelatedPosts($postId: Int!, $limit: Int = 6) {
    relatedPosts(postId: $postId, limit: $limit) {
      ...PostCardFields
    }
  }
`;
