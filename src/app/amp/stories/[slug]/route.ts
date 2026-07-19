import { getStoryBySlug } from "@/services/content.service";
import { getSeoSettings } from "@/services/seo-settings.service";
import { getSiteBranding } from "@/services/branding.service";
import { absoluteUrl } from "@/utils/urls";
import { parseStoryPages } from "@/utils/story-pages";
import { stripHtml } from "@/lib/utils";
import { resolveLocale } from "@/utils/locale";
import { webStoryJsonLd } from "@/seo/json-ld";

export const revalidate = 60;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * Google Web Story (valid AMP). Must be self-canonical for indexing.
 * @see https://developers.google.com/search/docs/appearance/enable-web-stories
 */
export async function GET(_req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const seo = await getSeoSettings();

  if (!seo.enableAmp || !seo.ampStoriesEnabled) {
    return new Response("AMP stories disabled", { status: 404 });
  }

  const story = await getStoryBySlug(slug, { revalidate: 60 });
  if (!story) {
    return new Response("Not found", { status: 404 });
  }

  const branding = await getSiteBranding({ revalidate: 300 });
  // Self-canonical — required for Web Stories on Google.
  const storyAmpUrl = absoluteUrl(`/amp/stories/${slug}`);
  const htmlUrl = absoluteUrl(story.uri || `/stories/${slug}`);
  const title = escapeHtml(story.title || "Web Story");
  const description = escapeHtml(
    story.seoDescription || stripHtml(story.excerpt || story.title || ""),
  );
  const publisher = escapeHtml(branding.siteName || "News");
  const publisherLogo = escapeHtml(absoluteUrl("/publisher-logo"));
  const poster =
    story.coverImageUrl ||
    branding.defaultOgImage ||
    absoluteUrl("/publisher-logo");
  const pages = parseStoryPages(story.pages);
  const related = (story.relatedStories ?? [])
    .filter((s) => s.databaseId !== story.databaseId)
    .slice(0, 6);

  const pagesHtml =
    pages.length > 0
      ? pages
          .map((page, index) => {
            const bg = page.imageUrl || poster;
            const pageTitle = escapeHtml(page.title || `Page ${index + 1}`);
            const body = escapeHtml(page.body || "");
            const outlink =
              page.link && /^https?:\/\//i.test(page.link)
                ? `<amp-story-page-outlink layout="nodisplay">
  <a href="${escapeHtml(page.link)}" title="${escapeHtml(page.linkLabel || "Read more")}">${escapeHtml(page.linkLabel || "Read more")}</a>
</amp-story-page-outlink>`
                : "";
            return `<amp-story-page id="page-${index}" auto-advance-after="${story.durationSeconds || 5}s">
  <amp-story-grid-layer template="fill">
    <amp-img src="${escapeHtml(bg)}" width="720" height="1280" layout="fill" alt="${pageTitle}"></amp-img>
  </amp-story-grid-layer>
  <amp-story-grid-layer template="vertical" class="bottom">
    <div class="content">
      <h1>${pageTitle}</h1>
      ${body ? `<p>${body}</p>` : ""}
    </div>
  </amp-story-grid-layer>
  ${outlink}
</amp-story-page>`;
          })
          .join("\n")
      : `<amp-story-page id="page-0" auto-advance-after="5s">
  <amp-story-grid-layer template="fill">
    <amp-img src="${escapeHtml(poster)}" width="720" height="1280" layout="fill" alt="${title}"></amp-img>
  </amp-story-grid-layer>
  <amp-story-grid-layer template="vertical" class="bottom">
    <div class="content">
      <h1>${title}</h1>
      <p>${description}</p>
    </div>
  </amp-story-grid-layer>
</amp-story-page>`;

  const bookendRelated = related.map((item) => ({
    title: item.title || "Story",
    url: absoluteUrl(item.uri || `/stories/${item.slug}`),
    image: item.coverImageUrl || poster,
  }));

  const bookend = {
    bookendVersion: "v1.0",
    shareProviders: ["twitter", "facebook", "linkedin", "email"],
    components: [
      {
        type: "heading",
        text: "More from us",
      },
      ...bookendRelated.map((item) => ({
        type: "small",
        title: item.title,
        url: item.url,
        image: item.image,
      })),
      {
        type: "cta-link",
        links: [
          { text: "All Web Stories", url: absoluteUrl("/stories") },
          { text: "Read on site", url: htmlUrl },
        ],
      },
    ],
  };

  const locale = resolveLocale(seo.newsPublicationLanguage);

  const jsonLd = webStoryJsonLd({
    headline: story.title || "Web Story",
    description: story.seoDescription || stripHtml(story.excerpt || ""),
    url: storyAmpUrl,
    image: poster,
    datePublished: story.date,
    dateModified: story.modified || story.date,
    publisherName: branding.siteName,
    publisherLogoUrl: absoluteUrl("/publisher-logo"),
    authorName: story.author?.node?.name || branding.siteName,
    inLanguage: locale.bcp47,
  });

  const html = `<!doctype html>
<html ⚡ lang="${escapeHtml(locale.htmlLang)}">
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
  <script async custom-element="amp-story-bookend" src="https://cdn.ampproject.org/v0/amp-story-bookend-0.1.js"></script>
  <title>${title}</title>
  <link rel="canonical" href="${escapeHtml(storyAmpUrl)}">
  <link rel="alternate" href="${escapeHtml(htmlUrl)}" type="text/html">
  <meta name="description" content="${description}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta http-equiv="content-language" content="${escapeHtml(locale.bcp47)}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${escapeHtml(storyAmpUrl)}">
  <meta property="og:image" content="${escapeHtml(poster)}">
  <meta property="og:locale" content="${escapeHtml(locale.ogLocale)}">
  ${story.date ? `<meta property="article:published_time" content="${escapeHtml(story.date)}">` : ""}
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
  <noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    .bottom{align-content:end;padding:1.5rem;background:linear-gradient(transparent,rgba(0,0,0,.75))}
    .content h1{font-family:Georgia,serif;color:#fff;font-size:1.75rem;line-height:1.2;margin:0 0 .5rem;text-shadow:0 1px 4px rgba(0,0,0,.55)}
    .content p{font-family:system-ui,sans-serif;color:#fff;font-size:1rem;line-height:1.45;margin:0;text-shadow:0 1px 3px rgba(0,0,0,.5)}
  </style>
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
</head>
<body>
  <amp-story standalone
    title="${title}"
    publisher="${publisher}"
    publisher-logo-src="${publisherLogo}"
    poster-portrait-src="${escapeHtml(poster)}"
    poster-square-src="${escapeHtml(poster)}"
    poster-landscape-src="${escapeHtml(poster)}">
    ${pagesHtml}
    <amp-story-bookend layout="nodisplay">
      <script type="application/json">${JSON.stringify(bookend).replace(/</g, "\\u003c")}</script>
    </amp-story-bookend>
  </amp-story>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600",
    },
  });
}
