import { gql } from "@apollo/client";
import { POST_CARD_FIELDS } from "../fragments/post-card.fragment";

export const GET_SEARCH_RESULTS = gql`
  ${POST_CARD_FIELDS}

  query GetSearchResults($search: String!, $first: Int = 12, $after: String) {
    posts(
      first: $first
      after: $after
      where: {
        search: $search
        status: PUBLISH
        orderby: { field: DATE, order: DESC }
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
