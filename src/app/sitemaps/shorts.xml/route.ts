import { getShorts } from "@/services/media.service";
import { absoluteUrl } from "@/utils/urls";
import { responseXml, urlset } from "@/lib/sitemaps/xml";
import { themeConfig } from "@/config/theme";
import { stripHtml } from "@/lib/utils";
import {
  resolveShortMediaType,
  shortHasPlayableMedia,
  shortPosterUrl,
} from "@/utils/shorts-media";

export const revalidate = 3600;

export async function GET() {
  try {
    const shorts = await getShorts({ first: 200 }, { revalidate: 3600 });
    const fallbackThumb = absoluteUrl(themeConfig.logo);

    const entries = (shorts.nodes ?? [])
      .filter((s) => shortHasPlayableMedia(s) && s.shortVideoUrl)
      .filter((s) => {
        const type = resolveShortMediaType({
          mediaType: s.shortMediaType,
          source: s.shortSource,
          videoUrl: s.shortVideoUrl,
          posterUrl: shortPosterUrl(s),
        });
        return type === "youtube" || type === "video";
      })
      .map((s) => {
        const thumb = shortPosterUrl(s) || fallbackThumb;
        return {
          loc: absoluteUrl(s.uri || `/shorts/${s.slug}`),
          lastmod: s.modified || s.date,
          video: {
            thumbnailLoc: thumb,
            title: s.title,
            description: stripHtml(s.excerpt || s.title).slice(0, 2048),
            contentLoc: s.shortVideoUrl,
            duration: s.shortDuration,
            publicationDate: s.date,
          },
        };
      });

    return responseXml(urlset(entries, { video: true }));
  } catch {
    return responseXml(urlset([], { video: true }));
  }
}
