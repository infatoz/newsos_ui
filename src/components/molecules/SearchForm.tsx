import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchFormProps {
  action?: string;
  method?: "get" | "post";
  name?: string;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  /** Compact header style vs full search page. */
  variant?: "header" | "page";
}

export function SearchForm({
  action = "/search",
  method = "get",
  name = "q",
  placeholder = "Search news…",
  defaultValue,
  className,
  variant = "header",
}: SearchFormProps) {
  const isPage = variant === "page";

  return (
    <form
      action={action}
      method={method}
      role="search"
      className={cn(
        "relative flex items-center",
        isPage && "w-full max-w-xl gap-2",
        className,
      )}
    >
      <label htmlFor={`search-${name}`} className="sr-only">
        Search
      </label>
      <div className={cn("relative min-w-0 flex-1", !isPage && "w-full")}>
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--np-muted)]"
          aria-hidden
        />
        <input
          id={`search-${name}`}
          type="search"
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-sm border border-[var(--np-border)] bg-[var(--np-surface)] py-1.5 pr-3 pl-8 text-sm text-[var(--np-text)] outline-none placeholder:text-[var(--np-muted)] focus:border-[var(--np-primary)] focus:ring-1 focus:ring-[var(--np-primary)]/20",
            !isPage && "min-w-0 max-w-[220px] lg:max-w-[280px]",
            isPage && "py-2.5 text-base",
          )}
        />
      </div>
      {isPage ? (
        <button
          type="submit"
          className="shrink-0 bg-[var(--np-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Search
        </button>
      ) : null}
    </form>
  );
}
