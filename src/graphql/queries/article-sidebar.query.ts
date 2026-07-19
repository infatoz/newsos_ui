import { gql } from "@apollo/client";

export const GET_ARTICLE_SIDEBAR_BLOCKS = gql`
  query GetArticleSidebarBlocks {
    enmArticleSidebarBlocks {
      id
      databaseId
      title
      blockType
      config
      isEnabled
      categoryId
      postLimit
      titleOverride
      menuOrder
    }
  }
`;
