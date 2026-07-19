import { getPhotoStories } from "@/services/media.service";
import { absoluteUrl } from "@/utils/urls";
import { responseXml, urlset } from "@/lib/sitemaps/xml";

export const revalidate = 3600;

export async function GET() {
  const photos = await getPhotoStories({ first: 200 }, { revalidate: 3600 });
  const entries = (photos.nodes ?? []).map((photo) => {
    const cover =
      photo.photoCoverUrl || photo.featuredImage?.node?.sourceUrl || null;
    return {
      loc: absoluteUrl(photo.uri || `/photos/${photo.slug}`),
      lastmod: photo.modified || photo.date,
      images: cover
        ? [{ loc: cover, title: photo.title }]
        : undefined,
    };
  });

  return responseXml(urlset(entries, { image: true }));
}
