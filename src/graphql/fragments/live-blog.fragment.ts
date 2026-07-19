import { gql } from "@apollo/client";
import { MEDIA_FIELDS } from "./media.fragment";
import { AUTHOR_CARD_FIELDS } from "./author.fragment";

export const LIVE_UPDATE_FIELDS = gql`
  ${MEDIA_FIELDS}
  ${AUTHOR_CARD_FIELDS}

  fragment LiveUpdateFields on LiveUpdate {
    id
    databaseId
    title
    content
    date
    modified
    blogId
    isPinned
    mediaId
    mediaUrl
    mediaType
    timelineOrder
    displayTimestamp
    author {
      node {
        ...AuthorCardFields
      }
    }
    featuredImage {
      node {
        ...MediaFields
      }
    }
  }
`;

export const LIVE_BLOG_FIELDS = gql`
  ${MEDIA_FIELDS}
  ${AUTHOR_CARD_FIELDS}
  ${LIVE_UPDATE_FIELDS}

  fragment LiveBlogFields on LiveBlog {
    id
    databaseId
    title
    slug
    uri
    excerpt
    content
    date
    modified
    liveStatus
    startedAt
    endedAt
    relatedMode
    manualRelatedIds
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
    updates {
      ...LiveUpdateFields
    }
  }
`;

export const LIVE_BLOG_CARD_FIELDS = gql`
  ${MEDIA_FIELDS}

  fragment LiveBlogCardFields on LiveBlog {
    id
    databaseId
    title
    slug
    uri
    excerpt
    date
    modified
    liveStatus
    startedAt
    endedAt
    featuredImage {
      node {
        ...MediaFields
      }
    }
  }
`;
