import { gql } from "@apollo/client";

/** Fetch a static WP page by URI (pass "/about/" or "about"). */
export const GET_PAGE_BY_SLUG = gql`
  query GetPageBySlug($slug: ID!) {
    page(id: $slug, idType: URI) {
      id
      databaseId
      title
      slug
      uri
      link
      content
      excerpt
      date
      modified
      status
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
      }
      seo {
        title
        metaDesc
        canonical
        opengraphTitle
        opengraphDescription
        opengraphImage {
          sourceUrl
          altText
        }
        metaRobotsNoindex
        metaRobotsNofollow
      }
    }
  }
`;
