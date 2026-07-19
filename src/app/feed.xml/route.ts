import { themeConfig } from "@/config/theme";
import { getPosts } from "@/services/content.service";
import { getSiteLocale } from "@/services/seo-settings.service";
import { absoluteUrl, contentPath } from "@/utils/urls";
import { stripHtml } from "@/lib/utils";

export const revalidate = 300;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const locale = await getSiteLocale({ revalidate: 3600 });
  let itemsXml = "";

  try {
    const posts = await getPosts({ first: 40 }, { revalidate: 300 });
    itemsXml = (posts.nodes ?? [])
      .map((post) => {
        const link = absoluteUrl(contentPath(post.uri, post.slug));
        const description = escapeXml(stripHtml(post.excerpt || "").slice(0, 500));
        const title = escapeXml(post.title);
        const pubDate = post.date
          ? new Date(post.date).toUTCString()
          : new Date().toUTCString();
        const image = post.featuredImage?.node?.sourceUrl;
        const enclosure = image
          ? `<enclosure url="${escapeXml(image)}" type="image/jpeg" />`
          : "";
        return `
    <item>
      <title>${title}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      ${enclosure}
    </item>`;
      })
      .join("");
  } catch {
    itemsXml = "";
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(themeConfig.siteName)}</title>
    <link>${escapeXml(themeConfig.siteUrl)}</link>
    <description>${escapeXml(themeConfig.siteDescription)}</description>
    <language>${escapeXml(locale.bcp47)}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
