import {
  StoryCard,
  type WebStoryItem,
} from "@/components/molecules/StoryCard";
import { cn } from "@/lib/utils";

export interface WebStoriesRailProps {
  stories: WebStoryItem[];
  title?: string;
  className?: string;
}

export function WebStoriesRail({
  stories,
  title = "Web stories",
  className,
}: WebStoriesRailProps) {
  return (
    <section className={cn("py-4", className)} aria-labelledby="web-stories-heading">
      <h2
        id="web-stories-heading"
        className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-[var(--np-primary)]"
      >
        {title}
      </h2>
      {stories.length === 0 ? (
        <p className="text-sm text-[var(--np-muted)]">No web stories available.</p>
      ) : (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-thin">
          {stories.map((story, i) => (
            <StoryCard key={story.id} story={story} priority={i < 2} />
          ))}
        </div>
      )}
    </section>
  );
}
