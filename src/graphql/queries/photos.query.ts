import { gql } from "@apollo/client";
import { MEDIA_FIELDS } from "../fragments/media.fragment";
import { AUTHOR_CARD_FIELDS } from "../fragments/author.fragment";

export const PHOTO_STORY_CARD_FIELDS = gql`
  ${MEDIA_FIELDS}

  fragment PhotoStoryCardFields on PhotoStory {
    id
    databaseId
    title
    slug
    uri
    excerpt
    date
    modified
    photoCoverUrl
    photoCoverId
    photoCount
    featuredImage {
      node {
        ...MediaFields
      }
    }
  }
`;

export const PHOTO_STORY_FIELDS = gql`
  ${MEDIA_FIELDS}
  ${AUTHOR_CARD_FIELDS}
  ${PHOTO_STORY_CARD_FIELDS}

  fragment PhotoStoryFields on PhotoStory {
    ...PhotoStoryCardFields
    content
    photoGallery
    author {
      node {
        ...AuthorCardFields
      }
    }
  }
`;

export const GET_PHOTO_STORIES = gql`
  ${PHOTO_STORY_CARD_FIELDS}

  query GetPhotoStories($first: Int = 12, $after: String) {
    photoStories(
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
        ...PhotoStoryCardFields
      }
    }
  }
`;

export const GET_PHOTO_STORY_BY_SLUG = gql`
  ${PHOTO_STORY_FIELDS}

  query GetPhotoStoryBySlug($slug: ID!) {
    photoStory(id: $slug, idType: SLUG) {
      ...PhotoStoryFields
    }
  }
`;
