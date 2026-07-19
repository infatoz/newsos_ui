import Image from "next/image";
import Link from "next/link";
import type { Author } from "@/types";
import { Timestamp } from "@/components/atoms/Timestamp";
import { cn } from "@/lib/utils";
import { getImageSizes } from "@/utils/images";

export interface AuthorBylineProps {
  author?: Pick<
    Author,
    "id" | "name" | "slug" | "uri" | "avatar" | "description"
  > | null;
  /** Override display name (e.g. custom byline). */
  byline?: string | null;
  publishedAt?: string | null;
  modifiedAt?: string | null;
  className?: string;
  showAvatar?: boolean;
}

export function AuthorByline({
  author,
  byline,
  publishedAt,
  modifiedAt,
  className,
  showAvatar = true,
}: AuthorBylineProps) {
  const name = byline?.trim() || author?.name;
  if (!name) return null;

  const href = author?.uri ?? (author?.slug ? `/author/${author.slug}` : undefined);
  const avatarUrl = author?.avatar?.url;
  const avatarSizes = avatarUrl
    ? getImageSizes(avatarUrl, "avatar")
    : null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-y border-[var(--np-border)] py-3",
        className,
      )}
    >
      {showAvatar && avatarUrl && avatarSizes ? (
        <Link
          href={href ?? "#"}
          className="relative size-10 shrink-0 overflow-hidden rounded-full bg-[var(--np-border)]"
          tabIndex={href ? undefined : -1}
        >
          <Image
            src={avatarSizes.src}
            alt=""
            fill
            sizes="40px"
            className="object-cover"
          />
        </Link>
      ) : null}
      <div className="min-w-0 flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-[var(--np-primary)]">
          {href ? (
            <Link href={href} className="hover:text-[var(--np-accent)]">
              {name}
            </Link>
          ) : (
            name
          )}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--np-muted)]">
          {publishedAt ? (
            <>
              <span>Published</span>
              <Timestamp date={publishedAt} />
            </>
          ) : null}
          {modifiedAt && modifiedAt !== publishedAt ? (
            <>
              <span aria-hidden>·</span>
              <span>Updated</span>
              <Timestamp date={modifiedAt} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
