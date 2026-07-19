import {
  AuthorBoxWidget,
  CustomHtmlWidget,
  MostReadWidget,
  NewsletterWidget,
  PopularTagsWidget,
  SidebarAdsWidget,
  TrendingWidget,
} from "@/widgets";
import type { ArticleSidebarWidget } from "@/types/article-sidebar";
import { cn } from "@/lib/utils";

export interface ArticleSidebarProps {
  widgets: ArticleSidebarWidget[];
  className?: string;
}

function renderWidget(widget: ArticleSidebarWidget) {
  switch (widget.type) {
    case "related":
    case "latest":
    case "category":
      if (!("posts" in widget) || !widget.posts?.length) return null;
      return (
        <MostReadWidget
          key={widget.id}
          stories={widget.posts}
          title={widget.title}
        />
      );
    case "trending":
      if (!("posts" in widget) || !widget.posts?.length) return null;
      return (
        <TrendingWidget
          key={widget.id}
          stories={widget.posts}
          title={widget.title}
        />
      );
    case "most_read":
      if (!("posts" in widget) || !widget.posts?.length) return null;
      return (
        <MostReadWidget
          key={widget.id}
          stories={widget.posts}
          title={widget.title}
          period={widget.config.period}
        />
      );
    case "author_box":
      if (!("author" in widget)) return null;
      return (
        <AuthorBoxWidget
          key={widget.id}
          author={widget.author}
          title={widget.title}
        />
      );
    case "popular_tags":
      if (!("tags" in widget) || !widget.tags?.length) return null;
      return (
        <PopularTagsWidget
          key={widget.id}
          tags={widget.tags}
          title={widget.title}
        />
      );
    case "newsletter":
      return (
        <NewsletterWidget
          key={widget.id}
          heading={widget.title}
          description={widget.config.description}
          ctaLabel={widget.config.ctaLabel}
        />
      );
    case "ad":
      if (!("ads" in widget) || !widget.ads?.length) return null;
      return <SidebarAdsWidget key={widget.id} ads={widget.ads} />;
    case "custom_html":
      if (!("html" in widget)) return null;
      return (
        <CustomHtmlWidget
          key={widget.id}
          html={widget.html}
          title={widget.title}
        />
      );
    default:
      return null;
  }
}

/**
 * Renders the configurable article detail sidebar stack from ENM builder.
 */
export function ArticleSidebar({ widgets, className }: ArticleSidebarProps) {
  if (!widgets.length) return null;

  return (
    <div
      className={cn("space-y-6 lg:sticky lg:top-24 lg:self-start", className)}
      role="complementary"
      aria-label="Article sidebar"
    >
      {widgets.map((widget) => (
        <div key={widget.id}>{renderWidget(widget)}</div>
      ))}
    </div>
  );
}
