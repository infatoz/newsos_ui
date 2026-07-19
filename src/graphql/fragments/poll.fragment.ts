import { gql } from "@apollo/client";
import { MEDIA_FIELDS } from "./media.fragment";

export const POLL_FIELDS = gql`
  ${MEDIA_FIELDS}

  fragment PollFields on Poll {
    id
    databaseId
    title
    slug
    uri
    content
    date
    modified
    choices
    results
    totalVotes
    expiry
    allowMultiple
    showResults
    isClosed
    featuredImage {
      node {
        ...MediaFields
      }
    }
  }
`;
