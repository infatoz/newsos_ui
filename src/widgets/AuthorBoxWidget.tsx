import Image from "next/image";
import Link from "next/link";
import type { Author } from "@/types";
import { cn, stripHtml } from "@/lib/utils";
import {
  SocialLinks,
  authorSocialToLinks,
} from "@/components/molecules/SocialLinks";

export interface AuthorBoxWidgetProps {
  author: Pick<
    Author,
    "id" | "name" | "slug" | "uri" | "avatar" | "description" | "social"
  > | null;
  title?: string;
  className?: string;
}

export function AuthorBoxWidget({
  author,
  title = "About the author",
  className,
}: AuthorBoxWidgetProps) {
  if (!author?.name) return null;

  const href = author.uri || (author.slug ? `/author/${author.slug}` : null);
  const avatar = author.avatar?.url;
  const bio = stripHtml(author.description || "");
  const socialLinks = authorSocialToLinks(author.social);

  const inner = (
    <>
      {avatar ? (
        <Image
          src={avatar}
          alt={author.name}
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--np-border)] text-lg font-bold text-[var(--np-muted)]">
          {author.name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="font-heading text-sm font-bold text-[var(--np-primary)]">
          {author.name}
        </p>
        {bio ? (
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--np-muted)]">
            {bio}
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <aside
      className={cn(
        "border border-[var(--np-border)] bg-[var(--np-surface)] p-4",
        className,
      )}
    >
      <h2 className="mb-3 border-b border-[var(--np-border)] pb-2 font-heading text-sm font-bold uppercase tracking-wider text-[var(--np-primary)]">
        {title}
      </h2>
      {href ? (
        <Link href={href} className="flex gap-3 hover:opacity-90">
          {inner}
        </Link>
      ) : (
        <div className="flex gap-3">{inner}</div>
      )}
      <SocialLinks
        className="mt-3"
        size="sm"
        links={socialLinks}
        fallbackToTheme={false}
        hideEmpty
      />
    </aside>
  );
}
