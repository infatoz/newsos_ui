import Image from "next/image";
import Link from "next/link";
import { themeConfig } from "@/config/theme";
import { cn } from "@/lib/utils";

export interface LogoProps {
  href?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  /** Show site name beside the mark. */
  showName?: boolean;
  /** Override image src (WordPress logo URL). */
  src?: string | null;
  /** Override accessible / visible site name. */
  siteName?: string | null;
}

export function Logo({
  href = "/",
  className,
  width = 140,
  height = 36,
  priority = false,
  showName = false,
  src,
  siteName: siteNameProp,
}: LogoProps) {
  const logo = src?.trim() || themeConfig.logo;
  const siteName = siteNameProp?.trim() || themeConfig.siteName;
  const isRemote = /^https?:\/\//i.test(logo);
  // Cap display box so wide CMS logos stay header-sized without the
  // next/image "width or height modified" console warning (use fill).
  const boxH = Math.min(height, 36);
  const boxW = Math.min(Math.round((width / height) * boxH), 180);

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 text-[var(--np-primary)] no-underline",
        className,
      )}
      aria-label={siteName}
    >
      <span
        className="relative inline-block shrink-0"
        style={{ width: boxW, height: boxH }}
      >
        <Image
          src={logo}
          alt={siteName}
          fill
          priority={priority}
          unoptimized={isRemote && logo.endsWith(".svg")}
          sizes={`${boxW}px`}
          className="object-contain object-left"
        />
      </span>
      {showName ? (
        <span className="font-heading text-lg font-bold tracking-tight text-[var(--np-primary)]">
          {siteName}
        </span>
      ) : null}
    </Link>
  );
}
