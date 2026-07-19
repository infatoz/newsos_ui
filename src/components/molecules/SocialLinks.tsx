import { themeConfig } from "@/config/theme";
import { cn } from "@/lib/utils";
import type { AuthorSocial } from "@/types";

export interface SocialLinksProps {
  className?: string;
  size?: "sm" | "md";
  /**
   * When true (default), empty keys fall back to site-wide theme social URLs.
   * Set false for author profiles so only that author's links show.
   */
  fallbackToTheme?: boolean;
  /** Hide the empty-state message (useful in compact bylines). */
  hideEmpty?: boolean;
  /** Override / provide links. */
  links?: Partial<AuthorSocial> | null;
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.176 2.097 15.943 2 14.643 2 11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.829L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function IconYoutube({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186 31.247 31.247 0 000 12.017c.01 2.046.276 4.066.502 5.831a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136c.227-1.766.492-3.785.501-5.831-.01-2.046-.275-4.066-.502-5.831zM9.545 15.568V8.466l6.545 3.551-6.545 3.551z" />
    </svg>
  );
}

function IconLinkedin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconWebsite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  );
}

const ICONS = {
  facebook: IconFacebook,
  x: IconX,
  instagram: IconInstagram,
  youtube: IconYoutube,
  linkedin: IconLinkedin,
  website: IconWebsite,
} as const;

const LABELS: Record<keyof typeof ICONS, string> = {
  facebook: "Facebook",
  x: "X",
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  website: "Website",
};

/** Normalize author / site social maps into SocialLinks `links` prop. */
export function authorSocialToLinks(
  social?: AuthorSocial | null,
): Partial<AuthorSocial> {
  if (!social) return {};
  return {
    facebook: social.facebook?.trim() || undefined,
    x: social.x?.trim() || undefined,
    instagram: social.instagram?.trim() || undefined,
    youtube: social.youtube?.trim() || undefined,
    linkedin: social.linkedin?.trim() || undefined,
    website: social.website?.trim() || undefined,
  };
}

export function SocialLinks({
  className,
  size = "sm",
  links,
  fallbackToTheme = true,
  hideEmpty = false,
}: SocialLinksProps) {
  const resolved = {
    facebook: links?.facebook || (fallbackToTheme ? themeConfig.facebook : ""),
    x: links?.x || (fallbackToTheme ? themeConfig.x : ""),
    instagram: links?.instagram || (fallbackToTheme ? themeConfig.instagram : ""),
    youtube: links?.youtube || (fallbackToTheme ? themeConfig.youtube : ""),
    linkedin: links?.linkedin || (fallbackToTheme ? themeConfig.linkedin : ""),
    website: links?.website || "",
  };

  const entries = (
    Object.entries(resolved) as Array<[keyof typeof ICONS, string]>
  ).filter(([, url]) => Boolean(url?.trim()));

  if (entries.length === 0) {
    if (hideEmpty) return null;
    return (
      <p className="text-xs text-[var(--np-muted)]">No social links configured.</p>
    );
  }

  const iconSize = size === "sm" ? "size-4" : "size-5";

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {entries.map(([key, url]) => {
        const Icon = ICONS[key];
        return (
          <li key={key}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer me"
              className="inline-flex size-8 items-center justify-center rounded-sm border border-[var(--np-border)] bg-[var(--np-surface)] text-[var(--np-primary)] transition-colors hover:border-[var(--np-accent)] hover:text-[var(--np-accent)]"
              aria-label={LABELS[key]}
              title={LABELS[key]}
            >
              <Icon className={iconSize} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
