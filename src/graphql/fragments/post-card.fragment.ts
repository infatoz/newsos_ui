import { gql } from "@apollo/client";
import { MEDIA_FIELDS } from "./media.fragment";
import { AUTHOR_CARD_FIELDS } from "./author.fragment";
import { CATEGORY_CARD_FIELDS } from "./category.fragment";

export const POST_CARD_FIELDS = gql`
  ${MEDIA_FIELDS}
  ${AUTHOR_CARD_FIELDS}
  ${CATEGORY_CARD_FIELDS}

  fragment PostCardFields on Post {
    id
    databaseId
    title
    slug
    excerpt
    date
    modified
    uri
    isSticky
    featuredImage {
      node {
        ...MediaFields
      }
    }
    author {
      node {
        ...AuthorCardFields
      }
    }
    categories {
      nodes {
        ...CategoryCardFields
      }
    }
    tags {
      nodes {
        id
        databaseId
        name
        slug
        uri
      }
    }
  }
`;
