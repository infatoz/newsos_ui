import { gql } from "@apollo/client";
import { MEDIA_FIELDS } from "../fragments/media.fragment";
import { AUTHOR_CARD_FIELDS } from "../fragments/author.fragment";

export const VIDEO_CARD_FIELDS = gql`
  ${MEDIA_FIELDS}

  fragment VideoCardFields on Video {
    id
    databaseId
    title
    slug
    uri
    excerpt
    date
    modified
    videoUrl
    videoProvider
    videoDuration
    videoIsLive
    featuredImage {
      node {
        ...MediaFields
      }
    }
  }
`;

export const VIDEO_FIELDS = gql`
  ${MEDIA_FIELDS}
  ${AUTHOR_CARD_FIELDS}
  ${VIDEO_CARD_FIELDS}

  fragment VideoFields on Video {
    ...VideoCardFields
    content
    videoEmbed
    videoTranscript
    author {
      node {
        ...AuthorCardFields
      }
    }
  }
`;

export const GET_VIDEOS = gql`
  ${VIDEO_CARD_FIELDS}

  query GetVideos($first: Int = 12, $after: String) {
    videos(
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
        ...VideoCardFields
      }
    }
  }
`;

export const GET_VIDEO_BY_SLUG = gql`
  ${VIDEO_FIELDS}

  query GetVideoBySlug($slug: ID!) {
    video(id: $slug, idType: SLUG) {
      ...VideoFields
    }
  }
`;
