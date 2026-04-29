"use client";
import { createTheme } from "@mui/material/styles";
import { lightTokens } from "@/theme/tokens";

export function getTheme() {
  const t = lightTokens;

  return createTheme({
    palette: {
      mode: "light",
      primary: {
        main: t.brandBase,
        light: t.brandSubtle,
        dark: t.brandHover,
      },
      success: {
        main: t.successBase,
        light: t.successSubtle,
        contrastText: "#FFFFFF",
      },
      warning: {
        main: t.warningBase,
        light: t.warningSubtle,
        contrastText: "#FFFFFF",
      },
      error: {
        main: t.dangerBase,
        light: t.dangerSubtle,
        contrastText: "#FFFFFF",
      },
      background: {
        default: t.bgBase,
        paper: t.bgSurface,
      },
      text: {
        primary: t.textPrimary,
        secondary: t.textSecondary,
        disabled: t.textMuted,
      },
      divider: t.borderSubtle,
    },
    typography: {
      fontFamily: '"DM Sans", "Inter", system-ui, sans-serif',
      h1: { fontSize: "28px", fontWeight: 700 },
      h2: { fontSize: "22px", fontWeight: 600 },
      h3: { fontSize: "18px", fontWeight: 600 },
      h4: { fontSize: "15px", fontWeight: 600 },
      body1: { fontSize: "14px", fontWeight: 400 },
      body2: { fontSize: "13px", fontWeight: 400 },
      caption: { fontSize: "12px", fontWeight: 400 },
      overline: { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em" },
      button: {
        textTransform: "none",
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: t.bgBase,
            scrollbarWidth: "thin",
            scrollbarColor: `${t.borderDefault} transparent`,
            "&::-webkit-scrollbar": { width: "6px", height: "6px" },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: t.borderDefault,
              borderRadius: "3px",
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: "none",
            textTransform: "none",
            fontWeight: 500,
            "&:hover": { boxShadow: "none" },
          },
          containedPrimary: { color: "#FFFFFF" },
        },
        defaultProps: { disableElevation: true },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${t.borderSubtle}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            borderRadius: 12,
            backgroundImage: "none",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none" },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontSize: "12px",
            fontWeight: 500,
            height: 24,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: t.borderSubtle,
            fontSize: "13px",
            padding: "10px 16px",
          },
          head: {
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase" as const,
            letterSpacing: "0.06em",
            color: t.textMuted,
            backgroundColor: t.bgSurfaceAlt,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: t.bgSurface,
            borderRadius: 8,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: t.borderDefault,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: t.borderStrong,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: t.brandBase,
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { fontSize: "12px", borderRadius: 6 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontSize: "13px",
            fontWeight: 400,
            "&.Mui-selected": { fontWeight: 600 },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: t.borderSubtle },
        },
      },
    },
  });
}

export default getTheme();
