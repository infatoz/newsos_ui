import { cn } from "@/lib/utils";

export interface CustomHtmlWidgetProps {
  html: string;
  title?: string | null;
  className?: string;
}

export function CustomHtmlWidget({
  html,
  title,
  className,
}: CustomHtmlWidgetProps) {
  const trimmed = html?.trim();
  if (!trimmed) return null;

  return (
    <aside
      className={cn(
        "border border-[var(--np-border)] bg-[var(--np-surface)] p-4",
        className,
      )}
    >
      {title ? (
        <h2 className="mb-3 border-b border-[var(--np-border)] pb-2 font-heading text-sm font-bold uppercase tracking-wider text-[var(--np-primary)]">
          {title}
        </h2>
      ) : null}
      <div
        className="prose prose-sm max-w-none text-[var(--np-text)]"
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    </aside>
  );
}
