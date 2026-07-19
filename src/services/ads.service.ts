import { GET_ACTIVE_ADS, TRACK_AD_IMPRESSION } from "@/graphql";
import type { GraphQLFetchOptions } from "@/lib/graphql-fetch";
import type { Ad } from "@/types";
import { fetchMutation, fetchQuery } from "./graphql.helpers";

/** Raw Ad shape returned by WPGraphQL / ENM (before UI mapping). */
export interface GraphQLAd {
  id: string;
  databaseId: number;
  title?: string | null;
  network?: string | null;
  gamAdUnit?: string | null;
  gamSizes?: string | null;
  slotWidth?: number | null;
  slotHeight?: number | null;
  slotWidthMobile?: number | null;
  slotHeightMobile?: number | null;
  adsenseSlot?: string | null;
  adsenseClient?: string | null;
  customCode?: string | null;
  clickUrl?: string | null;
  campaignStart?: string | null;
  campaignEnd?: string | null;
  devices?: string | null;
  countries?: string | null;
  priority?: number | null;
  isActive?: boolean | null;
  impressions?: number | null;
  clicks?: number | null;
  analyticsLabel?: string | null;
  placements?: string[] | null;
  featuredImage?: {
    node?: {
      sourceUrl?: string | null;
      altText?: string | null;
      mediaDetails?: {
        width?: number | null;
        height?: number | null;
      } | null;
    } | null;
  } | null;
}

export interface TrackAdImpressionResult {
  trackAdImpression: {
    tracking: {
      success: boolean;
      adId: number;
      impressions: number;
      message?: string | null;
    };
  };
}

function parseSizes(gamSizes?: string | null): Ad["sizes"] {
  if (!gamSizes?.trim()) return null;
  return gamSizes
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = /^(\d+)x(\d+)$/i.exec(part);
      if (match) return [Number(match[1]), Number(match[2])] as [number, number];
      return part;
    });
}

/** Map GraphQL Ad CPT fields into the frontend Ad type. */
export function mapGraphQLAd(ad: GraphQLAd): Ad {
  const network = (ad.network ?? "custom_html").toLowerCase();
  let provider: Ad["provider"] = "custom";
  if (network.includes("gam") || network.includes("gpt")) provider = "gpt";
  else if (network.includes("adsense")) provider = "adsense";
  else if (network.includes("house")) provider = "house";

  const isAdsense = provider === "adsense";
  const media = ad.featuredImage?.node?.mediaDetails;

  return {
    id: ad.id,
    databaseId: ad.databaseId,
    name: ad.title ?? ad.analyticsLabel ?? `Ad ${ad.databaseId}`,
    slotId: isAdsense
      ? (ad.adsenseSlot ?? null)
      : (ad.adsenseSlot ?? ad.gamAdUnit ?? null),
    format: (ad.placements?.[0] as Ad["format"]) ?? "banner",
    provider,
    adUnitPath: isAdsense
      ? (ad.adsenseClient ?? null)
      : (ad.gamAdUnit ?? ad.adsenseClient ?? null),
    sizes: parseSizes(ad.gamSizes),
    slotWidth: ad.slotWidth && ad.slotWidth > 0 ? ad.slotWidth : null,
    slotHeight: ad.slotHeight && ad.slotHeight > 0 ? ad.slotHeight : null,
    slotWidthMobile:
      ad.slotWidthMobile && ad.slotWidthMobile > 0 ? ad.slotWidthMobile : null,
    slotHeightMobile:
      ad.slotHeightMobile && ad.slotHeightMobile > 0
        ? ad.slotHeightMobile
        : null,
    imageWidth: media?.width ?? null,
    imageHeight: media?.height ?? null,
    html: ad.customCode ?? null,
    imageUrl: ad.featuredImage?.node?.sourceUrl ?? null,
    clickUrl: ad.clickUrl ?? null,
    targeting: {
      device: ad.devices ?? "all",
    },
    isActive: Boolean(ad.isActive),
    priority: ad.priority ?? null,
    startAt: ad.campaignStart || null,
    endAt: ad.campaignEnd || null,
    label: ad.analyticsLabel ?? null,
    showDisclosure: true,
  };
}

export async function getActiveAds(
  params?: {
    placement?: string;
    device?: string;
    country?: string;
  },
  options?: GraphQLFetchOptions,
): Promise<Ad[]> {
  const data = await fetchQuery<{ activeAds: GraphQLAd[] }>(
    GET_ACTIVE_ADS,
    {
      placement: params?.placement ?? "",
      device: params?.device ?? "",
      country: params?.country ?? "",
    },
    {
      revalidate: 30,
      tags: [
        "ads",
        params?.placement ? `ads:${params.placement}` : "ads:all",
      ],
      ...options,
    },
  );

  return (data.activeAds ?? []).map(mapGraphQLAd);
}

export async function trackAdImpression(
  adId: number,
  options?: GraphQLFetchOptions,
): Promise<TrackAdImpressionResult["trackAdImpression"]["tracking"]> {
  const data = await fetchMutation<TrackAdImpressionResult>(
    TRACK_AD_IMPRESSION,
    { input: { adId } },
    options,
  );
  return data.trackAdImpression.tracking;
}
