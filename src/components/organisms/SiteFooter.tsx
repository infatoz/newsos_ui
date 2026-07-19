import Link from "next/link";
import type { FooterNavGroup, FooterSettings } from "@/types";
import { themeConfig } from "@/config/theme";
import { Logo } from "@/components/atoms/Logo";
import { SocialLinks } from "@/components/molecules/SocialLinks";
import { cn } from "@/lib/utils";

export interface SiteFooterProps {
  groups?: FooterNavGroup[];
  settings?: FooterSettings | null;
  className?: string;
  logoUrl?: string | null;
  siteName?: string | null;
  siteDescription?: string | null;
}

function resolveCopyright(
  template: string | null | undefined,
  siteName: string,
  year: number,
): string {
  const raw = template?.trim();
  if (!raw) {
    return (
      themeConfig.copyright || `© ${year} ${siteName}. All rights reserved.`
    );
  }
  return raw
    .replaceAll("{year}", String(year))
    .replaceAll("{site}", siteName);
}

export function SiteFooter({
  groups = [],
  settings = null,
  className,
  logoUrl,
  siteName,
  siteDescription,
}: SiteFooterProps) {
  const year = new Date().getFullYear();
  const name = siteName || themeConfig.siteName;
  const showBrand = settings?.showBrand !== false;
  const showAbout = settings?.showAbout !== false;
  const showSocial = settings?.showSocial !== false;
  const showContact = settings?.showContact !== false;
  const showCopyright = settings?.showCopyright !== false;
  const showNewsletter = Boolean(settings?.showNewsletter);

  const about =
    settings?.aboutText?.trim() ||
    siteDescription ||
    themeConfig.siteDescription;
  const copyright = resolveCopyright(settings?.copyrightText, name, year);
  const contactEmail =
    settings?.contactEmail?.trim() || themeConfig.contactEmail;
  const contactPhone =
    settings?.contactPhone?.trim() || themeConfig.phone || "";

  const socialLinks = {
    facebook: settings?.facebookUrl?.trim() || themeConfig.facebook,
    x: settings?.xUrl?.trim() || themeConfig.x,
    instagram: settings?.instagramUrl?.trim() || themeConfig.instagram,
    youtube: settings?.youtubeUrl?.trim() || themeConfig.youtube,
    linkedin: settings?.linkedinUrl?.trim() || themeConfig.linkedin,
  };

  const newsletterAction =
    settings?.newsletterAction?.trim() ||
    (contactEmail ? `mailto:${contactEmail}` : "");

  const hasBrandCol = showBrand || showAbout || showSocial || showNewsletter;
  const hasGroups = groups.length > 0;
  const hasBottom = showCopyright || (showContact && (contactEmail || contactPhone));

  return (
    <footer
      className={cn(
        "mt-auto border-t border-[var(--np-border)] bg-[var(--np-primary)] text-white",
        className,
      )}
    >
      {hasBrandCol || hasGroups ? (
        <div
          className={cn(
            "mx-auto grid max-w-7xl gap-8 px-4 py-10",
            hasBrandCol && hasGroups
              ? "md:grid-cols-[1.2fr_2fr]"
              : "md:grid-cols-1",
          )}
        >
          {hasBrandCol ? (
            <div className="flex flex-col gap-4">
              {showBrand ? (
                <Logo
                  src={logoUrl}
                  siteName={name}
                  className="brightness-0 invert"
                  showName={!logoUrl}
                />
              ) : null}
              {showAbout && about ? (
                <p className="max-w-sm text-sm text-white/75">{about}</p>
              ) : null}
              {showSocial ? (
                <SocialLinks
                  links={socialLinks}
                  className="[&_a]:text-white [&_a:hover]:bg-white/10 [&_a:hover]:text-white"
                />
              ) : null}
              {showNewsletter ? (
                <div className="mt-2 max-w-sm">
                  {settings?.newsletterTitle ? (
                    <h3 className="mb-1 text-sm font-bold text-white">
                      {settings.newsletterTitle}
                    </h3>
                  ) : null}
                  {settings?.newsletterText ? (
                    <p className="mb-3 text-sm text-white/70">
                      {settings.newsletterText}
                    </p>
                  ) : null}
                  {newsletterAction ? (
                    <form
                      action={newsletterAction}
                      method={
                        newsletterAction.startsWith("mailto:") ? "get" : "post"
                      }
                      className="flex flex-col gap-2 sm:flex-row"
                      target={
                        newsletterAction.startsWith("http")
                          ? "_blank"
                          : undefined
                      }
                    >
                      <label className="sr-only" htmlFor="footer-newsletter-email">
                        {settings?.newsletterPlaceholder || "Email"}
                      </label>
                      <input
                        id="footer-newsletter-email"
                        type="email"
                        name="email"
                        required
                        placeholder={
                          settings?.newsletterPlaceholder || "Email address"
                        }
                        className="min-w-0 flex-1 rounded-sm border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-sm bg-white px-4 py-2 text-sm font-semibold text-[var(--np-primary)] hover:bg-white/90"
                      >
                        {settings?.newsletterButton || "Subscribe"}
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {hasGroups ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {groups.map((group) => (
                <div key={group.id}>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/90">
                    {group.title}
                  </h3>
                  {group.items.length === 0 ? (
                    <p className="text-sm text-white/50">No links</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {group.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            target={item.target}
                            className="text-sm text-white/75 hover:text-white"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasBottom ? (
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
            {showCopyright ? <p>{copyright}</p> : <span />}
            {showContact && (contactEmail || contactPhone) ? (
              <p>
                {contactEmail}
                {contactEmail && contactPhone ? " · " : null}
                {contactPhone || null}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </footer>
  );
}
