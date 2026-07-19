import { gql } from "@apollo/client";

export const VOTE_POLL = gql`
  mutation VotePoll($input: VotePollInput!) {
    votePoll(input: $input) {
      vote {
        success
        pollId
        results
        totalVotes
        message
      }
    }
  }
`;
