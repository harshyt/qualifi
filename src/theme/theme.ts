"use client";
import { createTheme } from "@mui/material/styles";
import { Inter } from "next/font/google";

const inter = Inter({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2196F3", // Soft Azure
    },
    background: {
      default: "#F9FAFB", // Cloud White
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1A1A2E",   // DESIGN.md spec
      secondary: "#64748B", // DESIGN.md spec
    },
    success: {
      main: "#4CAF50",    // SHORTLIST green
      light: "#F0FDF4",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#FF9800",    // PENDING amber
      light: "#FFF7ED",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#F44336",    // REJECT red
      light: "#FFF1F2",
      contrastText: "#FFFFFF",
    },
    divider: "#E2E8F0",   // DESIGN.md spec
  },
  typography: {
    fontFamily: inter.style.fontFamily,
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        containedPrimary: {
          color: "#FFFFFF",
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "none",
          border: "1px solid #E2E8F0",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #E2E8F0",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "#E2E8F0",
        },
      },
    },
  },
});

export default theme;
