"use client";
import { Chip } from "@mui/material";
import { memo } from "react";

export type CandidateStatus = "SHORTLIST" | "REJECT" | "PENDING";

interface StatusStyle {
  bg: string;
  color: string;
  label: string;
}

export function getCandidateStatusStyle(status: CandidateStatus): StatusStyle {
  switch (status) {
    case "SHORTLIST":
      return { bg: "#F0FDF4", color: "#4CAF50", label: "Shortlist" };
    case "REJECT":
      return { bg: "#FFF1F2", color: "#F44336", label: "Reject" };
    default:
      return { bg: "#FFF7ED", color: "#FF9800", label: "Pending" };
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
