"use client";

import { useState } from "react";
import type { Poll } from "@/types";
import { PollWidget } from "@/components/organisms/PollWidget";
import { applyPollVoteResults } from "@/utils/poll";
import { cn } from "@/lib/utils";

export interface PollEmbedProps {
  poll: Poll;
  className?: string;
}

/**
 * Interactive in-article / standalone poll with client-side voting.
 */
export function PollEmbed({ poll: initial, className }: PollEmbedProps) {
  const [poll, setPoll] = useState(initial);

  async function handleVote(optionIds: string[]) {
    const pollId = poll.databaseId;
    if (!pollId) {
      throw new Error("Missing poll id");
    }

    const res = await fetch(`/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choiceIds: optionIds }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      results?: string | Record<string, number>;
      totalVotes?: number;
      message?: string;
    };

    if (!res.ok || data.success === false) {
      throw new Error(data.message || "Vote failed");
    }

    setPoll(
      applyPollVoteResults(
        poll,
        data.results ?? {},
        Number(data.totalVotes ?? poll.totalVotes + 1),
      ),
    );
  }

  return (
    <div className={cn("not-prose my-8", className)} data-enm-poll-embed>
      <PollWidget poll={poll} onVote={handleVote} />
    </div>
  );
}
