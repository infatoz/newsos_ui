import { gql } from "@apollo/client";
import { AD_FIELDS } from "../fragments/ad.fragment";

export const GET_ACTIVE_ADS = gql`
  ${AD_FIELDS}

  query GetActiveAds(
    $placement: String
    $device: String
    $country: String
  ) {
    activeAds(placement: $placement, device: $device, country: $country) {
      ...AdFields
    }
  }
`;
