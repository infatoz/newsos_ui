import { gql } from "@apollo/client";

export const BREAKING_NEWS_FIELDS = gql`
  fragment BreakingNewsFields on BreakingNews {
    id
    databaseId
    title
    date
    modified
    tickerText
    linkUrl
    priority
    bgColor
    textColor
    schedule
    expiry
    isActive
  }
`;
