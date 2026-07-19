import type {
  ContentStatus,
  SEOFields,
  WPConnection,
  WPNode,
} from "./wordpress";

export interface MediaSize {
  name?: string | null;
  sourceUrl: string;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
}

export interface Media extends WPNode {
  __typename?: "MediaItem";
  altText?: string | null;
  caption?: string | null;
  description?: string | null;
  title?: string | null;
  sourceUrl: string;
  mediaItemUrl?: string | null;
  mimeType?: string | null;
  mediaType?: string | null;
  mediaDetails?: {
    width?: number | null;
    height?: number | null;
    file?: string | null;
    sizes?: MediaSize[] | null;
  } | null;
  srcSet?: string | null;
  sizes?: string | null;
}

export interface Author extends WPNode {
  __typename?: "User";
  name: string;
  slug: string;
  uri?: string | null;
  description?: string | null;
  email?: string | null;
  avatar?: {
    url?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  url?: string | null;
  nicename?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  seo?: SEOFields | null;
  /** Per-author social profiles from ENM. */
  social?: AuthorSocial | null;
}

export interface AuthorSocial {
  facebook?: string | null;
  x?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  linkedin?: string | null;
  website?: string | null;
}

export interface Category extends WPNode {
  __typename?: "Category";
  name: string;
  slug: string;
  uri?: string | null;
  description?: string | null;
  count?: number | null;
  parent?: {
    node?: Category | null;
  } | null;
  children?: WPConnection<Category> | null;
  seo?: SEOFields | null;
}

export interface Tag extends WPNode {
  __typename?: "Tag";
  name: string;
  slug: string;
  uri?: string | null;
  description?: string | null;
  count?: number | null;
  seo?: SEOFields | null;
}

export interface RelatedPost {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  uri?: string | null;
  excerpt?: string | null;
  date?: string | null;
  modified?: string | null;
  featuredImage?: {
    node?: Media | null;
  } | null;
  categories?: {
    nodes?: Array<Pick<Category, "id" | "databaseId" | "name" | "slug" | "uri">> | null;
  } | null;
  author?: {
    node?: Pick<
      Author,
      "id" | "databaseId" | "name" | "slug" | "uri" | "avatar" | "description"
    > | null;
  } | null;
}

export interface Post extends WPNode {
  __typename?: "Post";
  title: string;
  slug: string;
  uri?: string | null;
  link?: string | null;
  excerpt?: string | null;
  content?: string | null;
  date?: string | null;
  dateGmt?: string | null;
  modified?: string | null;
  modifiedGmt?: string | null;
  status?: ContentStatus | null;
  commentStatus?: string | null;
  commentCount?: number | null;
  isSticky?: boolean | null;
  template?: {
    templateName?: string | null;
  } | null;
  featuredImage?: {
    node?: Media | null;
  } | null;
  author?: {
    node?: Author | null;
  } | null;
  categories?: WPConnection<Category> | null;
  tags?: WPConnection<Tag> | null;
  seo?: SEOFields | null;
  relatedPosts?: RelatedPost[] | null;
  /** Custom field: estimated reading minutes from CMS or computed. */
  readingTime?: number | null;
  /** Custom field: byline override. */
  byline?: string | null;
  /** Custom field: subtitle / dek. */
  subtitle?: string | null;
  /** Custom field: video embed URL. */
  videoUrl?: string | null;
  /** Custom field: location / dateline. */
  location?: string | null;
  /** Custom field: source attribution. */
  source?: string | null;
  /** Custom field: content warnings / sensitive. */
  isSensitive?: boolean | null;
  /** Custom field: premium / paywalled. */
  isPremium?: boolean | null;
}

export interface Page extends WPNode {
  __typename?: "Page";
  title: string;
  slug: string;
  uri?: string | null;
  link?: string | null;
  content?: string | null;
  excerpt?: string | null;
  date?: string | null;
  modified?: string | null;
  status?: ContentStatus | null;
  isFrontPage?: boolean | null;
  isPostsPage?: boolean | null;
  parent?: {
    node?: Page | null;
  } | null;
  children?: WPConnection<Page> | null;
  featuredImage?: {
    node?: Media | null;
  } | null;
  author?: {
    node?: Author | null;
  } | null;
  seo?: SEOFields | null;
  template?: {
    templateName?: string | null;
  } | null;
}

/** Editorial story shape used across cards, rails, and article shells. */
export interface Story {
  id: string;
  databaseId?: number;
  title: string;
  slug: string;
  uri?: string | null;
  excerpt?: string | null;
  content?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  image?: Media | null;
  category?: Pick<Category, "id" | "name" | "slug" | "uri"> | null;
  author?: Pick<Author, "id" | "name" | "slug" | "uri" | "avatar"> | null;
  readingTime?: number | null;
  isBreaking?: boolean;
  isLive?: boolean;
  isPremium?: boolean;
  href: string;
}

export interface BreakingNews {
  id: string;
  databaseId?: number;
  headline: string;
  summary?: string | null;
  href?: string | null;
  post?: RelatedPost | null;
  startedAt?: string | null;
  expiresAt?: string | null;
  priority?: number | null;
  isActive: boolean;
  label?: string | null;
}

export interface LiveStream {
  id: string;
  databaseId?: number;
  title: string;
  description?: string | null;
  embedUrl?: string | null;
  streamUrl?: string | null;
  thumbnail?: Media | null;
  isLive: boolean;
  startedAt?: string | null;
  endedAt?: string | null;
  viewerCount?: number | null;
  provider?: "youtube" | "vimeo" | "custom" | string | null;
}

export interface LiveUpdate {
  id: string;
  databaseId?: number;
  title?: string | null;
  content: string;
  publishedAt: string;
  author?: Pick<Author, "id" | "name" | "slug"> | null;
  isPinned?: boolean;
  embeds?: Array<{
    type: "image" | "video" | "tweet" | "html" | string;
    url?: string | null;
    html?: string | null;
    caption?: string | null;
  }> | null;
}

export interface LiveBlog {
  id: string;
  databaseId?: number;
  title: string;
  slug: string;
  uri?: string | null;
  summary?: string | null;
  content?: string | null;
  isLive: boolean;
  startedAt?: string | null;
  endedAt?: string | null;
  coverageEndTime?: string | null;
  featuredImage?: {
    node?: Media | null;
  } | null;
  author?: {
    node?: Author | null;
  } | null;
  updates: LiveUpdate[];
  seo?: SEOFields | null;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
  percentage?: number | null;
}

export interface Poll {
  id: string;
  databaseId?: number;
  question: string;
  options: PollOption[];
  totalVotes: number;
  endsAt?: string | null;
  isClosed?: boolean;
  allowMultiple?: boolean;
  relatedPost?: RelatedPost | null;
}

export interface SiteSettings {
  title: string;
  description?: string | null;
  url?: string | null;
  language?: string | null;
  timezone?: string | null;
  dateFormat?: string | null;
  timeFormat?: string | null;
  postsPerPage?: number | null;
  defaultCategory?: Pick<Category, "id" | "name" | "slug"> | null;
  logo?: Media | null;
  favicon?: Media | null;
  social?: {
    facebook?: string | null;
    x?: string | null;
    twitter?: string | null;
    instagram?: string | null;
    youtube?: string | null;
    linkedin?: string | null;
  } | null;
  contactEmail?: string | null;
  phone?: string | null;
  copyright?: string | null;
}

/** ENM Video CPT (graphql: Video / Videos). */
export interface Video extends WPNode {
  __typename?: "Video";
  title: string;
  slug: string;
  uri?: string | null;
  excerpt?: string | null;
  content?: string | null;
  date?: string | null;
  modified?: string | null;
  videoUrl?: string | null;
  videoEmbed?: string | null;
  videoProvider?: "youtube" | "vimeo" | "self" | "custom" | string | null;
  videoDuration?: number | null;
  videoTranscript?: string | null;
  videoIsLive?: boolean | null;
  featuredImage?: {
    node?: Media | null;
  } | null;
  author?: {
    node?: Author | null;
  } | null;
}

/** Single image in a photo story gallery (parsed from gallery JSON). */
export interface PhotoGalleryItem {
  id?: number | string | null;
  url: string;
  /** Short heading shown with the photo. */
  heading?: string | null;
  /** Optional longer description under the heading. */
  description?: string | null;
  /** Legacy caption (often mirrors heading). */
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
}

/** ENM Photo Story CPT (graphql: PhotoStory / PhotoStories). */
export interface PhotoStory extends WPNode {
  __typename?: "PhotoStory";
  title: string;
  slug: string;
  uri?: string | null;
  excerpt?: string | null;
  content?: string | null;
  date?: string | null;
  modified?: string | null;
  /** JSON string of PhotoGalleryItem[] from WP. */
  photoGallery?: string | null;
  photoCoverId?: number | null;
  photoCoverUrl?: string | null;
  photoCount?: number | null;
  featuredImage?: {
    node?: Media | null;
  } | null;
  author?: {
    node?: Author | null;
  } | null;
}

/** ENM Short CPT — vertical Reels-like clips (graphql: Short / Shorts). */
export interface Short extends WPNode {
  __typename?: "Short";
  title: string;
  slug: string;
  uri?: string | null;
  excerpt?: string | null;
  content?: string | null;
  date?: string | null;
  modified?: string | null;
  shortVideoUrl?: string | null;
  shortPosterUrl?: string | null;
  shortDuration?: number | null;
  shortAspect?: string | null;
  shortAudioUrl?: string | null;
  /** Overlay description under the title. */
  shortDescription?: string | null;
  /** youtube | video | image */
  shortMediaType?: "youtube" | "video" | "image" | string | null;
  shortSource?: "instagram" | "upload" | "youtube" | "other" | "image" | string | null;
  /** Optional related article URL (also exposed as shortArticleUrl). */
  shortCtaUrl?: string | null;
  shortCtaLabel?: string | null;
  shortArticleUrl?: string | null;
  shortArticleLabel?: string | null;
  featuredImage?: {
    node?: Media | null;
  } | null;
  author?: {
    node?: Author | null;
  } | null;
}
