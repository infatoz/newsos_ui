import { gql } from "@apollo/client";

export const CATEGORY_FIELDS = gql`
  fragment CategoryFields on Category {
    id
    databaseId
    name
    slug
    uri
    description
    count
    parent {
      node {
        id
        databaseId
        name
        slug
        uri
      }
    }
  }
`;

export const CATEGORY_CARD_FIELDS = gql`
  fragment CategoryCardFields on Category {
    id
    databaseId
    name
    slug
    uri
  }
`;
