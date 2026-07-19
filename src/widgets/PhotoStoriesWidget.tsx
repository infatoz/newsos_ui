import Image from "next/image";
import Link from "next/link";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { getImageSizes } from "@/utils/images";

export interface PhotoAlbumItem {
  id: string;
  title: string;
  href: string;
  coverUrl?: string | null;
  photoCount?: number | null;
}

export interface PhotoStoriesWidgetProps {
  albums: PhotoAlbumItem[];
  title?: string;
  className?: string;
}

export function PhotoStoriesWidget({
  albums,
  title = "Photo stories",
  className,
}: PhotoStoriesWidgetProps) {
  return (
    <aside className={cn("", className)}>
      <h2 className="mb-3 flex items-center gap-2 border-b border-[var(--np-border)] pb-2 font-heading text-sm font-bold uppercase tracking-wider text-[var(--np-primary)]">
        <Camera className="size-4" aria-hidden />
        {title}
      </h2>
      {albums.length === 0 ? (
        <p className="text-sm text-[var(--np-muted)]">No photo stories.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {albums.map((album) => {
            const sizes = getImageSizes(album.coverUrl, "card", {
              width: 400,
              height: 300,
            });
            return (
              <li key={album.id}>
                <Link
                  href={album.href}
                  className="group relative block aspect-[4/3] overflow-hidden bg-[var(--np-border)]"
                >
                  {album.coverUrl ? (
                    <Image
                      src={sizes.src}
                      alt={album.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 200px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <p className="line-clamp-2 text-xs font-semibold text-white">
                      {album.title}
                    </p>
                    {typeof album.photoCount === "number" ? (
                      <p className="mt-0.5 text-[10px] text-white/75">
                        {album.photoCount} photos
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
