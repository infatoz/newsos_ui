import { absoluteUrl } from "@/utils/urls";

/** Square PWA / favicon routes generated from the CMS logo via sharp. */
export function pwaIconPath(size: 192 | 512): string {
  return `/icons/icon/${size}`;
}

export function pwaIconUrl(size: 192 | 512): string {
  return absoluteUrl(pwaIconPath(size));
}

/** Next.js Metadata `icons` — never point at arbitrary CMS logo dimensions. */
export function pwaMetadataIcons() {
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
  } as const;
}
