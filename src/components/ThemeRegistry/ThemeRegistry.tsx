"use client";
import * as React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import NextAppDirEmotionCacheProvider from "./EmotionCache";
import { getTheme } from "@/theme/theme";

interface ThemeContextValue {
  mode: "light" | "dark";
  toggle: () => void;
}

export const ThemeContext = React.createContext<ThemeContextValue>({
  mode: "light",
  toggle: () => {},
});

export function useThemeMode() {
  return React.useContext(ThemeContext);
}

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const saved = localStorage.getItem("qualifi-color-mode") as
      | "light"
      | "dark"
      | null;
    if (saved === "light" || saved === "dark") {
      setMode(saved);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setMode("dark");
    }
  }, []);

  const toggle = React.useCallback(() => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("qualifi-color-mode", next);
      return next;
    });
  }, []);

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <NextAppDirEmotionCacheProvider options={{ key: "mui" }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </NextAppDirEmotionCacheProvider>
    </ThemeContext.Provider>
  );
}
