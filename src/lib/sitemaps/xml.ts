/**
 * XML sitemap builders (urlset, news, image, video namespaces).
 */

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface SitemapIndexEntry {
  loc: string;
  lastmod?: string | null;
}

export interface SitemapImage {
  loc: string;
  title?: string | null;
  caption?: string | null;
}

export interface SitemapNews {
  publicationName: string;
  language: string;
  title: string;
  publicationDate: string;
  keywords?: string | null;
  genres?: string | null;
}

export interface SitemapVideo {
  thumbnailLoc: string;
  title: string;
  description: string;
  contentLoc?: string | null;
  playerLoc?: string | null;
  duration?: number | null;
  publicationDate?: string | null;
}

export interface SitemapUrlEntry {
  loc: string;
  lastmod?: string | null;
  changefreq?: string | null;
  priority?: number | null;
  images?: SitemapImage[];
  news?: SitemapNews | null;
  video?: SitemapVideo | null;
}

const NS_SITEMAP = "http://www.sitemaps.org/schemas/sitemap/0.9";
const NS_NEWS = "http://www.google.com/schemas/sitemap-news/0.9";
const NS_IMAGE = "http://www.google.com/schemas/sitemap-image/1.1";
const NS_VIDEO = "http://www.google.com/schemas/sitemap-video/1.1";

export function sitemapIndex(urls: SitemapIndexEntry[]): string {
  const body = urls
    .map((entry) => {
      const lastmod = entry.lastmod
        ? `\n    <lastmod>${xmlEscape(toW3cDate(entry.lastmod))}</lastmod>`
        : "";
      return `  <sitemap>\n    <loc>${xmlEscape(entry.loc)}</loc>${lastmod}\n  </sitemap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="${NS_SITEMAP}">
${body}
</sitemapindex>`;
}

export function newsUrl(entry: {
  loc: string;
  publicationName: string;
  language: string;
  title: string;
  publicationDate: string;
  keywords?: string | null;
  genres?: string | null;
}): string {
  const genres = entry.genres
    ? `\n      <news:genres>${xmlEscape(entry.genres)}</news:genres>`
    : "";
  const keywords = entry.keywords
    ? `\n      <news:keywords>${xmlEscape(entry.keywords)}</news:keywords>`
    : "";
  return `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(entry.publicationName)}</news:name>
        <news:language>${xmlEscape(entry.language)}</news:language>
      </news:publication>${genres}
      <news:publication_date>${xmlEscape(toW3cDate(entry.publicationDate))}</news:publication_date>
      <news:title>${xmlEscape(entry.title)}</news:title>${keywords}
    </news:news>
  </url>`;
}

export function imageUrl(entry: {
  loc: string;
  lastmod?: string | null;
  images: SitemapImage[];
}): string {
  const imagesXml = entry.images
    .map((img) => {
      const title = img.title
        ? `\n      <image:title>${xmlEscape(img.title)}</image:title>`
        : "";
      const caption = img.caption
        ? `\n      <image:caption>${xmlEscape(img.caption)}</image:caption>`
        : "";
      return `    <image:image>
      <image:loc>${xmlEscape(img.loc)}</image:loc>${title}${caption}
    </image:image>`;
    })
    .join("\n");
  const lastmod = entry.lastmod
    ? `\n    <lastmod>${xmlEscape(toW3cDate(entry.lastmod))}</lastmod>`
    : "";
  return `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>${lastmod}
${imagesXml}
  </url>`;
}

export function videoUrl(entry: {
  loc: string;
  lastmod?: string | null;
  video: SitemapVideo;
}): string {
  const v = entry.video;
  const content = v.contentLoc
    ? `\n      <video:content_loc>${xmlEscape(v.contentLoc)}</video:content_loc>`
    : "";
  const player = v.playerLoc
    ? `\n      <video:player_loc>${xmlEscape(v.playerLoc)}</video:player_loc>`
    : "";
  const duration =
    typeof v.duration === "number" && v.duration > 0
      ? `\n      <video:duration>${Math.round(v.duration)}</video:duration>`
      : "";
  const pub = v.publicationDate
    ? `\n      <video:publication_date>${xmlEscape(toW3cDate(v.publicationDate))}</video:publication_date>`
    : "";
  const lastmod = entry.lastmod
    ? `\n    <lastmod>${xmlEscape(toW3cDate(entry.lastmod))}</lastmod>`
    : "";

  return `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>${lastmod}
    <video:video>
      <video:thumbnail_loc>${xmlEscape(v.thumbnailLoc)}</video:thumbnail_loc>
      <video:title>${xmlEscape(v.title)}</video:title>
      <video:description>${xmlEscape(v.description.slice(0, 2048))}</video:description>${content}${player}${duration}${pub}
    </video:video>
  </url>`;
}

export function urlset(
  urls: SitemapUrlEntry[],
  options?: { news?: boolean; image?: boolean; video?: boolean },
): string {
  const useNews = options?.news || urls.some((u) => u.news);
  const useImage = options?.image || urls.some((u) => (u.images?.length ?? 0) > 0);
  const useVideo = options?.video || urls.some((u) => u.video);

  const xmlns = [
    `xmlns="${NS_SITEMAP}"`,
    useNews ? `xmlns:news="${NS_NEWS}"` : null,
    useImage ? `xmlns:image="${NS_IMAGE}"` : null,
    useVideo ? `xmlns:video="${NS_VIDEO}"` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const body = urls
    .map((entry) => {
      if (entry.news) {
        return newsUrl({
          loc: entry.loc,
          publicationName: entry.news.publicationName,
          language: entry.news.language,
          title: entry.news.title,
          publicationDate: entry.news.publicationDate,
          keywords: entry.news.keywords,
          genres: entry.news.genres,
        });
      }
      if (entry.video) {
        return videoUrl({
          loc: entry.loc,
          lastmod: entry.lastmod,
          video: entry.video,
        });
      }
      if (entry.images?.length) {
        return imageUrl({
          loc: entry.loc,
          lastmod: entry.lastmod,
          images: entry.images,
        });
      }

      const lastmod = entry.lastmod
        ? `\n    <lastmod>${xmlEscape(toW3cDate(entry.lastmod))}</lastmod>`
        : "";
      const changefreq = entry.changefreq
        ? `\n    <changefreq>${xmlEscape(entry.changefreq)}</changefreq>`
        : "";
      const priority =
        typeof entry.priority === "number"
          ? `\n    <priority>${Math.min(1, Math.max(0, entry.priority)).toFixed(1)}</priority>`
          : "";
      return `  <url>\n    <loc>${xmlEscape(entry.loc)}</loc>${lastmod}${changefreq}${priority}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset ${xmlns}>
${body}
</urlset>`;
}

export function responseXml(body: string, revalidateSeconds = 3600): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, s-maxage=${revalidateSeconds}, stale-while-revalidate=86400`,
    },
  });
}

function toW3cDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString();
}
