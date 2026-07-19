import { gql } from "@apollo/client";
import { POST_CARD_FIELDS } from "./post-card.fragment";

/**
 * Full article fragment.
 * Includes Yoast SEO fields when WPGraphQL for Yoast SEO is active.
 */
export const POST_FULL_FIELDS = gql`
  ${POST_CARD_FIELDS}

  fragment PostFullFields on Post {
    ...PostCardFields
    content
    dateGmt
    modifiedGmt
    status
    commentStatus
    commentCount
    link
    relatedMode
    manualRelatedIds
    seo {
      title
      metaDesc
      canonical
      focuskw
      metaRobotsNoindex
      metaRobotsNofollow
      opengraphTitle
      opengraphDescription
      opengraphImage {
        sourceUrl
        altText
      }
      twitterTitle
      twitterDescription
      twitterImage {
        sourceUrl
        altText
      }
      breadcrumbs {
        text
        url
      }
      schema {
        raw
      }
      readingTime
    }
  }
`;
