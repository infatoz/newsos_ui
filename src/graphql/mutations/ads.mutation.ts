import { gql } from "@apollo/client";

export const TRACK_AD_IMPRESSION = gql`
  mutation TrackAdImpression($input: TrackAdImpressionInput!) {
    trackAdImpression(input: $input) {
      tracking {
        success
        adId
        impressions
        message
      }
    }
  }
`;
