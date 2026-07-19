import { stripHtml } from "@/lib/utils";

/**
 * Normalize a media/HTML caption into plain text, or null if it is not usable.
 * Rejects empty strings and WP auto-excerpt placeholders like " […]".
 */
export function normalizeCaption(
  raw?: string | null,
): string | null {
  if (!raw) return null;
  const text = stripHtml(raw)
    .replace(/\u2026/g, "...")
    .replace(/\[\s*\.{3}\s*\]/g, "")
    .replace(/\[\s*&hellip;\s*\]/gi, "")
    .replace(/&hellip;/gi, "")
    .replace(/\.{3,}/g, "...")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return null;
  // Require at least one letter or number (any script).
  if (!/[\p{L}\p{N}]/u.test(text)) return null;
  // Skip bare filenames mistaken for captions.
  if (/^[\w.-]+\.(jpe?g|png|gif|webp|avif|svg)$/i.test(text)) return null;
  return text;
}

/**
 * Pick the best caption from media fields (attachment caption → description → title).
 */
export function resolveMediaCaption(media?: {
  caption?: string | null;
  description?: string | null;
  title?: string | null;
  altText?: string | null;
} | null): string | null {
  if (!media) return null;
  return (
    normalizeCaption(media.caption) ||
    normalizeCaption(media.description) ||
    normalizeCaption(media.title) ||
    null
  );
}

/**
 * First figcaption / wp-caption-text near the first content image.
 */
export function extractFirstContentImageCaption(
  html?: string | null,
): string | null {
  if (!html?.trim()) return null;

  const figure =
    /<figure\b[^>]*>[\s\S]*?<img\b[^>]*>[\s\S]*?<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>[\s\S]*?<\/figure>/i.exec(
      html,
    );
  if (figure?.[1]) {
    const text = normalizeCaption(figure[1]);
    if (text) return text;
  }

  const classic =
    /<div\b[^>]*\bwp-caption\b[^>]*>[\s\S]*?<img\b[^>]*>[\s\S]*?<(?:p|div)\b[^>]*\bwp-caption-text\b[^>]*>([\s\S]*?)<\/(?:p|div)>/i.exec(
      html,
    );
  if (classic?.[1]) {
    const text = normalizeCaption(classic[1]);
    if (text) return text;
  }

  const blockCap =
    /<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i.exec(html);
  if (blockCap?.[1]) {
    return normalizeCaption(blockCap[1]);
  }

  return null;
}

function withCaptionClass(attrs: string): string {
  if (/\bclass=["']/i.test(attrs)) {
    if (/\bnp-image-caption\b/.test(attrs)) return attrs;
    return attrs.replace(
      /\bclass=["']([^"']*)["']/i,
      (_m, cls: string) => `class="${cls} np-image-caption"`,
    );
  }
  return `${attrs} class="np-image-caption"`;
}

/**
 * Clean article HTML captions:
 * - drop empty / placeholder figcaptions and wp-caption-text
 * - keep valid captions visible for readers (normalized text + CSS hook class)
 * - promote img title → figcaption when a figure has no caption
 */
export function enhanceArticleImageCaptions(html: string): string {
  if (!html?.trim()) return html;

  let out = html;

  // Normalize / remove empty figcaptions; ensure visible class.
  out = out.replace(
    /<figcaption\b([^>]*)>([\s\S]*?)<\/figcaption>/gi,
    (_full, attrs: string, inner: string) => {
      const text = normalizeCaption(inner);
      if (!text) return "";
      return `<figcaption${withCaptionClass(attrs)}>${escapeHtml(text)}</figcaption>`;
    },
  );

  // Classic captions: <p class="wp-caption-text">…</p>
  out = out.replace(
    /<(p|div)\b([^>]*\bwp-caption-text\b[^>]*)>([\s\S]*?)<\/\1>/gi,
    (_full, tag: string, attrs: string, inner: string) => {
      const text = normalizeCaption(inner);
      if (!text) return "";
      return `<${tag}${withCaptionClass(attrs)}>${escapeHtml(text)}</${tag}>`;
    },
  );

  // Figures with an image but no figcaption: use title/alt when it looks like a real caption.
  out = out.replace(
    /<figure\b([^>]*)>([\s\S]*?)<\/figure>/gi,
    (full, figureAttrs: string, inner: string) => {
      if (/<figcaption\b/i.test(inner)) return full;
      const img = /<img\b([^>]*)>/i.exec(inner);
      if (!img) return full;
      const attrs = img[1] ?? "";
      const title = /(?:^|\s)title=["']([^"']+)["']/i.exec(attrs)?.[1];
      const alt = /(?:^|\s)alt=["']([^"']+)["']/i.exec(attrs)?.[1];
      const text = normalizeCaption(title) || normalizeCaption(alt);
      if (!text) return full;
      return `<figure${figureAttrs}>${inner}<figcaption class="np-image-caption">${escapeHtml(text)}</figcaption></figure>`;
    },
  );

  return out;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
