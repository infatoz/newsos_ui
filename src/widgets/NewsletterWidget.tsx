import { NewsletterForm } from "@/components/molecules/NewsletterForm";
import { cn } from "@/lib/utils";

export interface NewsletterWidgetProps {
  heading?: string | null;
  description?: string | null;
  ctaLabel?: string | null;
  formAction?: string | null;
  className?: string;
}

export function NewsletterWidget({
  heading,
  description,
  ctaLabel,
  formAction,
  className,
}: NewsletterWidgetProps) {
  return (
    <aside
      className={cn(
        "border border-[var(--np-border)] bg-[var(--np-background)] p-5",
        className,
      )}
    >
      <NewsletterForm
        heading={heading ?? undefined}
        description={description ?? undefined}
        ctaLabel={ctaLabel ?? undefined}
        action={formAction ?? undefined}
      />
    </aside>
  );
}
