/** Parsed Web Story page from enm_story_pages JSON. */
export interface StoryPageData {
  title?: string;
  body?: string;
  imageUrl?: string;
  link?: string;
  linkLabel?: string;
}

/**
 * Parse story pages JSON from WP (title, description, image, optional link).
 */
export function parseStoryPages(raw?: string | null): StoryPageData[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((page) => {
      if (page && typeof page === "object") {
        const p = page as Record<string, unknown>;
        const body =
          typeof p.description === "string"
            ? p.description
            : typeof p.body === "string"
              ? p.body
              : typeof p.content === "string"
                ? p.content
                : undefined;
        return {
          title: typeof p.title === "string" ? p.title : undefined,
          body,
          imageUrl:
            typeof p.imageUrl === "string"
              ? p.imageUrl
              : typeof p.image === "string"
                ? p.image
                : undefined,
          link:
            typeof p.link === "string"
              ? p.link
              : typeof p.ctaUrl === "string"
                ? p.ctaUrl
                : typeof p.cta === "string"
                  ? p.cta
                  : undefined,
          linkLabel:
            typeof p.linkLabel === "string"
              ? p.linkLabel
              : typeof p.ctaLabel === "string"
                ? p.ctaLabel
                : undefined,
        };
      }
      return {};
    });
  } catch {
    return [];
  }
}
