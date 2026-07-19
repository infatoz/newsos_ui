import { headers } from "next/headers";
import { getPostBySlug, getRelatedPosts } from "@/services/content.service";
import { getSeoSettings, getSiteLocale } from "@/services/seo-settings.service";
import { getSiteBranding } from "@/services/branding.service";
import {
  absoluteUrl,
  ampArticlePath,
  contentPath,
  pathsEqual,
} from "@/utils/urls";
import { stripHtml } from "@/lib/utils";
import { themeConfig } from "@/config/theme";
import { resolveLocale } from "@/utils/locale";
import { readingTime } from "@/utils/reading-time";
import { GET_SCRIPTS, GET_NAVIGATION } from "@/graphql";
import { fetchQuery } from "@/services/graphql.helpers";
import type { Post, RelatedPost } from "@/types";
import {
  breadcrumbJsonLd,
  ensureIsoDate,
  newsArticleJsonLd,
  serializeJsonLd,
} from "@/seo/json-ld";

export const revalidate = 300;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeAmpHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<img([^>]*?)>/gi, (_m, attrs: string) => {
      const src = /src=["']([^"']+)["']/i.exec(attrs)?.[1];
      if (!src) return "";
      const alt = /alt=["']([^"']*)["']/i.exec(attrs)?.[1] ?? "";
      const width = /width=["']?(\d+)/i.exec(attrs)?.[1] ?? "1200";
      const height = /height=["']?(\d+)/i.exec(attrs)?.[1] ?? "675";
      return `<amp-img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="${width}" height="${height}" layout="responsive"></amp-img>`;
    });
}

function safeAmpAnalyticsConfig(
  raw: string | null | undefined,
  ga4Id: string | null | undefined,
): { json: string; typeAttr: string } | null {
  const trimmed = raw?.trim();
  if (trimmed) {
    try {
      JSON.parse(trimmed);
      return { json: trimmed, typeAttr: "" };
    } catch {
      /* fall through to GA4 */
    }
  }
  const ga4 = ga4Id?.trim();
  if (!ga4) return null;
  return {
    typeAttr: ' type="gtag" data-credentials="include"',
    json: JSON.stringify({
      vars: {
        gtag_id: ga4,
        config: {
          [ga4]: { groups: "default" },
        },
      },
      triggers: {
        trackPageview: {
          on: "visible",
          request: "pageview",
        },
      },
    }),
  };
}

interface AmpMenuItem {
  id: string;
  label?: string | null;
  url?: string | null;
  path?: string | null;
  target?: string | null;
  children?: AmpMenuItem[] | null;
}

