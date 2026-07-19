import type { Ad } from "@/types/ads";

export interface SlotSize {
  width: number;
  height: number;
  widthMobile: number;
  heightMobile: number;
}

export interface SlotSizeOverride {
  adWidth?: number | null;
  adHeight?: number | null;
  adWidthMobile?: number | null;
  adHeightMobile?: number | null;
}

const DEFAULT_SIZE: SlotSize = {
  width: 300,
  height: 250,
  widthMobile: 300,
  heightMobile: 250,
};

function firstParsedSize(
  sizes?: Ad["sizes"] | null,
): { width: number; height: number } | null {
  if (!sizes?.length) return null;
  for (const s of sizes) {
    if (Array.isArray(s) && s.length >= 2) {
      const w = Number(s[0]);
      const h = Number(s[1]);
      if (w > 0 && h > 0) return { width: w, height: h };
    }
    if (typeof s === "string") {
      const m = /^(\d+)\s*[x×]\s*(\d+)$/i.exec(s.trim());
      if (m) {
        const w = Number(m[1]);
        const h = Number(m[2]);
        if (w > 0 && h > 0) return { width: w, height: h };
      }
    }
  }
  return null;
}

/**
 * Priority: block override → Ad.slot* → first sizes pair → image media → 300×250.
 */
export function resolveSlotSize(
  ad?: Ad | null,
  override?: SlotSizeOverride | null,
): SlotSize {
  const ow = Number(override?.adWidth) || 0;
  const oh = Number(override?.adHeight) || 0;
  const omw = Number(override?.adWidthMobile) || 0;
  const omh = Number(override?.adHeightMobile) || 0;

  let width = 0;
  let height = 0;

  if (ow > 0 && oh > 0) {
    width = ow;
    height = oh;
  } else if (ad?.slotWidth && ad?.slotHeight) {
    width = ad.slotWidth;
    height = ad.slotHeight;
  } else {
    const fromSizes = firstParsedSize(ad?.sizes);
    if (fromSizes) {
      width = fromSizes.width;
      height = fromSizes.height;
    } else if (ad?.imageWidth && ad?.imageHeight) {
      width = ad.imageWidth;
      height = ad.imageHeight;
    } else {
      width = DEFAULT_SIZE.width;
      height = DEFAULT_SIZE.height;
    }
  }

  const widthMobile =
    omw > 0
      ? omw
      : ad?.slotWidthMobile && ad.slotWidthMobile > 0
        ? ad.slotWidthMobile
        : width;
  const heightMobile =
    omh > 0
      ? omh
      : ad?.slotHeightMobile && ad.slotHeightMobile > 0
        ? ad.slotHeightMobile
        : height;

  return { width, height, widthMobile, heightMobile };
}
