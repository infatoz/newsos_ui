import { NextResponse } from "next/server";
import { VOTE_POLL } from "@/graphql";
import { fetchMutation } from "@/services/graphql.helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type VotePollResult = {
  votePoll?: {
    vote?: {
      success: boolean;
      pollId: number;
      results: string;
      totalVotes: number;
      message?: string | null;
    } | null;
  } | null;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const pollId = Number(id);
  if (!Number.isFinite(pollId) || pollId < 1) {
    return NextResponse.json({ message: "Invalid poll id" }, { status: 400 });
  }

  let choiceIds: string[] = [];
  try {
    const body = (await request.json()) as { choiceIds?: unknown };
    if (Array.isArray(body.choiceIds)) {
      choiceIds = body.choiceIds.map(String).filter(Boolean);
    }
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  if (!choiceIds.length) {
    return NextResponse.json(
      { message: "choiceIds required" },
      { status: 400 },
    );
  }

  try {
    const data = await fetchMutation<VotePollResult>(VOTE_POLL, {
      input: { pollId, choiceIds },
    });
    const vote = data.votePoll?.vote;
    if (!vote?.success) {
      return NextResponse.json(
        {
          success: false,
          message: vote?.message || "Could not record vote",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(vote);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Vote request failed";
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
