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
      paper: "#FFFFFF", // Pure White
    },
    text: {
      primary: "#37474F", // Blue-Gray
      secondary: "#78909C", // Muted Gray
    },
    success: {
      main: "#2E7D32",
      light: "#E8F5E9",
    },
    warning: {
      main: "#E65100",
      light: "#FFF3E0",
    },
    divider: "#E0E0E0",
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
          border: "1px solid #E0E0E0",
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
          borderBottom: "1px solid #E0E0E0",
        },
      },
    },
  },
});

export default theme;
