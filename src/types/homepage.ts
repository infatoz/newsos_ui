import type { Ad, AdPlacement } from "./ads";
import type {
  BreakingNews,
  Category,
  LiveBlog,
  LiveStream,
  Poll,
  Post,
  RelatedPost,
  Story,
} from "./content";
import type { MobileNavItem } from "./navigation";

export type HomepageBlockType =
  | "hero"
  | "breaking"
  | "top-stories"
  | "section-rail"
  | "opinion"
  | "video"
  | "live"
  | "live-blog"
  | "poll"
  | "most-read"
  | "editors-picks"
  | "photo-gallery"
  | "newsletter"
  | "ad"
  | "custom"
  | string;

export interface HomepageBlockBase {
  id: string;
  type: HomepageBlockType;
  title?: string | null;
  subtitle?: string | null;
  order: number;
  isVisible?: boolean;
  viewAllHref?: string | null;
  /**
   * Column width for Google News / TOI-style packing:
   * full | half (1/2) | third (1/3) | two-thirds (2/3).
   */
  layoutWidth?: "full" | "half" | "third" | "two-thirds";
  /** Card presentation inside the section. */
  cardLayout?: "grid" | "list" | "magazine" | "horizontal";
}

export interface HeroHomepageBlock extends HomepageBlockBase {
  type: "hero";
  featured: Story | RelatedPost | Post;
  secondary?: Array<Story | RelatedPost | Post>;
}

export interface BreakingHomepageBlock extends HomepageBlockBase {
  type: "breaking";
  items: BreakingNews[];
}

export interface TopStoriesHomepageBlock extends HomepageBlockBase {
  type: "top-stories";
  stories: Array<Story | RelatedPost | Post>;
  layout?: "grid" | "list" | "magazine" | string;
}

export interface SectionRailHomepageBlock extends HomepageBlockBase {
  type: "section-rail";
  category?: Pick<Category, "id" | "name" | "slug" | "uri"> | null;
  stories: Array<Story | RelatedPost | Post>;
  layout?: "horizontal" | "vertical" | "cards" | string;
}

export interface OpinionHomepageBlock extends HomepageBlockBase {
  type: "opinion";
  stories: Array<Story | RelatedPost | Post>;
}

export interface VideoHomepageBlock extends HomepageBlockBase {
  type: "video";
  stream?: LiveStream | null;
  videos?: Array<{
    id: string;
    title: string;
    href: string;
    thumbnailUrl?: string | null;
    duration?: string | null;
  }>;
}

export interface LiveHomepageBlock extends HomepageBlockBase {
  type: "live";
  stream: LiveStream;
}

export interface LiveBlogHomepageBlock extends HomepageBlockBase {
  type: "live-blog";
  liveBlog: LiveBlog;
}

export interface PollHomepageBlock extends HomepageBlockBase {
  type: "poll";
  poll: Poll;
}

export interface MostReadHomepageBlock extends HomepageBlockBase {
  type: "most-read";
  stories: Array<Story | RelatedPost | Post>;
  period?: "24h" | "7d" | "30d" | string;
}

export interface EditorsPicksHomepageBlock extends HomepageBlockBase {
  type: "editors-picks";
  stories: Array<Story | RelatedPost | Post>;
}

export interface PhotoGalleryHomepageBlock extends HomepageBlockBase {
  type: "photo-gallery";
  albums: Array<{
    id: string;
    title: string;
    href: string;
    coverUrl?: string | null;
    photoCount?: number | null;
  }>;
}

export interface NewsletterHomepageBlock extends HomepageBlockBase {
  type: "newsletter";
  heading?: string | null;
  description?: string | null;
  ctaLabel?: string | null;
  formAction?: string | null;
}

export interface AdHomepageBlock extends HomepageBlockBase {
  type: "ad";
  placement?: AdPlacement | null;
  ad?: Ad | null;
  /** Builder override; 0/null inherits from Ad CPT. */
  slotWidth?: number | null;
  slotHeight?: number | null;
  slotWidthMobile?: number | null;
  slotHeightMobile?: number | null;
}

export interface CustomHomepageBlock extends HomepageBlockBase {
  type: "custom";
  payload?: Record<string, unknown> | null;
}

export type HomepageBlock =
  | HeroHomepageBlock
  | BreakingHomepageBlock
  | TopStoriesHomepageBlock
  | SectionRailHomepageBlock
  | OpinionHomepageBlock
  | VideoHomepageBlock
  | LiveHomepageBlock
  | LiveBlogHomepageBlock
  | PollHomepageBlock
  | MostReadHomepageBlock
  | EditorsPicksHomepageBlock
  | PhotoGalleryHomepageBlock
  | NewsletterHomepageBlock
  | AdHomepageBlock
  | CustomHomepageBlock;

export interface HomepagePayload {
  blocks: HomepageBlock[];
  breaking?: BreakingNews[];
  mobileNav?: MobileNavItem[];
  updatedAt?: string | null;
}
