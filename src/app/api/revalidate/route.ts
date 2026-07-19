import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * On-demand ISR revalidation.
 * POST /api/revalidate?secret=TOKEN
 * Body: { paths?: string[], tags?: string[] }
 */
export async function POST(request: NextRequest) {
  const secret =
    request.nextUrl.searchParams.get("secret") ||
    request.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  let paths: string[] = [];
  let tags: string[] = [];

  try {
    const body = (await request.json()) as {
      paths?: string[];
      tags?: string[];
      path?: string;
      tag?: string;
    };
    paths = body.paths ?? (body.path ? [body.path] : []);
    tags = body.tags ?? (body.tag ? [body.tag] : []);
  } catch {
    // Allow query-only: ?path=/&tag=posts
    const path = request.nextUrl.searchParams.get("path");
    const tag = request.nextUrl.searchParams.get("tag");
    if (path) paths = [path];
    if (tag) tags = [tag];
  }

  if (!paths.length && !tags.length) {
    return NextResponse.json(
      { message: "Provide paths and/or tags to revalidate" },
      { status: 400 },
    );
  }

  const revalidated: { paths: string[]; tags: string[] } = {
    paths: [],
    tags: [],
  };

  for (const path of paths) {
    revalidatePath(path);
    revalidated.paths.push(path);
  }

  for (const tag of tags) {
    revalidateTag(tag, "max");
    revalidated.tags.push(tag);
  }

  return NextResponse.json({
    revalidated: true,
    now: Date.now(),
    ...revalidated,
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
