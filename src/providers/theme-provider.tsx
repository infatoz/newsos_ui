"use client";

import {
  useEffect,
  useLayoutEffect,
  type ReactNode,
} from "react";
import { getCssVariables, themeConfig } from "@/config/theme";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface ThemeProviderProps {
  children: ReactNode;
  /** Optional class applied to a wrapping div (defaults to fragment-like passthrough). */
  className?: string;
}

/**
 * Injects newsroom CSS custom properties from themeConfig onto `:root`.
 * Aesthetic: professional light newsroom (deep navy + crimson accents via env).
 */
export function ThemeProvider({ children, className }: ThemeProviderProps) {
  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    const css = getCssVariables();

    for (const declaration of css.split(";")) {
      const trimmed = declaration.trim();
      if (!trimmed) continue;
      const colon = trimmed.indexOf(":");
      if (colon === -1) continue;
      const property = trimmed.slice(0, colon).trim();
      const value = trimmed.slice(colon + 1).trim();
      if (property && value) {
        root.style.setProperty(property, value);
      }
    }

    root.dataset.theme = themeConfig.theme;
    root.style.colorScheme = themeConfig.theme === "dark" ? "dark" : "light";

    // Base newsroom surface tokens
    root.style.setProperty("color", "var(--np-text)");
    root.style.setProperty("background-color", "var(--np-background)");
  }, []);

  if (className) {
    return <div className={className}>{children}</div>;
  }

  return <>{children}</>;
}

/**
 * Inline `<style>` tag for SSR so first paint has CSS variables
 * without waiting for client hydration.
 */
export function ThemeStyleTag() {
  const css = `:root { ${getCssVariables()}; color-scheme: ${
    themeConfig.theme === "dark" ? "dark" : "light"
  }; }`;

  return (
    <style
      id="np-theme-vars"
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
