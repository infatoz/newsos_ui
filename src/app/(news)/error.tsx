"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function NewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--np-accent)]">
        Temporary problem
      </p>
      <h1 className="mt-2 font-heading text-2xl font-bold text-[var(--np-primary)]">
        We couldn’t load this page
      </h1>
      <p className="mt-3 text-sm text-[var(--np-muted)]">
        The newsroom may be briefly unavailable. Please try again in a moment.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-[var(--np-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-[var(--np-border)] px-4 py-2 text-sm font-semibold hover:border-[var(--np-accent)]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
