import { gql } from "@apollo/client";
import { MEDIA_FIELDS } from "./media.fragment";

export const AD_FIELDS = gql`
  ${MEDIA_FIELDS}

  fragment AdFields on Ad {
    id
    databaseId
    title
    date
    modified
    network
    gamAdUnit
    gamSizes
    slotWidth
    slotHeight
    slotWidthMobile
    slotHeightMobile
    adsenseSlot
    adsenseClient
    customCode
    clickUrl
    campaignStart
    campaignEnd
    devices
    countries
    priority
    isActive
    impressions
    clicks
    analyticsLabel
    placements
    featuredImage {
      node {
        ...MediaFields
      }
    }
  }
`;
