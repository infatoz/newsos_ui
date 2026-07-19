import type { LiveStream } from "@/types";
import { Badge } from "@/components/atoms/Badge";
import { VideoEmbed } from "@/components/molecules/VideoEmbed";
import { cn } from "@/lib/utils";

export interface LiveTvWidgetProps {
  stream?: LiveStream | null;
  title?: string;
  className?: string;
}

export function LiveTvWidget({
  stream,
  title = "Live TV",
  className,
}: LiveTvWidgetProps) {
  if (!stream) {
    return (
      <aside
        className={cn(
          "border border-[var(--np-border)] bg-[var(--np-surface)] p-4",
          className,
        )}
      >
        <h2 className="mb-2 font-heading text-sm font-bold uppercase tracking-wider text-[var(--np-primary)]">
          {title}
        </h2>
        <p className="text-sm text-[var(--np-muted)]">No live stream right now.</p>
      </aside>
    );
  }

  const embedSrc = stream.embedUrl ?? stream.streamUrl ?? "";

  return (
    <aside className={cn("overflow-hidden bg-black", className)}>
      <div className="flex items-center justify-between gap-2 bg-[var(--np-primary)] px-3 py-2">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
          {title}
        </h2>
        {stream.isLive ? <Badge variant="live">On air</Badge> : null}
      </div>
      {embedSrc ? (
        <VideoEmbed
          src={embedSrc}
          title={stream.title}
          provider={stream.provider}
        />
      ) : (
        <div className="flex aspect-video items-center justify-center text-sm text-white/70">
          Stream unavailable
        </div>
      )}
      <div className="bg-[var(--np-surface)] p-3">
        <p className="text-sm font-semibold text-[var(--np-primary)]">
          {stream.title}
        </p>
        {stream.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-[var(--np-muted)]">
            {stream.description}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
