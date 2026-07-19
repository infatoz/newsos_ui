import { gql } from "@apollo/client";
import { MEDIA_FIELDS } from "./media.fragment";
import { AUTHOR_CARD_FIELDS } from "./author.fragment";

export const STORY_FIELDS = gql`
  ${MEDIA_FIELDS}
  ${AUTHOR_CARD_FIELDS}

  fragment StoryFields on Story {
    id
    databaseId
    title
    slug
    uri
    excerpt
    content
    date
    modified
    coverImageUrl
    pages
    seoTitle
    seoDescription
    seoKeywords
    canonicalUrl
    scheduleStart
    scheduleEnd
    isFeatured
    durationSeconds
    relatedMode
    manualRelatedIds
    relatedStories {
      id
      databaseId
      title
      slug
      uri
      coverImageUrl
      excerpt
    }
    featuredImage {
      node {
        ...MediaFields
      }
    }
    author {
      node {
        ...AuthorCardFields
      }
    }
    storyCategories {
      nodes {
        id
        databaseId
        name
        slug
        uri
      }
    }
    storyTags {
      nodes {
        id
        databaseId
        name
        slug
        uri
      }
    }
  }
`;

export const STORY_CARD_FIELDS = gql`
  ${MEDIA_FIELDS}

  fragment StoryCardFields on Story {
    id
    databaseId
    title
    slug
    uri
    excerpt
    date
    modified
    coverImageUrl
    isFeatured
    durationSeconds
    featuredImage {
      node {
        ...MediaFields
      }
    }
  }
`;
