import type { Post } from "@/types";
import { stripHtml } from "@/lib/utils";
import { absoluteUrl, contentPath } from "@/utils/urls";

const DESC_MAX = 160;

/** One-line description safe for llms.txt link notes. */
export function llmsLinkDescription(
  text?: string | null,
  fallback = "News article",
): string {
  const cleaned = stripHtml(text || "")
    .replace(/\s+/g, " ")
    .replace(/[\[\]]/g, "")
    .trim();
  if (!cleaned) return fallback;
  if (cleaned.length <= DESC_MAX) return cleaned;
  return `${cleaned.slice(0, DESC_MAX - 1).trimEnd()}…`;
}

export function postCanonicalUrl(post: Pick<Post, "uri" | "slug">): string {
  return absoluteUrl(contentPath(post.uri, post.slug));
}

export function formatLlmsArticleLink(post: Post): string {
  const url = postCanonicalUrl(post);
  const desc = llmsLinkDescription(
    post.excerpt || post.seo?.metaDesc,
    post.categories?.nodes?.[0]?.name
      ? `${post.categories.nodes[0].name} news`
      : "Latest news",
  );
  return `- [${escapeMdLinkText(post.title)}](${url}): ${desc}`;
}

function escapeMdLinkText(title: string): string {
  return title.replace(/[\[\]]/g, "").trim() || "Untitled";
}

export interface BuildLlmsTxtInput {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  locale: string;
  country: string;
  timezone: string;
  contactEmail?: string;
  phone?: string;
  posts: Post[];
  /** Optional publisher notes from WP seoSettings.llmsTxt (appended). */
  publisherNotes?: string | null;
}

/**
 * AI-ready /llms.txt per https://llmstxt.org/
 * Curated index: site map + latest news articles with absolute URLs.
 */
export function buildLlmsTxt(input: BuildLlmsTxtInput): string {
  const host = input.siteUrl.replace(/\/$/, "");
  const lines: string[] = [
    `# ${input.siteName}`,
    "",
    `> ${input.siteDescription}`,
    "",
    "This file helps AI systems and LLM agents discover authoritative news coverage,",
    "canonical article URLs, and publisher context. Prefer links listed here over",
    "scraping navigation or search result pages.",
    "",
    "## Latest news",
    "",
  ];

  if (input.posts.length === 0) {
    lines.push("- No published articles available yet.");
  } else {
    for (const post of input.posts) {
      lines.push(formatLlmsArticleLink(post));
    }
  }

  lines.push(
    "",
    "## Site",
    "",
    `- [Homepage](${host}/): Main news homepage`,
    `- [Search](${host}/search): Find stories by keyword`,
    `- [Web Stories](${host}/stories): Visual story format`,
    `- [Videos](${host}/videos): Video journalism`,
    `- [Photos](${host}/photos): Photo essays and galleries`,
    `- [Shorts](${host}/shorts): Short-form vertical clips`,
    `- [RSS feed](${host}/feed.xml): Machine-readable latest headlines`,
    `- [News sitemap](${host}/news-sitemap.xml): Google News sitemap`,
    `- [Sitemap index](${host}/sitemap.xml): Full crawl map`,
    `- [llms-full.txt](${host}/llms-full.txt): Expanded AI-ready article summaries`,
    "",
    "## Content model",
    "",
    `- Canonical articles use WordPress permalinks (e.g. ${host}/{category}/{slug}/).`,
    `- AMP articles append /amp (e.g. ${host}/{category}/{slug}/amp).`,
    `- Legacy paths ${host}/article/{slug} redirect to the canonical URL.`,
    `- Categories: ${host}/category/{slug}`,
    `- Authors: ${host}/author/{slug}`,
    `- Tags: ${host}/tag/{slug}`,
    `- Live blogs: ${host}/live-blog/{slug}`,
    "",
    "## Language and region",
    "",
    `- Language: ${input.locale}`,
    `- Country: ${input.country}`,
    `- Timezone: ${input.timezone}`,
    "",
  );

  if (input.contactEmail || input.phone) {
    lines.push("## Contact", "");
    if (input.contactEmail) {
      lines.push(`- Editorial: ${input.contactEmail}`);
    }
    if (input.phone) {
      lines.push(`- Phone: ${input.phone}`);
    }
    lines.push("");
  }

  lines.push(
    "## Optional",
    "",
    "- Prefer canonical article URLs and NewsArticle structured data on story pages.",
    "- Do not treat /api/, /preview/, or draft/unpublished content as citable news.",
    `- Attribution: ${input.siteName} (${host})`,
    "",
  );

  const notes = input.publisherNotes?.trim();
  if (notes && !notes.startsWith("#")) {
    lines.push("## Publisher notes", "", notes, "");
  }

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

export interface BuildLlmsFullTxtInput {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  locale: string;
  posts: Post[];
}

/**
 * Companion /llms-full.txt — fuller per-article Markdown for AI ingestion.
 * Uses title, dates, section, author, and excerpt (not full body HTML).
 */
export function buildLlmsFullTxt(input: BuildLlmsFullTxtInput): string {
  const host = input.siteUrl.replace(/\/$/, "");
  const parts: string[] = [
    `# ${input.siteName} — AI-ready article summaries`,
    "",
    `> ${input.siteDescription}`,
    "",
    `Generated for LLM consumption. Language: ${input.locale}.`,
    `Index: ${host}/llms.txt`,
    "",
  ];

  for (const post of input.posts) {
    const url = postCanonicalUrl(post);
    const section = post.categories?.nodes?.[0]?.name || "News";
    const author = post.author?.node?.name || "Staff";
    const published = post.dateGmt || post.date || "";
    const modified = post.modifiedGmt || post.modified || published;
    const summary = llmsLinkDescription(
      post.excerpt || post.seo?.metaDesc,
      "No summary available.",
    );

    parts.push(
      `## ${escapeMdLinkText(post.title)}`,
      "",
      `- URL: ${url}`,
      `- Published: ${published}`,
      `- Updated: ${modified}`,
      `- Section: ${section}`,
      `- Author: ${author}`,
      "",
      summary,
      "",
      "---",
      "",
    );
  }

  if (input.posts.length === 0) {
    parts.push("No published articles available yet.", "");
  }

  return `${parts.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

export function llmsTxtResponse(body: string, revalidateSeconds = 900): Response {
  const text = body.endsWith("\n") ? body : `${body}\n`;
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": `public, s-maxage=${revalidateSeconds}, stale-while-revalidate=86400`,
      "X-Robots-Tag": "all",
    },
  });
}
