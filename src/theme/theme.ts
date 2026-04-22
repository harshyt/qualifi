import { createTheme } from "@mui/material/styles";
import { lightTokens, darkTokens } from "@/theme/tokens";

export function getTheme(mode: "light" | "dark") {
  const t = mode === "dark" ? darkTokens : lightTokens;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: t.brandBase,
      },
      success: {
        main: t.successBase,
      },
      warning: {
        main: t.warningBase,
      },
      error: {
        main: t.dangerBase,
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
      overline: {
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.08em",
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 500,
            borderRadius: 8,
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
        },
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${t.borderSubtle}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            borderRadius: 12,
            backgroundImage: "none",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            boxShadow: "none",
            border: `1px solid ${t.borderSubtle}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontSize: "12px",
            fontWeight: 500,
            borderRadius: 6,
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
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: t.textMuted,
            backgroundColor: t.bgSurfaceAlt,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: t.bgSunken,
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
          tooltip: {
            fontSize: "12px",
            borderRadius: 6,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontSize: "13px",
            fontWeight: 400,
            "&.Mui-selected": {
              fontWeight: 600,
            },
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: t.bgBase,
            scrollbarWidth: "thin" as const,
            scrollbarColor: `${t.borderDefault} transparent`,
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: t.borderDefault,
              borderRadius: "3px",
            },
          },
        },
      },
    },
  });
}

export default getTheme("light");
