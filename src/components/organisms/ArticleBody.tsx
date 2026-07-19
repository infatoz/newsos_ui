import type { ReactNode } from "react";
import { AdSlot } from "@/components/atoms/AdSlot";
import { InArticleRelated } from "@/components/molecules/InArticleRelated";
import { PollSlot } from "@/components/organisms/PollSlot";
import type { Ad, Poll, Post, RelatedPost } from "@/types";
import { enhanceArticleImageCaptions } from "@/utils/caption";
import { enhanceArticleBodyImages } from "@/utils/images";
import { normalizePollMarkersInHtml } from "@/utils/poll";
import { cn } from "@/lib/utils";

export interface ArticleBodyProps {
  html: string;
  className?: string;
  /** Ads keyed by marker id, e.g. `<!--ad:mid-->` → ad */
  adSlots?: Record<string, Ad | null | undefined>;
  /** Prefetched polls keyed by database ID for `<!--enm-poll:ID-->` markers. */
  polls?: Record<number, Poll | null | undefined>;
  /** Auto-injected in-article ads (placement: article / infeed). */
  inArticleAds?: Ad[];
  /** Related stories for mid-content “Also read” inserts. */
  midRelated?: Array<RelatedPost | Post>;
  /**
   * Insert related after these 1-based paragraph/block indices.
   * Default: after 2nd block.
   */
  relatedAfterBlocks?: number[];
  /**
   * Insert ads after these 1-based paragraph/block indices.
   * Default: after 4th and 8th blocks.
   */
  adAfterBlocks?: number[];
  /** How many related posts per mid insert. Default 2. */
  relatedPerInsert?: number;
}

type HtmlPart = { type: "html"; value: string };
type MarkerAdPart = { type: "marker-ad"; id: string };
type MarkerPollPart = { type: "marker-poll"; id: number };
type AutoAdPart = { type: "auto-ad"; ad: Ad };
type RelatedPart = { type: "related"; posts: Array<RelatedPost | Post> };
type Part = HtmlPart | MarkerAdPart | MarkerPollPart | AutoAdPart | RelatedPart;

/**
 * Split HTML into block-level chunks (paragraphs, headings, lists, etc.).
 */
export function splitHtmlIntoBlocks(html: string): string[] {
  const trimmed = html.trim();
  if (!trimmed) return [];

  const tokens = trimmed.split(
    /(<\/(?:p|h[1-6]|blockquote|ul|ol|figure|table|pre|section|aside|hr)>)/i,
  );
  const blocks: string[] = [];

  for (let i = 0; i < tokens.length; i += 2) {
    const chunk = `${tokens[i] || ""}${tokens[i + 1] || ""}`;
    if (chunk.trim()) blocks.push(chunk);
  }

  return blocks.length > 0 ? blocks : [trimmed];
}

type ContentMarker = HtmlPart | MarkerAdPart | MarkerPollPart;

function splitByContentMarkers(html: string): ContentMarker[] {
  const parts: ContentMarker[] = [];
  let lastIndex = 0;
  const combined = /<!--\s*(?:ad:([\w-]+)|enm-poll:(\d+))\s*-->/gi;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "html", value: html.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      parts.push({ type: "marker-ad", id: match[1] });
    } else if (match[2]) {
      parts.push({ type: "marker-poll", id: Number(match[2]) });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    parts.push({ type: "html", value: html.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: "html", value: html });
  }

  return parts;
}

/**
 * Renders article HTML as prose with CLS-safe mid-content ads, polls, and related cards.
 */
