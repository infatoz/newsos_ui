import { gql } from "@apollo/client";
import { POLL_FIELDS } from "../fragments/poll.fragment";

export const GET_POLL_BY_SLUG = gql`
  ${POLL_FIELDS}

  query GetPollBySlug($slug: ID!) {
    poll(id: $slug, idType: SLUG) {
      ...PollFields
    }
  }
`;

export const GET_POLL_BY_ID = gql`
  ${POLL_FIELDS}

  query GetPollById($id: ID!) {
    poll(id: $id, idType: DATABASE_ID) {
      ...PollFields
    }
  }
`;

export const GET_POLLS = gql`
  ${POLL_FIELDS}

  query GetPolls($first: Int = 10, $after: String) {
    polls(
      first: $first
      after: $after
      where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ...PollFields
      }
    }
  }
`;