function menuHref(item: AmpMenuItem): string {
  const path = item.path?.trim();
  const url = item.url?.trim();
  if (path?.startsWith("/")) return absoluteUrl(path);
  if (path && /^https?:\/\//i.test(path)) return path;
  if (url) {
    try {
      const parsed = new URL(url, themeConfig.siteUrl);
      if (parsed.origin === new URL(themeConfig.siteUrl).origin) {
        return absoluteUrl(`${parsed.pathname}${parsed.search}${parsed.hash}`);
      }
      return parsed.toString();
    } catch {
      return absoluteUrl(url);
    }
  }
  return absoluteUrl("/");
}

function flattenMenu(items: AmpMenuItem[] | null | undefined): AmpMenuItem[] {
  if (!items?.length) return [];
  const out: AmpMenuItem[] = [];
  for (const item of items) {
    if (item.label?.trim()) out.push(item);
    if (item.children?.length) out.push(...flattenMenu(item.children));
  }
  return out;
}

function renderAlsoRead(posts: Array<RelatedPost | Post>): string {
  if (!posts.length) return "";
  const items = posts
    .map((p) => {
      const href = absoluteUrl(contentPath(p.uri, p.slug));
      const author = p.author?.node?.name
        ? `<span class="also-author">${escapeHtml(p.author.node.name)}</span>`
        : "";
      return `<li>
  <a href="${escapeHtml(href)}">${escapeHtml(p.title)}</a>
  ${author}
</li>`;
    })
    .join("");
  return `<aside class="also-read" aria-label="Also read">
  <p class="also-label">Also read</p>
  <ul>${items}</ul>
</aside>`;
}

function renderRelatedSection(posts: Array<RelatedPost | Post>): string {
  if (!posts.length) return "";
  const items = posts
    .map((p) => {
      const href = absoluteUrl(contentPath(p.uri, p.slug));
      const ampHref = absoluteUrl(ampArticlePath(contentPath(p.uri, p.slug)));
      const thumb = p.featuredImage?.node?.sourceUrl;
      const thumbHtml = thumb
        ? `<amp-img src="${escapeHtml(thumb)}" alt="" width="120" height="80" layout="fixed"></amp-img>`
        : `<span class="related-ph"></span>`;
      const authorNode = p.author?.node;
      const authorHtml = authorNode?.name
        ? `<p class="related-author">
  ${
    authorNode.avatar?.url
      ? `<amp-img class="related-avatar" src="${escapeHtml(authorNode.avatar.url)}" alt="" width="20" height="20" layout="fixed"></amp-img>`
      : ""
  }
  <a href="${escapeHtml(absoluteUrl(authorNode.uri || `/author/${authorNode.slug}`))}">${escapeHtml(authorNode.name)}</a>
</p>`
        : "";
      const cat = p.categories?.nodes?.[0]?.name;
      return `<li class="related-item">
  <a class="related-thumb" href="${escapeHtml(ampHref)}">${thumbHtml}</a>
  <div class="related-meta">
    ${cat ? `<span class="related-cat">${escapeHtml(cat)}</span>` : ""}
    <a class="related-title" href="${escapeHtml(ampHref)}">${escapeHtml(p.title)}</a>
    ${authorHtml}
    <a class="related-full" href="${escapeHtml(href)}">Full article</a>
  </div>
</li>`;
    })
    .join("");
  return `<section class="related" aria-labelledby="related-heading">
  <h2 id="related-heading">Related articles</h2>
  <ul class="related-list">${items}</ul>
</section>`;
}

function renderAuthorBox(author: NonNullable<Post["author"]>["node"], byline?: string | null): string {
  if (!author?.name) return "";
  const name = escapeHtml(byline?.trim() || author.name);
  const href = absoluteUrl(author.uri || `/author/${author.slug}`);
  const bio = stripHtml(author.description || "").slice(0, 400);
  const avatar = author.avatar?.url
    ? `<amp-img src="${escapeHtml(author.avatar.url)}" alt="${name}" width="56" height="56" layout="fixed" class="author-avatar"></amp-img>`
    : `<span class="author-initial">${escapeHtml(author.name.charAt(0).toUpperCase())}</span>`;

  return `<aside class="author-box" aria-label="About the author">
  <h2>About the author</h2>
  <div class="author-row">
    <a href="${escapeHtml(href)}" class="author-avatar-link">${avatar}</a>
    <div class="author-copy">
      <a class="author-name" href="${escapeHtml(href)}" itemprop="author" itemscope itemtype="https://schema.org/Person">
        <span itemprop="name">${name}</span>
      </a>
      ${bio ? `<p class="author-bio">${escapeHtml(bio)}</p>` : ""}
      <a class="author-more" href="${escapeHtml(href)}">More from this author</a>
    </div>
  </div>
</aside>`;
}

/** Insert “Also read” after the 2nd paragraph (mirrors ArticleBody midRelated). */
function buildBodyWithInlineRelated(
  sanitizedHtml: string,
  midRelated: Array<RelatedPost | Post>,
): { body: string; usedIds: Set<string> } {
  const usedIds = new Set<string>();
  const mid = midRelated.slice(0, 2);
  mid.forEach((p) => usedIds.add(p.id));

  if (!mid.length) {
    return { body: sanitizedHtml, usedIds };
  }

  const chunks = sanitizedHtml.split(/(?<=<\/p>)/i).filter((c) => c.length > 0);
  if (!chunks.length) {
    return { body: sanitizedHtml + renderAlsoRead(mid), usedIds };
  }

  let blockCount = 0;
  let inserted = false;
  let out = "";
  for (const chunk of chunks) {
    out += chunk;
    if (/<\/p>/i.test(chunk)) {
      blockCount += 1;
      if (!inserted && blockCount >= 2) {
        out += renderAlsoRead(mid);
        inserted = true;
      }
    }
  }
  if (!inserted) out += renderAlsoRead(mid);
  return { body: out, usedIds };
}

type RouteContext = { params: Promise<{ slug: string }> };

interface ScriptsQuery {
  scripts?: {
    ga4MeasurementId?: string | null;
    ampAnalyticsJson?: string | null;
  } | null;
}

interface NavQuery {
  siteMenus?: {
    amp?: AmpMenuItem[] | null;
    mobileScroll?: AmpMenuItem[] | null;
    desktop?: AmpMenuItem[] | null;
  } | null;
}

/**
 * Valid AMP HTML5 document for an article.
 * Public URLs end with `/amp` (e.g. /india/slug/amp); this route is internal.
 */
export async function GET(_req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const [seo, branding, scriptsData, navData] = await Promise.all([
    getSeoSettings(),
    getSiteBranding({ revalidate: 300 }),
    fetchQuery<ScriptsQuery>(
      GET_SCRIPTS,
      {},
      { revalidate: 3600, tags: ["settings", "scripts"] },
    ).catch(() => null),
    fetchQuery<NavQuery>(
      GET_NAVIGATION,
      {},
      { revalidate: 300, tags: ["menus", "navigation"] },
    ).catch(() => null),
  ]);

  if (!seo.enableAmp || !seo.ampArticleEnabled) {
    return new Response("AMP disabled", { status: 404 });
  }

  const post = await getPostBySlug(slug, { revalidate: 300 });
  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  const articlePath = contentPath(post.uri, post.slug || slug);
  const preferredAmpPath = ampArticlePath(articlePath);
  const headerStore = await headers();
  const incoming =
    headerStore.get("x-np-pathname") || `/amp/article/${slug}`;

  if (!pathsEqual(incoming, preferredAmpPath)) {
    return Response.redirect(absoluteUrl(preferredAmpPath), 301);
  }

  let related: Array<RelatedPost | Post> = post.relatedPosts ?? [];
  if (!related.length) {
    try {
      related = await getRelatedPosts(post.databaseId, 8, { revalidate: 300 });
    } catch {
      related = [];
    }
  }

  const midRelated = related.slice(0, 4);
  const { body: bodyWithInline, usedIds } = buildBodyWithInlineRelated(
    sanitizeAmpHtml(post.content || ""),
    midRelated,
  );
  const footerRelated = related.filter((p) => !usedIds.has(p.id)).slice(0, 6);

  const menus = navData?.siteMenus;
  const ampMenuItems = flattenMenu(
    menus?.amp?.length
      ? menus.amp
      : menus?.mobileScroll?.length
        ? menus.mobileScroll
        : menus?.desktop ?? [],
  ).slice(0, 12);

  const navHtml = ampMenuItems.length
    ? `<nav class="amp-nav" aria-label="AMP menu">
  <ul>
    ${ampMenuItems
      .map((item) => {
        const href = menuHref(item);
        const target =
          item.target === "_blank" ? ' target="_blank" rel="noopener"' : "";
        return `<li><a href="${escapeHtml(href)}"${target}>${escapeHtml(item.label || "")}</a></li>`;
      })
      .join("")}
  </ul>
</nav>`
    : "";

  const logoUrl = branding.logoUrl || themeConfig.logo;
  const logoHtml = logoUrl
    ? `<amp-img src="${escapeHtml(absoluteUrl(logoUrl))}" alt="${escapeHtml(branding.siteName || themeConfig.siteName)}" width="160" height="40" layout="fixed" class="site-logo"></amp-img>`
    : "";

  const canonical = absoluteUrl(articlePath);
  const siteName = branding.siteName || themeConfig.siteName;
  const title = escapeHtml(post.title);
  const rawDescription = stripHtml(
    post.seo?.metaDesc || post.excerpt || "",
  ).slice(0, 300);
  const description = escapeHtml(rawDescription);
  const image = post.featuredImage?.node;
  const authorNode = post.author?.node;
  const authorName = post.byline?.trim() || authorNode?.name || themeConfig.defaultAuthor;
  const author = escapeHtml(authorName);
  const authorUrl = authorNode?.uri
    ? absoluteUrl(authorNode.uri)
    : authorNode?.slug
      ? absoluteUrl(`/author/${authorNode.slug}`)
      : undefined;
  const datePublished = ensureIsoDate(
    post.dateGmt || post.date || new Date().toISOString(),
  );
  const dateModified = ensureIsoDate(
    post.modifiedGmt || post.modified,
    datePublished,
  );
  const plainBody = stripHtml(post.content || "");
  const rt = readingTime(post.content || "");
  const locale = resolveLocale(
    seo.newsPublicationLanguage || (await getSiteLocale()).bcp47,
  );
  const tags = post.tags?.nodes?.map((t) => t.name).filter(Boolean) ?? [];
  const category = post.categories?.nodes?.[0];
  const section = category?.name;
  const noIndex = post.seo?.metaRobotsNoindex === "yes";
  const noFollow = post.seo?.metaRobotsNofollow === "yes";
  const robots = [
    noIndex ? "noindex" : "index",
    noFollow ? "nofollow" : "follow",
    "max-image-preview:large",
    "max-snippet:-1",
    "max-video-preview:-1",
  ].join(",");

  const imgUrl = image?.sourceUrl || branding.defaultOgImage || branding.logoUrl;
  const imgW = image?.mediaDetails?.width || 1200;
  const imgH = image?.mediaDetails?.height || 675;
  const imgAlt = escapeHtml(image?.altText || post.title);
  const favicon = escapeHtml(
    absoluteUrl(branding.faviconUrl || branding.logoUrl || "/favicon.ico"),
  );

  const hero = image?.sourceUrl
    ? `<amp-img src="${escapeHtml(image.sourceUrl)}" alt="${imgAlt}" width="${imgW}" height="${imgH}" layout="responsive"></amp-img>`
    : "";

  const authorAvatarByline = authorNode?.avatar?.url
    ? `<amp-img src="${escapeHtml(authorNode.avatar.url)}" alt="" width="36" height="36" layout="fixed" class="byline-avatar"></amp-img>`
    : "";

  const articleLd = newsArticleJsonLd({
    headline: post.title,
    description: rawDescription,
    url: canonical,
    image: image?.sourceUrl
      ? {
          url: image.sourceUrl,
          width: imgW,
          height: imgH,
          alt: image.altText,
        }
      : branding.defaultOgImage || branding.logoUrl,
    datePublished,
    dateModified,
    authorName,
    authorUrl,
    section,
    keywords: tags,
    wordCount: rt.words,
    articleBody: plainBody.slice(0, 5000),
    publisherName: siteName,
    publisherLogoUrl: branding.logoUrl || themeConfig.logo,
    inLanguage: locale.bcp47,
  });

  const crumbs = [
    { name: "Home", url: absoluteUrl("/") },
    ...(category
      ? [
          {
            name: category.name,
            url: absoluteUrl(category.uri || `/category/${category.slug}`),
          },
        ]
      : []),
    { name: post.title, url: canonical },
  ];

  const analytics = safeAmpAnalyticsConfig(
    scriptsData?.scripts?.ampAnalyticsJson,
    scriptsData?.scripts?.ga4MeasurementId,
  );

  const analyticsHead = analytics
    ? `<script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>`
    : "";
  const analyticsBody = analytics
    ? `<amp-analytics${analytics.typeAttr}>
  <script type="application/json">${analytics.json}</script>
</amp-analytics>`
    : "";

  const tagMeta = tags
    .map((t) => `<meta property="article:tag" content="${escapeHtml(t)}">`)
    .join("\n  ");

  const html = `<!doctype html>
<html ⚡ lang="${escapeHtml(locale.htmlLang)}">
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  ${analyticsHead}
  <title>${title}</title>
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" href="${favicon}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="description" content="${description}">
  <meta name="author" content="${author}">
  <meta name="robots" content="${escapeHtml(robots)}">
  <meta name="googlebot" content="${escapeHtml(robots)}">
  <meta name="googlebot-news" content="${noIndex ? "noindex,nofollow" : "index,follow"}">
  ${tags.length ? `<meta name="news_keywords" content="${escapeHtml(tags.join(", "))}">` : ""}
  <meta name="keywords" content="${escapeHtml(tags.join(", ") || section || siteName)}">
  <meta http-equiv="content-language" content="${escapeHtml(locale.bcp47)}">
  <meta name="theme-color" content="#c8102e">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:locale" content="${escapeHtml(locale.ogLocale)}">
  ${imgUrl ? `<meta property="og:image" content="${escapeHtml(imgUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(imgUrl)}">
  <meta property="og:image:width" content="${imgW}">
  <meta property="og:image:height" content="${imgH}">
  <meta property="og:image:alt" content="${imgAlt}">` : ""}
  <meta property="article:published_time" content="${escapeHtml(datePublished)}">
  <meta property="article:modified_time" content="${escapeHtml(dateModified)}">
  <meta property="article:author" content="${author}">
  ${section ? `<meta property="article:section" content="${escapeHtml(section)}">` : ""}
  ${tagMeta}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  ${imgUrl ? `<meta name="twitter:image" content="${escapeHtml(imgUrl)}">
  <meta name="twitter:image:alt" content="${imgAlt}">` : ""}
  <meta name="twitter:label1" content="Written by">
  <meta name="twitter:data1" content="${author}">
  ${section ? `<meta name="twitter:label2" content="Category">
  <meta name="twitter:data2" content="${escapeHtml(section)}">` : ""}
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
  <noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    body{font-family:Georgia,serif;margin:0;padding:0;color:#1a1a1a;background:#fff;line-height:1.6}
    .wrap{max-width:720px;margin:0 auto;padding:0 1rem}
    .site-header{border-bottom:1px solid #eee;padding:0.75rem 0;background:#fff}
    .site-brand{display:flex;align-items:center;gap:0.75rem;text-decoration:none;color:#1a1a1a}
    .site-logo{display:block;flex-shrink:0}
    .site-name{font-family:system-ui,sans-serif;font-size:1.05rem;font-weight:800;letter-spacing:-0.02em;color:#c8102e}
    .amp-nav{overflow-x:auto;-webkit-overflow-scrolling:touch;border-bottom:1px solid #eee;background:#fafafa}
    .amp-nav ul{display:flex;gap:0;list-style:none;margin:0;padding:0 0.5rem;white-space:nowrap}
    .amp-nav a{display:block;padding:0.65rem 0.75rem;font-family:system-ui,sans-serif;font-size:0.8rem;font-weight:600;text-decoration:none;color:#222;text-transform:uppercase;letter-spacing:0.03em}
    .amp-nav a:hover{color:#c8102e}
    article.wrap{padding-top:1rem;padding-bottom:1rem}
    h1{font-size:1.75rem;line-height:1.25;margin:0.5rem 0 1rem}
    .dek{font-size:1.05rem;color:#444;margin:0 0 1rem}
    .byline{display:flex;flex-wrap:wrap;align-items:center;gap:0.75rem;font-size:0.875rem;color:#555;margin:0 0 1rem;padding:0.75rem 0;border-top:1px solid #eee;border-bottom:1px solid #eee}
    .byline-avatar{border-radius:50%;overflow:hidden}
    .byline a{color:#1a1a1a;font-weight:700;text-decoration:none}
    .body p{margin:0 0 1rem}
    .body amp-img{margin:1rem 0}
    .also-read{margin:1.5rem 0;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd}
    .also-label{font-family:system-ui,sans-serif;font-size:0.65rem;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#777;margin:0 0 0.5rem}
    .also-read ul{list-style:none;margin:0;padding:0}
    .also-read li{margin:0.4rem 0}
    .also-read a{font-family:Georgia,serif;font-weight:700;color:#1a1a1a;text-decoration:underline}
    .also-author{display:block;font-family:system-ui,sans-serif;font-size:0.75rem;color:#777;margin-top:0.15rem}
    .author-box{margin:2rem 0;padding:1rem;border:1px solid #eee;background:#fafafa}
    .author-box h2{font-family:system-ui,sans-serif;font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 0.75rem;padding-bottom:0.5rem;border-bottom:1px solid #eee;color:#333}
    .author-row{display:flex;gap:0.75rem;align-items:flex-start}
    .author-avatar,.author-initial{border-radius:50%;flex-shrink:0}
    .author-initial{display:flex;align-items:center;justify-content:center;width:56px;height:56px;background:#ddd;font-family:system-ui,sans-serif;font-weight:700;font-size:1.25rem;color:#555}
    .author-name{font-family:system-ui,sans-serif;font-weight:700;font-size:1rem;color:#c8102e;text-decoration:none}
    .author-bio{font-size:0.85rem;color:#555;margin:0.35rem 0;line-height:1.45}
    .author-more{font-family:system-ui,sans-serif;font-size:0.75rem;font-weight:600;color:#c8102e}
    .related{margin:2rem 0;padding-top:1rem;border-top:2px solid #1a1a1a}
    .related h2{font-family:system-ui,sans-serif;font-size:1.1rem;font-weight:800;margin:0 0 1rem}
    .related-list{list-style:none;margin:0;padding:0}
    .related-item{display:flex;gap:0.75rem;margin:0 0 1rem;padding-bottom:1rem;border-bottom:1px solid #eee}
    .related-thumb{flex-shrink:0}
    .related-ph{display:block;width:120px;height:80px;background:#eee}
    .related-cat{font-family:system-ui,sans-serif;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#c8102e}
    .related-title{display:block;font-family:Georgia,serif;font-weight:700;font-size:1rem;line-height:1.3;color:#1a1a1a;text-decoration:none;margin:0.2rem 0}
    .related-author{display:flex;align-items:center;gap:0.35rem;font-family:system-ui,sans-serif;font-size:0.75rem;margin:0.25rem 0;color:#555}
    .related-author a{color:#555;text-decoration:none;font-weight:600}
    .related-avatar{border-radius:50%;overflow:hidden}
    .related-full{font-family:system-ui,sans-serif;font-size:0.7rem;color:#c8102e}
    a{color:#c8102e}
    .site-footer{max-width:720px;margin:1rem auto 2rem;padding:1rem;font-size:0.75rem;color:#777;border-top:1px solid #eee}
  </style>
  <script type="application/ld+json">${serializeJsonLd(articleLd)}</script>
  <script type="application/ld+json">${serializeJsonLd(breadcrumbJsonLd(crumbs))}</script>
</head>
<body>
  ${analyticsBody}
  <header class="site-header">
    <div class="wrap">
      <a class="site-brand" href="${escapeHtml(absoluteUrl("/"))}">
        ${logoHtml}
        <span class="site-name">${escapeHtml(siteName)}</span>
      </a>
    </div>
  </header>
  ${navHtml}
  <article class="wrap" itemscope itemtype="https://schema.org/NewsArticle">
    <h1 itemprop="headline">${title}</h1>
    ${rawDescription ? `<p class="dek" itemprop="description">${description}</p>` : ""}
    <div class="byline">
      ${authorAvatarByline}
      <div>
        ${
          authorUrl
            ? `<a href="${escapeHtml(authorUrl)}"><span itemprop="author" itemscope itemtype="https://schema.org/Person"><span itemprop="name">${author}</span></span></a>`
            : `<span itemprop="author" itemscope itemtype="https://schema.org/Person"><span itemprop="name">${author}</span></span>`
        }
        <div style="font-size:0.75rem;color:#777">Author</div>
      </div>
      <time itemprop="datePublished" datetime="${escapeHtml(datePublished)}">${escapeHtml(datePublished)}</time>
      <meta itemprop="dateModified" content="${escapeHtml(dateModified)}">
      ${section ? `<span itemprop="articleSection">${escapeHtml(section)}</span>` : ""}
      ${rt.minutes ? `<span>${rt.minutes} min read</span>` : ""}
    </div>
    ${hero}
    <div class="body" itemprop="articleBody" data-speakable>${bodyWithInline}</div>
    ${renderAuthorBox(authorNode, post.byline)}
    ${renderRelatedSection(footerRelated)}
  </article>
  <footer class="site-footer">
    <a href="${escapeHtml(canonical)}">View full article</a> · © ${escapeHtml(siteName)}
  </footer>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
