export type AdFormat =
  | "banner"
  | "leaderboard"
  | "mpu"
  | "sidebar"
  | "native"
  | "interstitial"
  | "sticky"
  | "video"
  | "sponsored"
  | string;

export type AdProvider =
  | "gpt"
  | "adsense"
  | "custom"
  | "house"
  | "taboola"
  | "outbrain"
  | string;

export interface AdTargeting {
  section?: string | null;
  category?: string | null;
  keywords?: string[] | null;
  pageType?: string | null;
  device?: "desktop" | "mobile" | "tablet" | "all" | string | null;
}

export interface Ad {
  id: string;
  databaseId?: number;
  name: string;
  slotId?: string | null;
  format: AdFormat;
  provider: AdProvider;
  /** GPT / AdSense unit path, e.g. /1234/homepage/leaderboard */
  adUnitPath?: string | null;
  sizes?: Array<[number, number] | string> | null;
  /** Reserved desktop slot (CLS). */
  slotWidth?: number | null;
  slotHeight?: number | null;
  /** Optional mobile reserved slot; 0/null = use desktop. */
  slotWidthMobile?: number | null;
  slotHeightMobile?: number | null;
  /** Featured image intrinsic size for house creatives. */
  imageWidth?: number | null;
  imageHeight?: number | null;
  html?: string | null;
  imageUrl?: string | null;
  clickUrl?: string | null;
  scriptSrc?: string | null;
  targeting?: AdTargeting | null;
  isActive: boolean;
  priority?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  label?: string | null;
  sponsoredBy?: string | null;
  /** Whether to show "Advertisement" disclosure. */
  showDisclosure?: boolean;
}

export interface AdPlacement {
  id: string;
  position:
    | "header"
    | "footer"
    | "sidebar"
    | "in-article"
    | "below-headline"
    | "homepage-top"
    | "homepage-mid"
    | "sticky-bottom"
    | string;
  ads: Ad[];
  maxAds?: number | null;
}
