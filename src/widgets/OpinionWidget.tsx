import Image from "next/image";
import Link from "next/link";
import type { Post, RelatedPost, Story } from "@/types";
import { cn } from "@/lib/utils";
import { getImageSizes } from "@/utils/images";

export interface OpinionWidgetProps {
  stories: Array<Story | RelatedPost | Post>;
  title?: string;
  className?: string;
}

function hrefOf(s: Story | RelatedPost | Post): string {
  if ("href" in s && s.href) return s.href;
  if ("uri" in s && s.uri) return s.uri;
  return `/${s.slug}`;
}

function authorOf(s: Story | RelatedPost | Post): {
  name?: string;
  avatar?: string | null;
} {
  if ("author" in s && s.author) {
    if ("node" in s.author && s.author.node) {
      return {
        name: s.author.node.name,
        avatar: s.author.node.avatar?.url,
      };
    }
    if ("name" in s.author) {
      return {
        name: s.author.name,
        avatar: s.author.avatar?.url,
      };
    }
  }
  return {};
}

export function OpinionWidget({
  stories,
  title = "Opinion",
  className,
}: OpinionWidgetProps) {
  return (
    <aside className={cn("", className)}>
      <h2 className="mb-3 border-b border-[var(--np-border)] pb-2 font-heading text-sm font-bold uppercase tracking-wider text-[var(--np-primary)]">
        {title}
      </h2>
      {stories.length === 0 ? (
        <p className="text-sm text-[var(--np-muted)]">No opinion pieces.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {stories.map((story) => {
            const author = authorOf(story);
            const avatarSizes = author.avatar
              ? getImageSizes(author.avatar, "avatar")
              : null;
            return (
              <li key={story.id} className="flex gap-3">
                {avatarSizes ? (
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-[var(--np-border)]">
                    <Image
                      src={avatarSizes.src}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="min-w-0">
                  <Link
                    href={hrefOf(story)}
                    className="font-heading text-base font-semibold italic leading-snug text-[var(--np-primary)] hover:text-[var(--np-accent)]"
                  >
                    {story.title}
                  </Link>
                  {author.name ? (
                    <p className="mt-1 text-xs font-medium text-[var(--np-muted)]">
                      {author.name}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
