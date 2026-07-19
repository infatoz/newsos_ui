import { NextResponse } from "next/server";
import { pwaIconPath } from "@/utils/pwa-icons";

export const dynamic = "force-static";

const ALLOWED = new Set([192, 512]);

/**
 * Backward-compatible route for old manifest URLs (`/icons/icon/192`).
 * Redirects to static PNGs — no sharp dependency (avoids Turbopack 500s).
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

  return NextResponse.redirect(
    new URL(pwaIconPath(size as 192 | 512), _req.url),
    308,
  );
}
