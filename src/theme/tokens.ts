export const lightTokens = {
  bgBase: "#FAFAF9",
  bgSurface: "#FFFFFF",
  bgSurfaceAlt: "#F5F4F2",
  bgSunken: "#EFEDE9",

  borderSubtle: "#E8E5E0",
  borderDefault: "#D4CFC8",
  borderStrong: "#B5AFA6",

  textPrimary: "#1A1714",
  textSecondary: "#6B6560",
  textMuted: "#9E9892",
  textInverse: "#FFFFFF",

  brandBase: "#3B5BDB",
  brandHover: "#3451C7",
  brandSubtle: "#EEF2FF",
  brandMuted: "#C5D0FA",

  successBase: "#2F9E44",
  successSubtle: "#EBFBEE",
  successMuted: "#B2F2BB",
  successText: "#1E6B2E",

  warningBase: "#E67700",
  warningSubtle: "#FFF9DB",
  warningMuted: "#FFE066",
  warningText: "#7D4A00",

  dangerBase: "#E03131",
  dangerSubtle: "#FFF5F5",
  dangerMuted: "#FFC9C9",
  dangerText: "#B02020",
} as const;

export const darkTokens = {
  bgBase: "#111110",
  bgSurface: "#1A1A19",
  bgSurfaceAlt: "#232321",
  bgSunken: "#0D0D0C",

  borderSubtle: "#2C2C2A",
  borderDefault: "#3A3A37",
  borderStrong: "#52524E",

  textPrimary: "#EEEEEC",
  textSecondary: "#A8A29E",
  textMuted: "#6B6560",
  textInverse: "#111110",

  brandBase: "#748FFC",
  brandHover: "#91A7FF",
  brandSubtle: "#1E2345",
  brandMuted: "#3451C7",

  successBase: "#40C057",
  successSubtle: "#0D2113",
  successMuted: "#1A3A22",
  successText: "#69DB7C",

  warningBase: "#FAB005",
  warningSubtle: "#261A00",
  warningMuted: "#3D2C00",
  warningText: "#FFD43B",

  dangerBase: "#FA5252",
  dangerSubtle: "#2A0D0D",
  dangerMuted: "#3D1515",
  dangerText: "#FF8787",
} as const;

export type ThemeTokens = typeof lightTokens;
