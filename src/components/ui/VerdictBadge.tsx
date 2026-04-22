"use client";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { lightTokens, darkTokens } from "@/theme/tokens";

interface VerdictBadgeProps {
  verdict: string;
  size?: "sm" | "md";
}

const CONFIGS = {
  SHORTLIST: { icon: "✓", label: "Shortlist" },
  PENDING: { icon: "◐", label: "Pending" },
  REJECT: { icon: "✕", label: "Reject" },
} as const;

export default function VerdictBadge({
  verdict,
  size = "md",
}: VerdictBadgeProps) {
  const theme = useTheme();
  const t = theme.palette.mode === "dark" ? darkTokens : lightTokens;

  const key = verdict?.toUpperCase() as keyof typeof CONFIGS;
  const config = CONFIGS[key] ?? CONFIGS.PENDING;

  let bg: string, color: string, border: string;
  if (key === "SHORTLIST") {
    bg = t.successSubtle;
    color = t.successText;
    border = t.successMuted;
  } else if (key === "REJECT") {
    bg = t.dangerSubtle;
    color = t.dangerText;
    border = t.dangerMuted;
  } else {
    bg = t.warningSubtle;
    color = t.warningText;
    border = t.warningMuted;
  }

  const px = size === "sm" ? "6px" : "8px";
  const py = size === "sm" ? "2px" : "4px";
  const fontSize = size === "sm" ? 11 : 12;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        px,
        py,
        borderRadius: "6px",
        bgcolor: bg,
        border: `1px solid ${border}`,
        color,
      }}
    >
      <Typography
        component="span"
        sx={{ fontSize: fontSize + 2, lineHeight: 1, fontWeight: 700, color }}
      >
        {config.icon}
      </Typography>
      <Typography
        component="span"
        sx={{ fontSize, fontWeight: 600, lineHeight: 1, color }}
      >
        {config.label}
      </Typography>
    </Box>
  );
}
