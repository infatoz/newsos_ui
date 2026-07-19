import { NextResponse } from "next/server";
import { getPollById } from "@/services/content.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const pollId = Number(id);
  if (!Number.isFinite(pollId) || pollId < 1) {
    return NextResponse.json({ message: "Invalid poll id" }, { status: 400 });
  }

  try {
    const poll = await getPollById(pollId, { revalidate: 30 });
    if (!poll) {
      return NextResponse.json({ message: "Poll not found" }, { status: 404 });
    }
    return NextResponse.json(poll);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load poll";
    return NextResponse.json({ message }, { status: 502 });
  }
}
