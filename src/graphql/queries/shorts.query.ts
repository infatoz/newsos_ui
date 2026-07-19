import { gql } from "@apollo/client";
import { MEDIA_FIELDS } from "../fragments/media.fragment";
import { AUTHOR_CARD_FIELDS } from "../fragments/author.fragment";

export const SHORT_CARD_FIELDS = gql`
  ${MEDIA_FIELDS}

  fragment ShortCardFields on Short {
    id
    databaseId
    title
    slug
    uri
    excerpt
    date
    modified
    shortVideoUrl
    shortPosterUrl
    shortDuration
    shortAspect
    shortMediaType
    shortSource
    shortDescription
    shortCtaUrl
    shortCtaLabel
    shortArticleUrl
    shortArticleLabel
    featuredImage {
      node {
        ...MediaFields
      }
    }
  }
`;

export const SHORT_FIELDS = gql`
  ${MEDIA_FIELDS}
  ${AUTHOR_CARD_FIELDS}
  ${SHORT_CARD_FIELDS}

  fragment ShortFields on Short {
    ...ShortCardFields
    content
    shortAudioUrl
    author {
      node {
        ...AuthorCardFields
      }
    }
  }
`;

export const GET_SHORTS = gql`
  ${SHORT_CARD_FIELDS}

  query GetShorts($first: Int = 24, $after: String) {
    shorts(
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
        ...ShortCardFields
      }
    }
  }
`;

export const GET_SHORT_BY_SLUG = gql`
  ${SHORT_FIELDS}

  query GetShortBySlug($slug: ID!) {
    short(id: $slug, idType: SLUG) {
      ...ShortFields
    }
  }
`;
