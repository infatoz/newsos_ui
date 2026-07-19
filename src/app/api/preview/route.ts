import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Enable / disable Next.js draft mode for CMS preview.
 * GET /api/preview?secret=TOKEN&slug=article-slug&path=/article/slug
 * GET /api/preview?secret=TOKEN&disable=1
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const secret = searchParams.get("secret");
  const expected = process.env.PREVIEW_SECRET;
  const disable = searchParams.get("disable") === "1";

  if (!expected || secret !== expected) {
    return NextResponse.json({ message: "Invalid preview secret" }, { status: 401 });
  }

  const draft = await draftMode();

  if (disable) {
    draft.disable();
    return NextResponse.redirect(new URL("/", request.url));
  }

  draft.enable();

  const path =
    searchParams.get("path") ||
    (searchParams.get("slug")
      ? `/article/${searchParams.get("slug")}`
      : "/");

  return NextResponse.redirect(new URL(path, request.url));
}
