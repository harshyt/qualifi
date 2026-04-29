"use client";
import { Chip } from "@mui/material";
import { memo } from "react";
import { lightTokens } from "@/theme/tokens";

export type CandidateStatus = "SHORTLIST" | "REJECT" | "PENDING";

interface StatusStyle {
  bg: string;
  color: string;
  label: string;
}

export function getCandidateStatusStyle(status: CandidateStatus): StatusStyle {
  const t = lightTokens;
  switch (status) {
    case "SHORTLIST":
      return { bg: t.successSubtle, color: t.successText, label: "Shortlist" };
    case "REJECT":
      return { bg: t.dangerSubtle, color: t.dangerText, label: "Reject" };
    default:
      return { bg: t.warningSubtle, color: t.warningText, label: "Pending" };
  }
}

interface StatusChipProps {
  status: CandidateStatus;
  size?: "small" | "medium";
}

export const StatusChip = memo(function StatusChip({
  status,
  size = "small",
}: StatusChipProps) {
  const { bg, color, label } = getCandidateStatusStyle(status);
  return (
    <Chip
      label={label}
      size={size}
      sx={{
        bgcolor: bg,
        color,
        fontWeight: 700,
        fontSize: size === "small" ? 12 : 14,
        border: `1px solid ${color}30`,
      }}
    />
  );
});
