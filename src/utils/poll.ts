import type { Poll } from "@/types";

/** Apply vote API results onto a Poll for UI refresh after voting. */
export function applyPollVoteResults(
  poll: Poll,
  results: Record<string, number> | string,
  totalVotes: number,
): Poll {
  let parsed: Record<string, number> = {};
  if (typeof results === "string") {
    try {
      const raw = JSON.parse(results) as unknown;
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        parsed = Object.fromEntries(
          Object.entries(raw as Record<string, unknown>).map(([k, v]) => [
            k,
            Number(v) || 0,
          ]),
        );
      }
    } catch {
      parsed = {};
    }
  } else {
    parsed = results;
  }

  const options = poll.options.map((opt) => {
    const votes = Number(parsed[opt.id] ?? opt.votes);
    return {
      ...opt,
      votes,
      percentage:
        totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0,
    };
  });

  return { ...poll, options, totalVotes };
}

/** Poll IDs embedded via `[enm_poll]` shortcode markers in post HTML. */
export function extractPollIdsFromHtml(html: string): number[] {
  if (!html) return [];
  const ids = new Set<number>();
  const patterns = [
    /<!--\s*enm-poll:(\d+)\s*-->/gi,
    /data-enm-poll-id=["']?(\d+)/gi,
    /\[enm_poll\b[^\]]*?\bid\s*=\s*(?:&quot;|&#0?39;|&#34;|["'])?(\d+)/gi,
  ];
  for (const re of patterns) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(html)) !== null) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > 0) ids.add(n);
    }
  }
  return [...ids];
}

/**
 * Collapse shortcode HTML (`<!--enm-poll:ID--><aside…>`) into a single marker.
 * Also converts leftover `[enm_poll id="…"]` tags if content was not rendered.
 */
export function normalizePollMarkersInHtml(html: string): string {
  return html
    .replace(
      /<!--\s*enm-poll:(\d+)\s*-->\s*<aside\b[^>]*\bdata-enm-poll-id=["']?\1["']?[^>]*>[\s\S]*?<\/aside>/gi,
      "<!--enm-poll:$1-->",
    )
    .replace(
      /<aside\b[^>]*\bdata-enm-poll-id=["']?(\d+)["']?[^>]*>[\s\S]*?<\/aside>/gi,
      "<!--enm-poll:$1-->",
    )
    .replace(
      /\[enm_poll\b[^\]]*?\bid\s*=\s*(?:&quot;|&#0?39;|&#34;|["'])?(\d+)(?:&quot;|&#0?39;|&#34;|["'])?[^\]]*\]/gi,
      "<!--enm-poll:$1-->",
    )
    .replace(
      /<!--\s*wp:shortcode\s*-->\s*\[enm_poll\b[^\]]*?\bid\s*=\s*(?:&quot;|&#0?39;|&#34;|["'])?(\d+)(?:&quot;|&#0?39;|&#34;|["'])?[^\]]*\]\s*<!--\s*\/wp:shortcode\s*-->/gi,
      "<!--enm-poll:$1-->",
    );
}
