/**
 * Normalize a route/param slug for WordPress / WPGraphQL lookups.
 * Fixes Google Search Console & Unicode (Kannada etc.) 404s caused by
 * percent-encoding and NFC/NFD mismatches.
 */
export function safeDecodeSlug(raw: string): string {
  let value = raw.trim();
  if (!value) return value;

  // Decode repeatedly until stable (handles double-encoding).
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(value);
      if (next === value) break;
      value = next;
    } catch {
      break;
    }
  }

  // WordPress stores post_name in NFC.
  try {
    value = value.normalize("NFC");
  } catch {
    // ignore
  }

  // Strip trailing slashes accidentally included in params.
  value = value.replace(/^\/+|\/+$/g, "");

  return value;
}

/** Build URL path segment(s) safely for /article/[slug]. */
export function encodeSlugForPath(slug: string): string {
  const normalized = safeDecodeSlug(slug);
  return normalized
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

/** Candidate slugs / URIs to try against WPGraphQL. */
export function slugLookupCandidates(raw: string): string[] {
  const decoded = safeDecodeSlug(raw);
  const encoded = encodeURIComponent(decoded);
  const candidates = new Set<string>();

  for (const base of [decoded, encoded, raw.trim()]) {
    if (!base) continue;
    candidates.add(base);
    candidates.add(base.replace(/^\/+|\/+$/g, ""));
    // Common WP permalink shapes for this headless site
    candidates.add(`/${base.replace(/^\/+/, "")}`);
    candidates.add(`/${base.replace(/^\/+|\/+$/g, "")}/`);
    candidates.add(`/article/${decoded}/`);
    candidates.add(`/article/${decoded}`);
    candidates.add(`/state/${decoded}/`);
    candidates.add(`/state/${decoded}`);
  }

  return [...candidates].filter(Boolean);
}