export function ArticleBody({
  html,
  className,
  adSlots = {},
  polls = {},
  inArticleAds = [],
  midRelated = [],
  relatedAfterBlocks = [2],
  adAfterBlocks = [4, 8],
  relatedPerInsert = 2,
}: ArticleBodyProps) {
  if (!html?.trim()) {
    return (
      <p className="text-sm text-[var(--np-muted)]">Content unavailable.</p>
    );
  }

  const normalized = enhanceArticleBodyImages(
    enhanceArticleImageCaptions(normalizePollMarkersInHtml(html)),
  );
  const markerParts = splitByContentMarkers(normalized);
  const relatedSet = new Set(relatedAfterBlocks);
  const adSet = new Set(adAfterBlocks);

  const parts: Part[] = [];
  let blockCount = 0;
  let relatedCursor = 0;
  let adCursor = 0;
  const usedRelatedIds = new Set<string>();

  const takeRelated = (): Array<RelatedPost | Post> => {
    const batch: Array<RelatedPost | Post> = [];
    while (
      batch.length < relatedPerInsert &&
      relatedCursor < midRelated.length
    ) {
      const item = midRelated[relatedCursor++];
      if (!item || usedRelatedIds.has(item.id)) continue;
      usedRelatedIds.add(item.id);
      batch.push(item);
    }
    return batch;
  };

  const takeAd = (): Ad | null => {
    while (adCursor < inArticleAds.length) {
      const ad = inArticleAds[adCursor++];
      if (ad?.isActive) return ad;
    }
    return null;
  };

  for (const part of markerParts) {
    if (part.type === "marker-ad" || part.type === "marker-poll") {
      parts.push(part);
      continue;
    }

    const blocks = splitHtmlIntoBlocks(part.value);
    for (const block of blocks) {
      parts.push({ type: "html", value: block });
      blockCount += 1;

      if (relatedSet.has(blockCount) && midRelated.length > 0) {
        const batch = takeRelated();
        if (batch.length) {
          parts.push({ type: "related", posts: batch });
        }
      }

      if (adSet.has(blockCount) && inArticleAds.length > 0) {
        const ad = takeAd();
        if (ad) {
          parts.push({ type: "auto-ad", ad });
        }
      }
    }
  }

  // If the article is short, still try one related + one ad after all content.
  if (blockCount > 0 && blockCount < 2 && midRelated.length > 0) {
    const batch = takeRelated();
    if (batch.length) parts.push({ type: "related", posts: batch });
  }
  if (blockCount > 0 && blockCount < 4 && inArticleAds.length > 0) {
    const alreadyAuto = parts.some((p) => p.type === "auto-ad");
    if (!alreadyAuto) {
      const ad = takeAd();
      if (ad) parts.push({ type: "auto-ad", ad });
    }
  }

  return (
    <div
      data-article-body
      className={cn(
        "np-prose prose prose-neutral max-w-none",
        "prose-headings:font-heading prose-headings:text-[var(--np-primary)]",
        "prose-a:text-[var(--np-accent)] prose-img:rounded-sm",
        "text-[var(--np-text)]",
        className,
      )}
    >
      {parts.map((part, i) => {
        if (part.type === "marker-ad") {
          const ad = adSlots[part.id];
          if (!ad) return null;
          return (
            <InArticleAdWrap key={`marker-ad-${part.id}-${i}`}>
              <AdSlot ad={ad} lazy />
            </InArticleAdWrap>
          );
        }

        if (part.type === "marker-poll") {
          return (
            <PollSlot
              key={`poll-${part.id}-${i}`}
              pollId={part.id}
              poll={polls[part.id] ?? null}
            />
          );
        }

        if (part.type === "auto-ad") {
          return (
            <InArticleAdWrap key={`auto-ad-${part.ad.id}-${i}`}>
              <AdSlot ad={part.ad} lazy />
            </InArticleAdWrap>
          );
        }

        if (part.type === "related") {
          return (
            <InArticleRelated
              key={`related-${i}`}
              posts={part.posts}
            />
          );
        }

        return (
          <div
            key={`html-${i}`}
            dangerouslySetInnerHTML={{ __html: part.value }}
          />
        );
      })}
    </div>
  );
}

function InArticleAdWrap({ children }: { children: ReactNode }) {
  return (
    <div
      className="not-prose my-8 flex justify-center"
      data-in-article-ad
    >
      {children}
    </div>
  );
}

/** IDs already shown mid-article (for footer dedupe). */
export function getMidRelatedIds(
  midRelated: Array<RelatedPost | Post>,
  relatedAfterBlocks: number[] = [2],
  relatedPerInsert = 2,
): Set<string> {
  const ids = new Set<string>();
  let cursor = 0;
  for (let i = 0; i < relatedAfterBlocks.length; i++) {
    let taken = 0;
    while (taken < relatedPerInsert && cursor < midRelated.length) {
      const item = midRelated[cursor++];
      if (!item || ids.has(item.id)) continue;
      ids.add(item.id);
      taken += 1;
    }
  }
  return ids;
}
