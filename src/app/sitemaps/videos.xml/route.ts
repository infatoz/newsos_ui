import { getSeoSettings } from "@/services/seo-settings.service";
import {
  getVideos,
  videoSitemapFromVideos,
} from "@/services/media.service";
import { absoluteUrl } from "@/utils/urls";
import { responseXml, urlset } from "@/lib/sitemaps/xml";
import { themeConfig } from "@/config/theme";

export const revalidate = 3600;

export async function GET() {
  const seo = await getSeoSettings();
  if (!seo.enableVideoSitemap) {
    return responseXml(urlset([], { video: true }));
  }

  const videos = await getVideos({ first: 200 }, { revalidate: 3600 });
  const rows = videoSitemapFromVideos(videos.nodes ?? []);
  const fallbackThumb = absoluteUrl(themeConfig.logo);

  const entries = rows.map((row) => ({
    loc: absoluteUrl(row.pageUrl),
    lastmod: row.lastmod,
    video: {
      thumbnailLoc: row.thumbnailUrl || fallbackThumb,
      title: row.title,
      description: row.description,
      contentLoc: row.contentUrl,
      playerLoc: row.playerUrl,
      duration: row.duration,
      publicationDate: row.publicationDate,
    },
  }));

  return responseXml(urlset(entries, { video: true }));
}
