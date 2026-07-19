export type NavItemTarget = "_self" | "_blank" | "_parent" | "_top" | string;

export interface MobileNavItem {
  id: string;
  label: string;
  href: string;
  icon?: string | null;
  /** Inline SVG markup; takes precedence over Lucide `icon` name. */
  iconSvg?: string | null;
  target?: NavItemTarget;
  badge?: string | null;
  isActive?: boolean;
  children?: MobileNavItem[];
  /** Highlight as primary / breaking section. */
  isFeatured?: boolean;
  order?: number;
}

export interface MobileNavStyle {
  backgroundColor?: string | null;
  textColor?: string | null;
  hoverColor?: string | null;
  activeColor?: string | null;
  borderColor?: string | null;
}

export interface DesktopNavItem {
  id: string;
  label: string;
  href: string;
  target?: NavItemTarget;
  description?: string | null;
  children?: DesktopNavItem[];
  megaMenu?: {
    columns?: Array<{
      title?: string | null;
      items: DesktopNavItem[];
    }>;
    featured?: {
      title: string;
      href: string;
      imageUrl?: string | null;
      excerpt?: string | null;
    } | null;
  } | null;
  order?: number;
}

export interface FooterNavGroup {
  id: string;
  title: string;
  items: Array<{
    id: string;
    label: string;
    href: string;
    target?: NavItemTarget;
  }>;
}

/** Footer customization from WP News Manager → Footer. */
export interface FooterSettings {
  showBrand?: boolean | null;
  showAbout?: boolean | null;
  showSocial?: boolean | null;
  showContact?: boolean | null;
  showCopyright?: boolean | null;
  showNewsletter?: boolean | null;
  aboutText?: string | null;
  copyrightText?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  facebookUrl?: string | null;
  xUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  linkedinUrl?: string | null;
  companyTitle?: string | null;
  exploreTitle?: string | null;
  policiesTitle?: string | null;
  newsletterTitle?: string | null;
  newsletterText?: string | null;
  newsletterPlaceholder?: string | null;
  newsletterButton?: string | null;
  newsletterAction?: string | null;
}

export interface NavigationMenus {
  primary: DesktopNavItem[];
  secondary?: DesktopNavItem[];
  mobile: MobileNavItem[];
  /** Colors for the mobile bottom bar (from WP Mobile Nav settings). */
  mobileStyle?: MobileNavStyle | null;
  footer?: FooterNavGroup[];
  footerSettings?: FooterSettings | null;
  utility?: DesktopNavItem[];
  /** Trending topics strip under the header. */
  trending?: DesktopNavItem[];
  /** Horizontal scroll categories (mobile / tablet). */
  mobileScroll?: DesktopNavItem[];
}
