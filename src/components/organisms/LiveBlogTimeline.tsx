import type { LiveBlog, LiveUpdate } from "@/types";
import { Badge } from "@/components/atoms/Badge";
import { Timestamp } from "@/components/atoms/Timestamp";
import { cn } from "@/lib/utils";

export interface LiveBlogTimelineProps {
  liveBlog: LiveBlog;
  className?: string;
  /** When true, omit the page title header (use page-level heading instead). */
  hideHeader?: boolean;
}

function UpdateCard({ update }: { update: LiveUpdate }) {
  return (
    <li
      id={`update-${update.id}`}
      itemScope
      itemType="https://schema.org/BlogPosting"
      className={cn(
        "relative border-l-2 border-[var(--np-border)] pl-4 pb-8 last:pb-0 scroll-mt-24",
        update.isPinned && "border-l-[var(--np-accent)]",
      )}
    >
      <meta itemProp="url" content={`#update-${update.id}`} />
      <span
        className={cn(
          "absolute top-1.5 -left-[5px] size-2 rounded-full bg-[var(--np-border)]",
          update.isPinned && "bg-[var(--np-accent)]",
          "ring-4 ring-[var(--np-surface)]",
        )}
        aria-hidden
      />
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Timestamp
          date={update.publishedAt}
          className="font-semibold text-[var(--np-accent)]"
        />
        <meta itemProp="datePublished" content={update.publishedAt} />
        {update.isPinned ? <Badge variant="breaking">Key update</Badge> : null}
        {update.author?.name ? (
          <span
            className="text-xs text-[var(--np-muted)]"
            itemProp="author"
            itemScope
            itemType="https://schema.org/Person"
          >
            <span itemProp="name">{update.author.name}</span>
          </span>
        ) : null}
      </div>
      {update.title ? (
        <h3
          className="mb-1 font-heading text-base font-bold text-[var(--np-primary)]"
          itemProp="headline"
        >
          {update.title}
        </h3>
      ) : null}
      <div
        className="text-sm leading-relaxed text-[var(--np-text)] [&_a]:text-[var(--np-accent)] [&_p]:mb-2"
        itemProp="articleBody"
        dangerouslySetInnerHTML={{ __html: update.content }}
      />
      {update.embeds?.length ? (
        <ul className="mt-3 flex flex-col gap-3">
          {update.embeds.map((embed, i) => (
            <li key={i}>
              {embed.html ? (
                <div dangerouslySetInnerHTML={{ __html: embed.html }} />
              ) : embed.url && embed.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={embed.url}
                  alt={embed.caption ?? ""}
                  className="max-w-full"
                  itemProp="image"
                />
              ) : embed.url ? (
                <a
                  href={embed.url}
                  className="text-sm text-[var(--np-accent)]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {embed.caption ?? embed.url}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function LiveBlogTimeline({
  liveBlog,
  className,
  hideHeader = false,
}: LiveBlogTimelineProps) {
  const updates = liveBlog.updates ?? [];

  return (
    <section
      className={cn("", className)}
      aria-labelledby={hideHeader ? "live-updates-heading" : "live-blog-title"}
    >
      {!hideHeader ? (
        <header className="mb-6 flex flex-wrap items-center gap-3 border-b border-[var(--np-border)] pb-4">
          {liveBlog.isLive ? <Badge variant="live">Live</Badge> : null}
          <h1
            id="live-blog-title"
            className="font-heading text-2xl font-bold text-[var(--np-primary)] md:text-3xl"
          >
            {liveBlog.title}
          </h1>
        </header>
      ) : (
        <h2
          id="live-updates-heading"
          className="mb-4 font-heading text-xl font-bold text-[var(--np-primary)]"
        >
          Updates
        </h2>
      )}

      {!hideHeader && liveBlog.summary ? (
        <p className="mb-6 text-[var(--np-muted)]">{liveBlog.summary}</p>
      ) : null}

      {updates.length === 0 ? (
        <p className="text-sm text-[var(--np-muted)]">
          No updates yet. Check back shortly.
        </p>
      ) : (
        <ol className="list-none">
          {updates.map((update) => (
            <UpdateCard key={update.id} update={update} />
          ))}
        </ol>
      )}
    </section>
  );
}
