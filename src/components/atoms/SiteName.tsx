import Link from "next/link";
import { themeConfig } from "@/config/theme";
import { cn } from "@/lib/utils";

export interface SiteNameProps {
  href?: string;
  as?: "h1" | "p" | "span";
  className?: string;
  linked?: boolean;
}

export function SiteName({
  href = "/",
  as: Tag = "span",
  className,
  linked = true,
}: SiteNameProps) {
  const name = (
    <Tag
      className={cn(
        "font-heading text-xl font-bold tracking-tight text-[var(--np-primary)]",
        className,
      )}
    >
      {themeConfig.siteName}
    </Tag>
  );

  if (!linked) return name;

  return (
    <Link href={href} className="no-underline hover:opacity-90">
      {name}
    </Link>
  );
}
