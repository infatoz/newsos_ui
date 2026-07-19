import type { Metadata } from "next";
import { absoluteUrl } from "@/utils/urls";

/**
 * Static PNGs in /public/icons — avoids Turbopack/sharp 500s in dev
 * and keeps the web manifest on reliable, correctly sized assets.
 */
export function pwaIconPath(size: 192 | 512): string {
  return size === 512 ? "/icons/icon-512.png" : "/icons/icon-192.png";
}

export function pwaIconUrl(size: 192 | 512): string {
  return absoluteUrl(pwaIconPath(size));
}

/** Next.js Metadata `icons` — never point at arbitrary CMS logo dimensions. */
export function pwaMetadataIcons(): NonNullable<Metadata["icons"]> {
  return {
    icon: [
      {
        url: pwaIconPath(192),
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: pwaIconPath(512),
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: pwaIconPath(192),
    apple: [
      {
        url: pwaIconPath(192),
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
