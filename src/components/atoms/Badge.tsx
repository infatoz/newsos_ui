import { cn } from "@/lib/utils";

export type BadgeVariant = "category" | "live" | "breaking" | "default" | "premium";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  href?: string;
  as?: "span" | "a";
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--np-primary)]/8 text-[var(--np-primary)]",
  category:
    "bg-[var(--np-primary)] text-white uppercase tracking-wider",
  live:
    "bg-[var(--np-live)] text-white uppercase tracking-wider",
  breaking:
    "bg-[var(--np-breaking)] text-white uppercase tracking-wider",
  premium:
    "border border-[var(--np-primary)]/30 bg-transparent text-[var(--np-primary)]",
};

export function Badge({
  children,
  variant = "default",
  className,
  href,
  as,
}: BadgeProps) {
  const classes = cn(
    "inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold leading-none",
    variantClasses[variant],
    className,
  );

  const content =
    variant === "live" ? (
      <>
        <span
          className="size-1.5 animate-pulse rounded-full bg-white"
          aria-hidden
        />
        {children}
      </>
    ) : (
      children
    );

  if (href || as === "a") {
    return (
      <a href={href} className={cn(classes, "no-underline hover:opacity-90")}>
        {content}
      </a>
    );
  }

  return <span className={classes}>{content}</span>;
}
