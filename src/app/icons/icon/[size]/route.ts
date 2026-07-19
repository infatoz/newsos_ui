import sharp from "sharp";
import { getSiteBranding } from "@/services/branding.service";
import { themeConfig } from "@/config/theme";
import { absoluteUrl } from "@/utils/urls";

export const revalidate = 3600;

const ALLOWED = new Set([192, 512]);

function resolveIconSource(urls: Array<string | null | undefined>): string {
  for (const url of urls) {
    const trimmed = url?.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    // Prefer raster sources sharp can decode.
    if (
      lower.includes(".svg") ||
      lower.includes(".ico")
    ) {
      continue;
    }
    return /^https?:\/\//i.test(trimmed)
      ? trimmed
      : absoluteUrl(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
  }
  // Fall back to whatever we have (may still be SVG — sharp will fail → PNG placeholder).
  const fallback =
    urls.find((u) => u?.trim())?.trim() || themeConfig.logo || "/favicon.ico";
  return /^https?:\/\//i.test(fallback)
    ? fallback
    : absoluteUrl(fallback.startsWith("/") ? fallback : `/${fallback}`);
}

async function loadSourceBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600, tags: ["branding", "pwa-icon"] },
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Serve a square PNG PWA icon at the requested size (192 or 512).
 * Avoids Manifest warnings when the CMS logo is not exactly 192×192 / 512×512.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ size: string }> },
) {
  const { size: sizeRaw } = await context.params;
  const size = Number.parseInt(sizeRaw, 10);
  if (!ALLOWED.has(size)) {
    return new Response("Not found", { status: 404 });
  }

  const branding = await getSiteBranding({ revalidate: 3600 });
  const sourceUrl = resolveIconSource([
    branding.faviconUrl,
    branding.logoUrl,
    branding.defaultOgImage,
    themeConfig.favicon,
    themeConfig.logo,
  ]);

  const source = await loadSourceBuffer(sourceUrl);

  let png: Buffer;
  try {
    if (source) {
      png = await sharp(source)
        .resize(size, size, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png()
        .toBuffer();
    } else {
      throw new Error("missing source");
    }
  } catch {
    // Solid brand-color tile if the remote logo cannot be decoded.
    png = await sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: themeConfig.primaryColor || "#c8102e",
      },
    })
      .png()
      .toBuffer();
  }

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
