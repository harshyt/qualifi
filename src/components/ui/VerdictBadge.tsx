"use client";
import { useTheme } from "@mui/material/styles";
import { lightTokens, darkTokens } from "@/theme/tokens";

interface VerdictBadgeProps {
  verdict: string;
  size?: "sm" | "md";
}

export default function VerdictBadge({
  verdict,
  size = "md",
}: VerdictBadgeProps) {
  const theme = useTheme();
  const t = theme.palette.mode === "dark" ? darkTokens : lightTokens;

  const v = verdict?.toUpperCase();

  let bg: string;
  let color: string;
  let border: string;
  let icon: string;
  let label: string;

  if (v === "SHORTLIST") {
    bg = t.successSubtle;
    color = t.successText;
    border = t.successMuted;
    icon = "✓";
    label = "Shortlist";
  } else if (v === "REJECT") {
    bg = t.dangerSubtle;
    color = t.dangerText;
    border = t.dangerMuted;
    icon = "✕";
    label = "Reject";
  } else {
    bg = t.warningSubtle;
    color = t.warningText;
    border = t.warningMuted;
    icon = "◐";
    label = "Pending";
  }

  const padding = size === "sm" ? "2px 8px" : "3px 10px";
  const fontSize = size === "sm" ? 11 : 12;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
        borderRadius: 6,
        padding,
        fontSize,
        fontWeight: 500,
        lineHeight: 1.5,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: size === "sm" ? 10 : 11 }}>{icon}</span>
      {label}
    </span>
  );
}
