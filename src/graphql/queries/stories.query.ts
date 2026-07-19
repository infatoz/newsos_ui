import { gql } from "@apollo/client";
import { STORY_FIELDS, STORY_CARD_FIELDS } from "../fragments/story.fragment";

export const GET_STORIES = gql`
  ${STORY_CARD_FIELDS}

  query GetStories($first: Int = 12, $after: String) {
    stories(
      first: $first
      after: $after
      where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        ...StoryCardFields
      }
    }
  }
`;

export const GET_STORY_BY_SLUG = gql`
  ${STORY_FIELDS}

  query GetStoryBySlug($slug: ID!) {
    story(id: $slug, idType: SLUG) {
      ...StoryFields
    }
  }
`;

export const GET_FEATURED_STORIES = gql`
  ${STORY_CARD_FIELDS}

  query GetFeaturedStories($first: Int = 8) {
    stories(
      first: $first
      where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }
    ) {
      nodes {
        ...StoryCardFields
      }
    }
  }
`;
