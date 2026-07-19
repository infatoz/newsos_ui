import { gql } from "@apollo/client";

export const MEDIA_FIELDS = gql`
  fragment MediaFields on MediaItem {
    id
    databaseId
    altText
    caption
    description
    title
    sourceUrl
    mediaItemUrl
    mimeType
    mediaType
    srcSet
    sizes
    mediaDetails {
      width
      height
      file
      sizes {
        name
        sourceUrl
        width
        height
        mimeType
      }
    }
  }
`;
