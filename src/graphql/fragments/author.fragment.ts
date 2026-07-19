import { gql } from "@apollo/client";

const AUTHOR_SOCIAL_FIELDS = `
  social {
    facebook
    x
    instagram
    youtube
    linkedin
    website
  }
`;

export const AUTHOR_FIELDS = gql`
  fragment AuthorFields on User {
    id
    databaseId
    name
    slug
    uri
    description
    nicename
    firstName
    lastName
    url
    avatar {
      url
      width
      height
    }
    ${AUTHOR_SOCIAL_FIELDS}
  }
`;

export const AUTHOR_CARD_FIELDS = gql`
  fragment AuthorCardFields on User {
    id
    databaseId
    name
    slug
    uri
    description
    avatar {
      url
      width
      height
    }
    ${AUTHOR_SOCIAL_FIELDS}
  }
`;
