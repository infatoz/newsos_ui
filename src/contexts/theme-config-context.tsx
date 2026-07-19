"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { themeConfig, type ThemeConfig } from "@/config/theme";

const ThemeConfigContext = createContext<ThemeConfig>(themeConfig);

export function ThemeConfigProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => themeConfig, []);
  return (
    <ThemeConfigContext.Provider value={value}>
      {children}
    </ThemeConfigContext.Provider>
  );
}

export function useThemeConfig(): ThemeConfig {
  return useContext(ThemeConfigContext);
}
